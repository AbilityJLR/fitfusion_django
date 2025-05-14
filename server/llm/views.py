import anthropic
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.response import Response
from django.http import JsonResponse, StreamingHttpResponse
from api.authentication import CookieJWTAuthentication
from api.models import FitnessContent
from api.serializer import FitnessContentSerializer

from anthropic import Anthropic
import json
from dotenv import load_dotenv
import os
import logging
import uuid
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

load_dotenv()
key = os.getenv("ANTHROPIC_API_KEY")
client = Anthropic(api_key=key)

logger = logging.getLogger(__name__)

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "fitfusion-rag")
EMBEDDING_DIMENSION = 1024
MODEL_NAME = "BAAI/bge-m3"

_pinecone_client = None
_pinecone_index = None
_embedding_model = None


def init_pinecone():
    """Initialize the Pinecone client and index"""
    global _pinecone_client, _pinecone_index

    if not PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY environment variable is not set")

    if _pinecone_client is None:
        _pinecone_client = Pinecone(api_key=PINECONE_API_KEY)

        try:
            existing_indexes = _pinecone_client.list_indexes().names()
            if PINECONE_INDEX_NAME not in existing_indexes:
                logger.info(f"Creating Pinecone index: {PINECONE_INDEX_NAME}")
                _pinecone_client.create_index(
                    name=PINECONE_INDEX_NAME,
                    dimension=EMBEDDING_DIMENSION,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1",
                    ),
                )
                logger.info(f"Pinecone index {PINECONE_INDEX_NAME} created")
            else:
                logger.info(f"Using existing Pinecone index: {PINECONE_INDEX_NAME}")

            _pinecone_index = _pinecone_client.Index(PINECONE_INDEX_NAME)
        except Exception as e:
            logger.error(f"Error initializing Pinecone: {str(e)}")
            raise


def get_embedding_model():
    """Get or initialize the embedding model"""
    global _embedding_model

    if _embedding_model is None:
        logger.info(f"Loading embedding model: {MODEL_NAME}")
        _embedding_model = SentenceTransformer(MODEL_NAME)

    return _embedding_model


def get_embedding(text):
    """Get embedding for text using the model"""
    if not text:
        raise ValueError("Text cannot be empty")

    model = get_embedding_model()
    return model.encode(text).tolist()


def upsert_fitness_content(fitness_content):
    """Upsert fitness content embedding to Pinecone"""
    if (
        not fitness_content
        or not hasattr(fitness_content, "title")
        or not fitness_content.title
    ):
        raise ValueError("Invalid fitness content")

    if _pinecone_index is None:
        init_pinecone()

    embedding_id = fitness_content.embedding_id or f"fitness-{uuid.uuid4()}"

    text_to_embed = f"Title: {fitness_content.title}\nDescription: {fitness_content.description or ''}\n"
    text_to_embed += f"Type: {fitness_content.content_type}\n"

    if (
        hasattr(fitness_content, "equipment_required")
        and fitness_content.equipment_required
    ):
        text_to_embed += f"Equipment: {fitness_content.equipment_required}\n"

    if hasattr(fitness_content, "target_muscles") and fitness_content.target_muscles:
        text_to_embed += f"Target Muscles: {fitness_content.target_muscles}\n"

    embedding = get_embedding(text_to_embed)

    metadata = {
        "title": fitness_content.title,
        "description": fitness_content.description or "",
        "content_type": fitness_content.content_type,
        "difficulty_level": getattr(fitness_content, "difficulty_level", 2),
        "url": getattr(fitness_content, "url", "") or "",
        "youtube_url": getattr(fitness_content, "youtube_url", "") or "",
        "equipment_required": getattr(fitness_content, "equipment_required", "") or "",
        "duration_minutes": getattr(fitness_content, "duration_minutes", 0) or 0,
        "calories_burned": getattr(fitness_content, "calories_burned", 0) or 0,
        "target_muscles": getattr(fitness_content, "target_muscles", "") or "",
    }

    try:
        _pinecone_index.upsert(vectors=[(embedding_id, embedding, metadata)])
        logger.info(
            f"Upserted content '{fitness_content.title}' to Pinecone (ID: {embedding_id})"
        )
        return embedding_id
    except Exception as e:
        logger.error(f"Error upserting to Pinecone: {str(e)}")
        raise


