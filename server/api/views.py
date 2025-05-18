from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
)
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from .models import User, PhysicalProfile, FitnessProfile, DietaryProfile, FitnessContent
from .serializer import (
    RegisterSerializer,
    ProfileSerializer,
    PhysicalProfileSerializer,
    FitnessProfileSerializer,
    DietaryProfileSerializer,
    UserDetailSerializer,
    FitnessContentSerializer,
)
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from .authentication import CookieJWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            tokens = response.data
            access_token = tokens.get("access")
            refresh_token = tokens.get("refresh")

            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=30 * 24 * 60 * 60,  
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=30 * 24 * 60 * 60,  
            )

        return response


class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        if "refresh" not in request.data and "refresh_token" in request.COOKIES:
            request.data["refresh"] = request.COOKIES.get("refresh_token")

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            response.set_cookie(
                key="access_token",
                value=response.data.get("access"),
                httponly=True,
                secure=True,
                samesite="Lax",
                max_age=30 * 24 * 60 * 60,  
            )

        return response


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    
    def post(self, request, *args, **kwargs):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            has_physical = hasattr(user, "physical_profile")
            has_fitness = hasattr(user, "fitness_profile")
            has_dietary = hasattr(user, "dietary_profile")

            response_data = {
                "message": "User registered successfully",
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "profiles_created": {
                    "basic_profile": True,
                    "physical_profile": has_physical,
                    "fitness_profile": has_fitness,
                    "dietary_profile": has_dietary,
                },
            }

            if not (has_physical and has_fitness and has_dietary):
                missing_profiles = []
                if not has_physical:
                    missing_profiles.append("physical profile")
                if not has_fitness:
                    missing_profiles.append("fitness profile")
                if not has_dietary:
                    missing_profiles.append("dietary profile")

                response_data["next_steps"] = (
                    f"You can complete your {', '.join(missing_profiles)} later using the profile setup endpoint."
                )
                response_data["setup_endpoint"] = "/api/profile/setup/"

            return Response(response_data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def profile_view(request):
    user = request.user

    if request.method == "GET":
        serializer = ProfileSerializer(user)
        return Response(serializer.data)

    elif request.method == "PUT":
        serializer = ProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def physical_profile_view(request):
    user = request.user

    if request.method == "GET":
        try:
            profile = PhysicalProfile.objects.get(user=user)
            serializer = PhysicalProfileSerializer(profile)
            return Response(serializer.data)
        except PhysicalProfile.DoesNotExist:
            default_profile = PhysicalProfile.objects.create(
                user=user, height=0, weight=0, gender=""
            )
            serializer = PhysicalProfileSerializer(default_profile)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {
                    "message": f"Error retrieving physical profile: {str(e)}",
                    "status": "error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    elif request.method == "POST":
        if hasattr(user, "physical_profile"):
            return Response(
                {"message": "Physical profile already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data
        serializer = PhysicalProfileSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        try:
            profile = PhysicalProfile.objects.get(user=user)
            serializer = PhysicalProfileSerializer(
                profile, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except PhysicalProfile.DoesNotExist:
            return Response(
                {"message": "Physical profile does not exist"},
                status=status.HTTP_404_NOT_FOUND,
            )


@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def fitness_profile_view(request):
    user = request.user

    if request.method == "GET":
        try:
            profile = FitnessProfile.objects.get(user=user)
            serializer = FitnessProfileSerializer(profile)
            return Response(serializer.data)
        except FitnessProfile.DoesNotExist:
            default_profile = FitnessProfile.objects.create(
                user=user,
                workout_frequency=0,
                workout_duration=0,
                workout_intensity=0,
                workout_type="",
                workout_goal="",
                health_goal="",
            )
            serializer = FitnessProfileSerializer(default_profile)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {
                    "message": f"Error retrieving fitness profile: {str(e)}",
                    "status": "error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    elif request.method == "POST":
        if hasattr(user, "fitness_profile"):
            return Response(
                {"message": "Fitness profile already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data
        serializer = FitnessProfileSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        try:
            profile = FitnessProfile.objects.get(user=user)
            serializer = FitnessProfileSerializer(
                profile, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except FitnessProfile.DoesNotExist:
            return Response(
                {"message": "Fitness profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


@api_view(["GET", "POST", "PUT"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def dietary_profile_view(request):
    user = request.user

    if request.method == "GET":
        try:
            profile = DietaryProfile.objects.get(user=user)
            serializer = DietaryProfileSerializer(profile)
            return Response(serializer.data)
        except DietaryProfile.DoesNotExist:
            default_profile = DietaryProfile.objects.create(user=user, diet_goal="")
            serializer = DietaryProfileSerializer(default_profile)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {
                    "message": f"Error retrieving dietary profile: {str(e)}",
                    "status": "error",
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    elif request.method == "POST":
        if hasattr(user, "dietary_profile"):
            return Response(
                {"message": "Dietary profile already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = request.data
        serializer = DietaryProfileSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        try:
            profile = DietaryProfile.objects.get(user=user)
            serializer = DietaryProfileSerializer(
                profile, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except DietaryProfile.DoesNotExist:
            return Response(
                {"message": "Dietary profile not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def user_detail_view(request):
    user = request.user
    serializer = UserDetailSerializer(user)
    return Response(serializer.data)


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def profile_setup_view(request):
    user = request.user

    if request.method == "GET":
        data = {
            "user_profile": {
                "first_name": user.first_name if hasattr(user, "first_name") else "",
                "last_name": user.last_name if hasattr(user, "last_name") else "",
                "age": user.age if hasattr(user, "age") else None,
                "occupation": user.occupation if hasattr(user, "occupation") else "",
                "about_me": user.about_me if hasattr(user, "about_me") else "",
            },
            "physical_profile": {},
            "fitness_profile": {},
            "dietary_profile": {},
        }

        if hasattr(user, "physical_profile"):
            profile = user.physical_profile
            data["physical_profile"] = {
                "height": profile.height,
                "weight": profile.weight,
                "gender": profile.gender,
                "body_fat": profile.body_fat,
                "body_mass": profile.body_mass,
                "health_condition": profile.health_condition,
            }
        else:
            data["physical_profile"] = {
                "height": 0,
                "weight": 0,
                "gender": "",
                "body_fat": None,
                "body_mass": None,
                "health_condition": "",
            }

        if hasattr(user, "fitness_profile"):
            profile = user.fitness_profile
            data["fitness_profile"] = {
                "fitness_level": profile.fitness_level,
                "workout_frequency": profile.workout_frequency,
                "workout_duration": profile.workout_duration,
                "workout_intensity": profile.workout_intensity,
                "workout_type": profile.workout_type,
                "workout_equipment": profile.workout_equipment,
                "workout_style": profile.workout_style,
                "workout_goal": profile.workout_goal,
                "health_goal": profile.health_goal,
            }
        else:
            data["fitness_profile"] = {
                "fitness_level": 1,
                "workout_frequency": 0,
                "workout_duration": 0,
                "workout_intensity": 0,
                "workout_type": "",
                "workout_equipment": "",
                "workout_style": "",
                "workout_goal": "",
                "health_goal": "",
            }

        if hasattr(user, "dietary_profile"):
            profile = user.dietary_profile
            data["dietary_profile"] = {
                "diet_preference": profile.diet_preference,
                "diet_allergies": profile.diet_allergies,
                "diet_restrictions": profile.diet_restrictions,
                "diet_preferences": profile.diet_preferences,
                "diet_goal": profile.diet_goal,
            }
        else:
            data["dietary_profile"] = {
                "diet_preference": "",
                "diet_allergies": "",
                "diet_restrictions": "",
                "diet_preferences": "",
                "diet_goal": "",
            }

        return Response(data)

    elif request.method == "POST":
        data = request.data
        user_profile_data = data.get("user_profile", {})
        physical_profile_data = data.get("physical_profile", {})
        fitness_profile_data = data.get("fitness_profile", {})
        dietary_profile_data = data.get("dietary_profile", {})
        
        # Debug logging
        print("===== PROFILE SETUP DEBUG =====")
        print(f"User profile data: {user_profile_data}")
        print(f"Physical profile data: {physical_profile_data}")
        print(f"Fitness profile data: {fitness_profile_data}")
        print(f"Dietary profile data: {dietary_profile_data}")

        if user_profile_data:
            serializer = ProfileSerializer(user, data=user_profile_data, partial=True)
            if serializer.is_valid():
                serializer.save()
            else:
                print(f"User profile serializer errors: {serializer.errors}")
                return Response(
                    {
                        "status": "error",
                        "message": "Failed to update user profile",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if physical_profile_data:
            try:
                profile = PhysicalProfile.objects.get(user=user)
                serializer = PhysicalProfileSerializer(
                    profile, data=physical_profile_data, partial=True
                )
            except PhysicalProfile.DoesNotExist:
                if (
                    "height" not in physical_profile_data
                    or "weight" not in physical_profile_data
                    or "gender" not in physical_profile_data
                ):
                    physical_profile_data.update(
                        {
                            "height": physical_profile_data.get("height", 0),
                            "weight": physical_profile_data.get("weight", 0),
                            "gender": physical_profile_data.get("gender", ""),
                        }
                    )
                serializer = PhysicalProfileSerializer(data=physical_profile_data)

            if serializer.is_valid():
                if isinstance(serializer.instance, PhysicalProfile):
                    serializer.save()
                else:
                    serializer.save(user=user)
            else:
                print(f"Physical profile serializer errors: {serializer.errors}")
                return Response(
                    {
                        "status": "error",
                        "message": "Failed to update physical profile",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if fitness_profile_data:
            try:
                profile = FitnessProfile.objects.get(user=user)
                serializer = FitnessProfileSerializer(
                    profile, data=fitness_profile_data, partial=True
                )
            except FitnessProfile.DoesNotExist:
                required_fields = [
                    "workout_frequency",
                    "workout_duration",
                    "workout_intensity",
                    "workout_type",
                    "workout_goal",
                    "health_goal",
                ]
                for field in required_fields:
                    if field not in fitness_profile_data:
                        if field in [
                            "workout_frequency",
                            "workout_duration",
                            "workout_intensity",
                        ]:
                            fitness_profile_data[field] = 0
                        else:
                            fitness_profile_data[field] = ""

                serializer = FitnessProfileSerializer(data=fitness_profile_data)

            if serializer.is_valid():
                if isinstance(serializer.instance, FitnessProfile):
                    serializer.save()
                else:
                    serializer.save(user=user)
            else:
                print(f"Fitness profile serializer errors: {serializer.errors}")
                return Response(
                    {
                        "status": "error",
                        "message": "Failed to update fitness profile",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if dietary_profile_data:
            try:
                profile = DietaryProfile.objects.get(user=user)
                serializer = DietaryProfileSerializer(
                    profile, data=dietary_profile_data, partial=True
                )
            except DietaryProfile.DoesNotExist:
                # Make sure all required fields have default values
                required_fields = ["diet_preference", "diet_allergies", "diet_restrictions", "diet_preferences", "diet_goal"]
                for field in required_fields:
                    if field not in dietary_profile_data:
                        dietary_profile_data[field] = ""
                        
                serializer = DietaryProfileSerializer(data=dietary_profile_data)

            if serializer.is_valid():
                if isinstance(serializer.instance, DietaryProfile):
                    serializer.save()
                else:
                    serializer.save(user=user)
            else:
                print(f"Dietary profile serializer errors: {serializer.errors}")
                return Response(
                    {
                        "status": "error",
                        "message": "Failed to update dietary profile",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            {
                "status": "success",
                "message": "Profiles updated successfully",
            }
        )


@api_view(["GET", "POST", "PUT", "DELETE"])
@permission_classes([IsAuthenticated, IsAdminUser])
@authentication_classes([CookieJWTAuthentication])
def fitness_content_admin_view(request, pk=None):
    if request.method == "GET":
        if pk:
            try:
                content = FitnessContent.objects.get(pk=pk)
                serializer = FitnessContentSerializer(content)
                return Response(serializer.data)
            except FitnessContent.DoesNotExist:
                return Response(
                    {"message": "Fitness content not found"},
                    status=status.HTTP_404_NOT_FOUND,
                )
        else:
            contents = FitnessContent.objects.all().order_by("-created_at")
            serializer = FitnessContentSerializer(contents, many=True)
            return Response(serializer.data)

    elif request.method == "POST":
        serializer = FitnessContentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == "PUT":
        try:
            content = FitnessContent.objects.get(pk=pk)
            serializer = FitnessContentSerializer(
                content, data=request.data, partial=True
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except FitnessContent.DoesNotExist:
            return Response(
                {"message": "Fitness content not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

    elif request.method == "DELETE":
        try:
            content = FitnessContent.objects.get(pk=pk)
            content.delete()
            return Response(
                {"message": "Fitness content deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except FitnessContent.DoesNotExist:
            return Response(
                {"message": "Fitness content not found"},
                status=status.HTTP_404_NOT_FOUND,
            )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def fitness_content_search_view(request):
    content_type = request.query_params.get("content_type", None)
    difficulty_level = request.query_params.get("difficulty_level", None)
    search_term = request.query_params.get("search", None)

    queryset = FitnessContent.objects.all()

    if content_type:
        queryset = queryset.filter(content_type=content_type)

    if difficulty_level:
        queryset = queryset.filter(difficulty_level=difficulty_level)

    if search_term:
        queryset = queryset.filter(title__icontains=search_term) | queryset.filter(
            description__icontains=search_term
        )

    queryset = queryset.order_by("-created_at")
    serializer = FitnessContentSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([CookieJWTAuthentication])
def logout_view(request):
    response = Response({"message": "Successfully logged out."})
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return response
