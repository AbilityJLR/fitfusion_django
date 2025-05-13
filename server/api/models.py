from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.http import MAX_URL_LENGTH


class User(AbstractUser):
    groups = models.ManyToManyField(
        "auth.Group",
        related_name="api_users",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="api_users",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )
    age = models.PositiveIntegerField(null=True, blank=True)
    first_name = models.CharField(max_length=255, blank=True)
    last_name = models.CharField(max_length=255, blank=True)
    occupation = models.CharField(max_length=255, blank=True)
    about_me = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.username


class PhysicalProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="physical_profile"
    )
    height = models.PositiveIntegerField(help_text="Height in cm")
    weight = models.PositiveIntegerField(help_text="Weight in kg")
    gender = models.CharField(max_length=50)
    body_fat = models.PositiveIntegerField(
        null=True, blank=True, help_text="Body fat percentage"
    )
    body_mass = models.PositiveIntegerField(
        null=True, blank=True, help_text="Skeletal muscle mass in kg"
    )
    health_condition = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Physical Profile"


class FitnessProfile(models.Model):
    class FitnessLevel(models.IntegerChoices):
        BEGINNER = 1, "Beginner"
        INTERMEDIATE = 2, "Intermediate"
        ADVANCED = 3, "Advanced"
        EXPERT = 4, "Expert"
        PRO = 5, "Professional"

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="fitness_profile"
    )
    fitness_level = models.IntegerField(
        choices=FitnessLevel.choices, default=FitnessLevel.BEGINNER
    )
    workout_frequency = models.PositiveIntegerField(help_text="Workouts per week")
    workout_duration = models.PositiveIntegerField(
        help_text="Average workout duration in minutes"
    )
    workout_intensity = models.PositiveIntegerField(help_text="Scale of 1-10")
    workout_type = models.CharField(max_length=255)
    workout_equipment = models.CharField(max_length=255, blank=True)
    workout_style = models.CharField(max_length=255, blank=True)
    workout_goal = models.CharField(max_length=255)
    health_goal = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Fitness Profile"


class DietaryProfile(models.Model):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="dietary_profile"
    )
    diet_preference = models.CharField(
        max_length=255, blank=True, help_text="E.g., Vegetarian, Vegan, etc."
    )
    diet_allergies = models.CharField(max_length=255, blank=True)
    diet_restrictions = models.CharField(max_length=255, blank=True)
    diet_preferences = models.CharField(
        max_length=255, blank=True, help_text="Food preferences"
    )
    diet_goal = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Dietary Profile"


class FitnessContent(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    content_type = models.CharField(max_length=100, choices=[
        ('exercise', 'Exercise'),
        ('workout', 'Workout'),
        ('article', 'Article'),
        ('tutorial', 'Tutorial'),
        ('diet', 'Diet'),
    ])
    url = models.URLField(max_length=MAX_URL_LENGTH, blank=True, null=True)
    youtube_url = models.URLField(max_length=MAX_URL_LENGTH, blank=True, null=True)
    difficulty_level = models.IntegerField(choices=[
        (1, 'Beginner'),
        (2, 'Intermediate'),
        (3, 'Advanced'),
        (4, 'Expert'),
        (5, 'Professional'),
    ], default=2)
    equipment_required = models.CharField(max_length=255, blank=True)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    calories_burned = models.PositiveIntegerField(null=True, blank=True)
    target_muscles = models.CharField(max_length=255, blank=True)
    embedding_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        indexes = [
            models.Index(fields=['content_type']),
            models.Index(fields=['difficulty_level']),
        ]