def search_fitness_content(
    query_text, content_type=None, difficulty_level=None, filter_dict=None, top_k=5
):
    """Search fitness content in Pinecone"""
    if not query_text:
        raise ValueError("Query text cannot be empty")

    if _pinecone_index is None:
        init_pinecone()

    query_embedding = get_embedding(query_text)

    filter_conditions = filter_dict or {}
    if content_type:
        filter_conditions["content_type"] = content_type
    if difficulty_level is not None:
        filter_conditions["difficulty_level"] = difficulty_level

    try:
        results = _pinecone_index.query(
            vector=query_embedding,
            filter=filter_conditions if filter_conditions else None,
            top_k=min(top_k, 100),
            include_metadata=True,
        )

        formatted_results = []
        for match in results.matches:
            formatted_results.append(
                {"id": match.id, "score": match.score, "metadata": match.metadata}
            )

        logger.info(f"Search '{query_text}' returned {len(formatted_results)} results")
        return formatted_results
    except Exception as e:
        logger.error(f"Error searching Pinecone: {str(e)}")
        raise


def delete_embedding(embedding_id):
    if not embedding_id:
        raise ValueError("Embedding ID cannot be empty")

    if _pinecone_index is None:
        init_pinecone()

    try:
        _pinecone_index.delete(ids=[embedding_id])
        logger.info(f"Deleted embedding from Pinecone (ID: {embedding_id})")
    except Exception as e:
        logger.error(f"Error deleting from Pinecone: {str(e)}")
        raise


def bulk_delete_embeddings(embedding_ids):
    if not embedding_ids:
        return

    if _pinecone_index is None:
        init_pinecone()

    batch_size = 100
    for i in range(0, len(embedding_ids), batch_size):
        batch = embedding_ids[i : i + batch_size]
        try:
            _pinecone_index.delete(ids=batch)
            logger.info(f"Deleted batch of {len(batch)} embeddings from Pinecone")
        except Exception as e:
            logger.error(f"Error deleting batch from Pinecone: {str(e)}")
            raise


init_pinecone()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def recommendations_view(request):
    try:
        current_user = request.user

        age = current_user.age or "unspecified"
        occupation = current_user.occupation or "unspecified"
        about_me = current_user.about_me or ""

        physical_profile = getattr(current_user, "physical_profile", None)
        height_cm = (
            getattr(physical_profile, "height", "unspecified")
            if physical_profile
            else "unspecified"
        )
        weight_kg = (
            getattr(physical_profile, "weight", "unspecified")
            if physical_profile
            else "unspecified"
        )
        gender = (
            getattr(physical_profile, "gender", "unspecified")
            if physical_profile
            else "unspecified"
        )
        body_fat = (
            getattr(physical_profile, "body_fat", "unspecified")
            if physical_profile
            else "unspecified"
        )
        body_mass = (
            getattr(physical_profile, "body_mass", "unspecified")
            if physical_profile
            else "unspecified"
        )
        health_condition = (
            getattr(physical_profile, "health_condition", "none")
            if physical_profile
            else "none"
        )

        fitness_profile = getattr(current_user, "fitness_profile", None)
        fitness_level_obj = (
            getattr(fitness_profile, "fitness_level", 2) if fitness_profile else 2
        )
        fitness_level_map = {
            1: "beginner",
            2: "intermediate",
            3: "advanced",
            4: "expert",
            5: "professional",
        }
        fitness_level = fitness_level_map.get(fitness_level_obj, "intermediate")
        workout_frequency = (
            getattr(fitness_profile, "workout_frequency", 3) if fitness_profile else 3
        )
        workout_duration = (
            getattr(fitness_profile, "workout_duration", 30) if fitness_profile else 30
        )
        workout_intensity = (
            getattr(fitness_profile, "workout_intensity", 5) if fitness_profile else 5
        )
        workout_type = (
            getattr(fitness_profile, "workout_type", "general exercise")
            if fitness_profile
            else "general exercise"
        )
        workout_equipment = (
            getattr(fitness_profile, "workout_equipment", "") if fitness_profile else ""
        )
        workout_style = (
            getattr(fitness_profile, "workout_style", "") if fitness_profile else ""
        )
        workout_goal = (
            getattr(fitness_profile, "workout_goal", "general fitness")
            if fitness_profile
            else "general fitness"
        )
        health_goal = (
            getattr(fitness_profile, "health_goal", "general health")
            if fitness_profile
            else "general health"
        )

        dietary_profile = getattr(current_user, "dietary_profile", None)
        diet_preference = (
            getattr(dietary_profile, "diet_preference", "balanced nutrition")
            if dietary_profile
            else "balanced nutrition"
        )
        diet_allergies = (
            getattr(dietary_profile, "diet_allergies", "none")
            if dietary_profile
            else "none"
        )
        diet_restrictions = (
            getattr(dietary_profile, "diet_restrictions", "none")
            if dietary_profile
            else "none"
        )
        diet_preferences = (
            getattr(dietary_profile, "diet_preferences", "none")
            if dietary_profile
            else "none"
        )
        diet_goal = (
            getattr(dietary_profile, "diet_goal", "balanced nutrition")
            if dietary_profile
            else "balanced nutrition"
        )

        fitness_goals = f"{workout_goal}, {health_goal}".strip(", ")
        nutritional_goals = diet_goal

        user_profile = {
            "personalInfo": {
                "age": age,
                "occupation": occupation,
                "gender": gender,
                "aboutMe": about_me,
            },
            "physicalAttributes": {
                "height": height_cm,
                "weight": weight_kg,
                "bodyFatPercentage": body_fat,
                "bodyMass": body_mass,
            },
            "fitnessProfile": {
                "fitnessLevel": fitness_level,
                "workoutFrequency": workout_frequency,
                "workoutDuration": workout_duration,
                "workoutIntensity": workout_intensity,
                "workoutType": workout_type,
                "workoutEquipment": workout_equipment,
                "workoutStyle": workout_style,
                "workoutGoal": workout_goal,
                "healthGoal": health_goal,
            },
            "nutrition": {
                "dietPreference": diet_preference,
                "dietAllergies": diet_allergies,
                "dietRestrictions": diet_restrictions,
                "dietPreferences": diet_preferences,
                "dietGoal": diet_goal,
            },
            "additionalInfo": {"healthCondition": health_condition},
        }

        specific_user_instructions = f"""
CRITICAL REQUIREMENT: You MUST include these EXACT values from the user's profile in your recommendations:

- Age: {age} years old
- Gender: {gender}
- Weight: {weight_kg} kg
- Height: {height_cm} cm
- Body Fat: {body_fat}%
- Body Mass: {body_mass}kg
- Fitness Level: {fitness_level}
- Workout Frequency: {workout_frequency} days/week
- Workout Duration: {workout_duration} minutes
- Workout Intensity: {workout_intensity}/10
- Workout Type: {workout_type}
- Workout Equipment: {workout_equipment}
- Workout Style: {workout_style}
- Workout Goal: {workout_goal}
- Health Goal: {health_goal}
- Diet Preference: {diet_preference}
- Diet Allergies: {diet_allergies}
- Diet Restrictions: {diet_restrictions}
- Diet Preferences: {diet_preferences}
- Diet Goal: {diet_goal}
- Health Condition: {health_condition}

DO NOT use generic phrases like "based on your profile" or "according to your data."
INSTEAD, directly insert the actual values like "With your weight of {weight_kg}kg and body fat of {body_fat}%..."

You MUST mention at least 3-4 of these specific values in EACH recommendation category.
"""

        prompt = f"""Given the following specific user profile:
{json.dumps(user_profile, indent=2)}

{specific_user_instructions}

Create highly personalized fitness recommendations that demonstrate you have considered this SPECIFIC user's unique data.

IMPORTANT FORMATTING REQUIREMENTS:
- "frequency" and "duration" fields MUST be EXTREMELY short (max 15 characters)
- Example frequency: "3x/week" (not "3 times per week")
- Example duration: "45-60 min" (not "45-60 minutes")
- Keep these values brief and compact
- Move detailed explanations to the "description" field instead

Return your recommendations as a valid JSON object following this structure:
{{
  "workoutRecommendations": [
    {{
      "category": "Strength Training",
      "frequency": "KEEP VERY SHORT (e.g., '{workout_frequency}x/week')",
      "duration": "KEEP VERY SHORT (e.g., '{workout_duration} min')",
      "description": "Explicitly mention their weight of {weight_kg}kg and their workout goal of {workout_goal}",
      "focus": "Focus areas that directly reference their preferred workout type: {workout_type}"
    }},
    {{
      "category": "Cardio",
      "frequency": "KEEP VERY SHORT (e.g., '2-3x/week')",
      "duration": "KEEP VERY SHORT (e.g., '20-30 min')",
      "description": "Cardio recommendation that mentions their specific age of {age}, gender {gender}, and their {body_fat}% body fat",
      "intensity": "Intensity level appropriate for their {fitness_level} fitness level and {workout_intensity}/10 intensity preference"
    }},
    {{
      "category": "Recovery",
      "frequency": "KEEP VERY SHORT (e.g., 'Daily')",
      "duration": "KEEP VERY SHORT (e.g., '10-15 min')",
      "description": "Recovery approach that mentions their specific health goal of {health_goal} and health condition: {health_condition}"
    }}
  ],
  "nutritionRecommendations": [
    {{
      "category": "Protein Intake",
      "recommendation": "Specific protein recommendation that mentions their weight of {weight_kg}kg and body fat of {body_fat}%, considering their diet preference: {diet_preference}",
      "reasoning": "Reasoning that ties to their specific workout goal of {workout_goal}"
    }},
    {{
      "category": "Meal Timing",
      "recommendation": "Meal timing advice that references their {workout_frequency} days/week workout schedule and {workout_duration} minute sessions",
      "reasoning": "Explain why this timing works for someone with their specific {fitness_level} fitness level and diet goal: {diet_goal}"
    }},
    {{
      "category": "Hydration",
      "recommendation": "Specific hydration advice for someone weighing {weight_kg}kg with {body_fat}% body fat",
      "reasoning": "Connect hydration to their specific health goal of {health_goal}"
    }}
  ],
  "lifestyleRecommendations": [
    {{
      "category": "Sleep",
      "recommendation": "Sleep recommendation that mentions their age of {age} and occupation as {occupation}",
      "reasoning": "Connect sleep to their specific workout goal of {workout_goal}"
    }},
    {{
      "category": "Stress Management",
      "recommendation": "Stress management advice that references their occupation as {occupation} and their health condition: {health_condition}",
      "reasoning": "Explain how stress management helps with their specific health goal of {health_goal}"
    }}
  ],
  "detailedWeeklySchedule": {{
    "monday": {{
      "focus": "FOCUS AREA (e.g., 'Chest & Triceps')",
      "description": "Short description referencing their weight of {weight_kg}kg and workout goal of {workout_goal}",
      "exercises": [
        {{
          "name": "Specific exercise name",
          "sets": "3-4",
          "reps": "8-12",
          "intensity": "Moderate",
          "notes": "Brief note mentioning their {fitness_level} fitness level"
        }},
        {{
          "name": "Another specific exercise",
          "sets": "2-3",
          "reps": "10-15",
          "intensity": "Light-Moderate",
          "notes": "Note referencing their equipment: {workout_equipment}"
        }},
        {{
          "name": "Third specific exercise",
          "sets": "3",
          "reps": "Until failure",
          "intensity": "High",
          "notes": "Note mentioning their {workout_intensity}/10 intensity preference"
        }}
      ],
      "cardio": {{
        "type": "Specific cardio activity",
        "duration": "KEEP VERY SHORT (e.g., '15-20 min')",
        "intensity": "Moderate",
        "notes": "Brief cardio note referencing their age of {age}"
      }}
    }},
    "tuesday": {{
      "focus": "FOCUS AREA (e.g., 'Recovery or Light Activity')",
      "description": "Recovery day description mentioning their health condition: {health_condition}",
      "exercises": [
        {{
          "name": "Gentle recovery exercise",
          "sets": "1-2",
          "reps": "10-15",
          "intensity": "Light",
          "notes": "Brief note about recovery importance for their specific stats"
        }},
        {{
          "name": "Mobility work",
          "sets": "2",
          "reps": "10 per side",
          "intensity": "Very Light",
          "notes": "Note about flexibility for someone of their age ({age})"
        }}
      ],
      "cardio": {{
        "type": "Light recovery cardio",
        "duration": "KEEP VERY SHORT (e.g., '10-15 min')",
        "intensity": "Light",
        "notes": "Brief note about active recovery for their {fitness_level} level"
      }}
    }},
    "wednesday": {{
      "focus": "FOCUS AREA (e.g., 'Back & Biceps')",
      "description": "Back workout description referencing their workout goal of {workout_goal}",
      "exercises": [
        {{
          "name": "Specific back exercise",
          "sets": "3-4",
          "reps": "8-12",
          "intensity": "Moderate-High",
          "notes": "Brief note referencing their weight of {weight_kg}kg"
        }},
        {{
          "name": "Another back exercise",
          "sets": "3",
          "reps": "10-12",
          "intensity": "Moderate",
          "notes": "Note referencing their {fitness_level} fitness level"
        }},
        {{
          "name": "Bicep exercise",
          "sets": "3",
          "reps": "12-15",
          "intensity": "Moderate",
          "notes": "Note mentioning their workout style: {workout_style}"
        }}
      ],
      "cardio": {{
        "type": "Specific cardio activity",
        "duration": "KEEP VERY SHORT (e.g., '20 min')",
        "intensity": "Moderate",
        "notes": "Brief cardio note referencing their {body_fat}% body fat"
      }}
    }},
    "thursday": {{
      "focus": "FOCUS AREA (e.g., 'Recovery or Flexibility')",
      "description": "Recovery description mentioning their health goal: {health_goal}",
      "exercises": [
        {{
          "name": "Stretching routine",
          "sets": "1",
          "reps": "Hold 30s each",
          "intensity": "Light",
          "notes": "Brief note about flexibility benefits for their body type"
        }},
        {{
          "name": "Mobility exercise",
          "sets": "2",
          "reps": "10 per side",
          "intensity": "Light",
          "notes": "Note about joint health for their age of {age}"
        }}
      ],
      "cardio": {{
        "type": "Very light cardio",
        "duration": "KEEP VERY SHORT (e.g., '10 min')",
        "intensity": "Very Light",
        "notes": "Brief note about active recovery importance"
      }}
    }},
    "friday": {{
      "focus": "FOCUS AREA (e.g., 'Legs & Shoulders')",
      "description": "Leg day description mentioning their weight of {weight_kg}kg and body mass of {body_mass}kg",
      "exercises": [
        {{
          "name": "Compound leg exercise",
          "sets": "4",
          "reps": "8-10",
          "intensity": "High",
          "notes": "Brief note referencing their weight and fitness level"
        }},
        {{
          "name": "Isolation leg exercise",
          "sets": "3",
          "reps": "12-15",
          "intensity": "Moderate",
          "notes": "Note about leg development for their goals"
        }},
        {{
          "name": "Shoulder exercise",
          "sets": "3",
          "reps": "10-12",
          "intensity": "Moderate",
          "notes": "Note mentioning their workout equipment: {workout_equipment}"
        }}
      ],
      "cardio": {{
        "type": "Brief cardio finisher",
        "duration": "KEEP VERY SHORT (e.g., '10 min')",
        "intensity": "High",
        "notes": "Brief note about HIIT benefits for their {body_fat}% body fat"
      }}
    }},
    "saturday": {{
      "focus": "FOCUS AREA (e.g., 'Full Body or Weak Points')",
      "description": "Full body session mentioning their {workout_frequency} days/week routine and {workout_duration} minute sessions",
      "exercises": [
        {{
          "name": "Full body exercise 1",
          "sets": "3",
          "reps": "10-12",
          "intensity": "Moderate-High",
          "notes": "Brief note about compound movements for their goals"
        }},
        {{
          "name": "Targeted weakness exercise",
          "sets": "3",
          "reps": "12-15",
          "intensity": "Moderate",
          "notes": "Note about addressing specific needs based on their profile"
        }},
        {{
          "name": "Core-focused exercise",
          "sets": "3",
          "reps": "15-20",
          "intensity": "Moderate",
          "notes": "Note about core strength for their {body_fat}% body fat"
        }}
      ],
      "cardio": {{
        "type": "Enjoyable cardio activity",
        "duration": "KEEP VERY SHORT (e.g., '20-30 min')",
        "intensity": "Moderate",
        "notes": "Brief note about cardiovascular health for their age of {age}"
      }}
    }},
    "sunday": {{
      "focus": "Rest & Recovery",
      "description": "Complete rest day approach for someone with their {fitness_level} fitness level and health condition: {health_condition}",
      "exercises": [
        {{
          "name": "Light walking",
          "sets": "1",
          "reps": "N/A",
          "intensity": "Very Light",
          "notes": "Brief note about importance of complete recovery"
        }},
        {{
          "name": "Gentle stretching",
          "sets": "1",
          "reps": "Hold 30s each",
          "intensity": "Very Light",
          "notes": "Note about preparing body for next week's training"
        }}
      ],
      "cardio": {{
        "type": "None required",
        "duration": "0 min",
        "intensity": "Rest",
        "notes": "Brief note about recovery being essential to progress"
      }}
    }}
  }}
}}"""

        system_prompt = f"""You are a fitness expert assistant creating HIGHLY PERSONALIZED recommendations that are SPECIFICALLY TAILORED to THIS INDIVIDUAL USER ONLY.

YOUR TOP PRIORITY is to create recommendations that are COMPLETELY UNIQUE to this specific user with ZERO generic advice:
- EVERY recommendation MUST directly incorporate MULTIPLE specific data points from this user's profile
- NEVER provide generic fitness advice that could apply to anyone
- ALWAYS reference their exact metrics in your recommendations

You MUST incorporate these EXACT user-specific values throughout ALL recommendations:
- Their exact weight of {weight_kg}kg - use this specific number, not a range or approximation
- Their specific body fat percentage of {body_fat}% - reference this exact percentage
- Their body mass of {body_mass}kg - use this specific measurement
- Their gender: {gender} - tailor exercises appropriately for their gender
- Their exact age: {age} - adjust recommendations for their specific age group
- Their specific health condition: {health_condition} - modify exercises to accommodate this condition

Their precise fitness goals and preferences:
- Workout goal: {workout_goal} - structure ALL recommendations to achieve THIS specific goal
- Health goal: {health_goal} - ensure recommendations support THIS specific health outcome
- Workout type preference: {workout_type} - prioritize these types of exercises
- Workout equipment: {workout_equipment} - ONLY suggest exercises using this equipment
- Workout style: {workout_style} - match the workout structure to this preference
- Workout frequency: {workout_frequency} days/week - design schedule for exactly this frequency
- Workout duration: {workout_duration} minutes - keep sessions within this timeframe
- Intensity preference: {workout_intensity}/10 - match intensity to this exact level

Their specific dietary needs:
- Diet preference: {diet_preference} - all nutrition advice must respect this preference
- Diet allergies: {diet_allergies} - never recommend foods that conflict with these
- Diet restrictions: {diet_restrictions} - all recommendations must accommodate these
- Diet preferences: {diet_preferences} - prioritize these food preferences
- Diet goal: {diet_goal} - align all nutrition advice with this specific goal

CRITICAL FORMATTING REQUIREMENT:
- The "frequency" and "duration" fields MUST be EXTREMELY SHORT (max 15 characters)
- Use abbreviated formats like "3x/week" instead of "3 times per week"
- Use "45-60 min" instead of "45-60 minutes"
- Put detailed explanations in the description field instead

YOUR DETAILED WEEKLY SCHEDULE MUST BE HYPER-PERSONALIZED:
- Create a realistic 7-day schedule SPECIFICALLY designed for this person's unique profile
- Adapt the exercise focus days based on THEIR preferred workout type: {workout_type}
- Include exact exercise names that are appropriate for THEIR fitness level: {fitness_level}
- Provide specific sets, reps, and intensity guidance tailored to THEIR capabilities
- Include ONLY exercises possible with THEIR available equipment: {workout_equipment}
- Ensure exercises align with THEIR specific workout goal: {workout_goal}
- Include appropriate rest days based on THEIR specific health condition: {health_condition}
- Set intensity levels appropriate for THEIR {workout_intensity}/10 intensity preference
- Duration of workouts should align with THEIR preferred {workout_duration} minutes
- Consider THEIR age of {age} when selecting exercise difficulty and recovery needs
- Account for THEIR weight of {weight_kg}kg and body fat of {body_fat}% when choosing exercises

NEVER use placeholders, generic terms, or one-size-fits-all advice.
EVERY single recommendation must be crafted EXCLUSIVELY for this specific individual.
IMPORTANT:Your response must be ONLY valid JSON that follows the requested structure.
"""

        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=10000,
            temperature=0.7,
            system=system_prompt,
            messages=[{"role": "user", "content": [{"type": "text", "text": prompt}]}],
        )

        response_text = message.content[0].text

        json_start = response_text.find("{")
        json_end = response_text.rfind("}") + 1

        if json_start >= 0 and json_end > json_start:
            json_str = response_text[json_start:json_end]
            try:
                recommendations = json.loads(json_str)
                return Response(recommendations)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse AI response as JSON: {response_text}")
                return Response(
                    {"error": "Failed to parse AI recommendations"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            logger.error(f"No JSON found in AI response: {response_text}")
            return Response(
                {"error": "Invalid AI response format"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    except Exception as e:
        logger.error(f"Error generating AI recommendations: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def search_content_view(request):
    try:
        data = request.data
        query = data.get("query", "")

        if not query:
            return Response(
                {"error": "Query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = data.get("content_type", None)
        difficulty_level = data.get("difficulty_level", None)
        filter_dict = data.get("filters", {})
        top_k = data.get("limit", 5)

        results = search_fitness_content(
            query_text=query,
            content_type=content_type,
            difficulty_level=difficulty_level,
            filter_dict=filter_dict,
            top_k=top_k,
        )

        return Response(results)

    except Exception as e:
        logger.error(f"Error searching content: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def upsert_content_view(request):
    try:
        data = request.data

        if not data.get("title"):
            return Response(
                {"error": "Title is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        if not data.get("content_type"):
            return Response(
                {"error": "Content type is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        class FitnessContent:
            pass

        content = FitnessContent()
        content.title = data.get("title")
        content.description = data.get("description", "")
        content.content_type = data.get("content_type")
        content.embedding_id = data.get("embedding_id", None)
        content.difficulty_level = data.get("difficulty_level", 2)
        content.url = data.get("url", "")
        content.youtube_url = data.get("youtube_url", "")
        content.equipment_required = data.get("equipment_required", "")
        content.duration_minutes = data.get("duration_minutes", 0)
        content.calories_burned = data.get("calories_burned", 0)
        content.target_muscles = data.get("target_muscles", "")

        embedding_id = upsert_fitness_content(content)

        return Response({"success": True, "embedding_id": embedding_id})

    except Exception as e:
        logger.error(f"Error upserting content: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def delete_content_view(request, embedding_id=None):
    try:
        if not embedding_id:
            data = request.data
            embedding_id = data.get("embedding_id")

            if not embedding_id:
                return Response(
                    {"error": "Embedding ID is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        delete_embedding(embedding_id)

        return Response({"success": True})

    except Exception as e:
        logger.error(f"Error deleting content: {str(e)}")
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def fitness_content_search(request):
    query = request.GET.get("query", "")
    content_type = request.GET.get("content_type", None)
    difficulty_level = request.GET.get("difficulty_level", None)

    if not query:
        return Response(
            {"message": "Query parameter is required", "status": "error"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        if difficulty_level and difficulty_level.isdigit():
            difficulty_level = int(difficulty_level)

        results = search_fitness_content(
            query_text=query,
            content_type=content_type,
            difficulty_level=difficulty_level,
            top_k=10,
        )

        return Response({"results": results, "status": "success"})

    except Exception as e:
        logger.error(f"Error searching fitness content: {str(e)}")
        return Response(
            {
                "message": f"Error searching fitness content: {str(e)}",
                "status": "error",
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET", "POST", "PUT", "DELETE"])
@permission_classes([IsAuthenticated, IsAdminUser])
@authentication_classes([CookieJWTAuthentication])
def fitness_content_management(request, content_id=None):
    if request.method == "GET":
        if content_id:
            try:
                content = FitnessContent.objects.get(id=content_id)
                serializer = FitnessContentSerializer(content)
                return Response(serializer.data)
            except FitnessContent.DoesNotExist:
                return Response(
                    {"message": "Fitness content not found", "status": "error"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            content_type = request.GET.get("content_type", None)
            difficulty_level = request.GET.get("difficulty_level", None)

            queryset = FitnessContent.objects.all()

            if content_type:
                queryset = queryset.filter(content_type=content_type)

            if difficulty_level and difficulty_level.isdigit():
                queryset = queryset.filter(difficulty_level=int(difficulty_level))

            serializer = FitnessContentSerializer(queryset, many=True)
            return Response(serializer.data)

    elif request.method == "POST":
        serializer = FitnessContentSerializer(data=request.data)
        if serializer.is_valid():
            fitness_content = serializer.save()

            try:
                embedding_id = upsert_fitness_content(fitness_content)

                fitness_content.embedding_id = embedding_id
                fitness_content.save()

                return Response(
                    FitnessContentSerializer(fitness_content).data,
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                logger.error(f"Error creating embeddings: {str(e)}")
                return Response(
                    {
                        "data": serializer.data,
                        "warning": f"Content saved but embedding failed: {str(e)}",
                        "status": "partial_success",
                    },
                    status=status.HTTP_201_CREATED,
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        if not content_id:
            return Response(
                {"message": "Content ID is required", "status": "error"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            fitness_content = FitnessContent.objects.get(id=content_id)
        except FitnessContent.DoesNotExist:
            return Response(
                {"message": "Fitness content not found", "status": "error"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FitnessContentSerializer(
            fitness_content, data=request.data, partial=True
        )
        if serializer.is_valid():
            updated_content = serializer.save()

            try:
                embedding_id = upsert_fitness_content(updated_content)

                if not updated_content.embedding_id:
                    updated_content.embedding_id = embedding_id
                    updated_content.save()

                return Response(serializer.data)
            except Exception as e:
                logger.error(f"Error updating embeddings: {str(e)}")
                return Response(
                    {
                        "data": serializer.data,
                        "warning": f"Content updated but embedding failed: {str(e)}",
                        "status": "partial_success",
                    }
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "DELETE":
        if not content_id:
            return Response(
                {"message": "Content ID is required", "status": "error"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            fitness_content = FitnessContent.objects.get(id=content_id)

            if fitness_content.embedding_id:
                try:
                    delete_embedding(fitness_content.embedding_id)
                except Exception as e:
                    logger.error(f"Error deleting embedding: {str(e)}")

            fitness_content.delete()

            return Response(
                {
                    "message": "Fitness content deleted successfully",
                    "status": "success",
                },
                status=status.HTTP_204_NO_CONTENT,
            )
        except FitnessContent.DoesNotExist:
            return Response(
                {"message": "Fitness content not found", "status": "error"},
                status=status.HTTP_404_NOT_FOUND,
            )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def ai_chat(request):
    user = request.user
    query = request.data.get("query")

    from django.http import StreamingHttpResponse

    def stream_response():
        with client.messages.stream(
            model="claude-3-7-sonnet-20250219",
            max_tokens=1000,
            temperature=1,
            system="You are a expert in fitness advisor",
            messages=[{"role": "user", "content": query}],
        ) as stream:
            for text in stream.text_stream:
                yield text

    return StreamingHttpResponse(
        streaming_content=stream_response(),
        content_type='text/plain',
    )
