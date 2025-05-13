from django.contrib.auth.models import Group
from .models import User, PhysicalProfile, FitnessProfile, DietaryProfile, FitnessContent
from rest_framework import serializers

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    age = serializers.IntegerField(required=False, allow_null=True)
    occupation = serializers.CharField(required=False, allow_blank=True, max_length=255)
    about_me = serializers.CharField(required=False, allow_blank=True)
    
    height = serializers.IntegerField(required=False, allow_null=True)
    weight = serializers.IntegerField(required=False, allow_null=True)
    gender = serializers.CharField(required=False, allow_blank=True, max_length=50)
    
    fitness_level = serializers.IntegerField(required=False, allow_null=True)
    workout_frequency = serializers.IntegerField(required=False, allow_null=True)
    workout_duration = serializers.IntegerField(required=False, allow_null=True)
    workout_intensity = serializers.IntegerField(required=False, allow_null=True)
    workout_type = serializers.CharField(required=False, allow_blank=True, max_length=255)
    workout_goal = serializers.CharField(required=False, allow_blank=True, max_length=255)
    health_goal = serializers.CharField(required=False, allow_blank=True, max_length=255)
    
    diet_preference = serializers.CharField(required=False, allow_blank=True, max_length=255)
    diet_goal = serializers.CharField(required=False, allow_blank=True, max_length=255)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2', 
            'first_name', 'last_name', 'age', 'occupation', 'about_me',
            'height', 'weight', 'gender',
            'fitness_level', 'workout_frequency', 'workout_duration', 'workout_intensity',
            'workout_type', 'workout_goal', 'health_goal',
            'diet_preference', 'diet_goal'
        ]
    
    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Passwords do not match")
        return data
    
    def create(self, validated_data):
        physical_profile_data = {}
        if 'height' in validated_data:
            physical_profile_data['height'] = validated_data.pop('height')
        if 'weight' in validated_data:
            physical_profile_data['weight'] = validated_data.pop('weight')
        if 'gender' in validated_data:
            physical_profile_data['gender'] = validated_data.pop('gender')
        
        fitness_profile_data = {}
        if 'fitness_level' in validated_data:
            fitness_profile_data['fitness_level'] = validated_data.pop('fitness_level')
        if 'workout_frequency' in validated_data:
            fitness_profile_data['workout_frequency'] = validated_data.pop('workout_frequency')
        if 'workout_duration' in validated_data:
            fitness_profile_data['workout_duration'] = validated_data.pop('workout_duration')
        if 'workout_intensity' in validated_data:
            fitness_profile_data['workout_intensity'] = validated_data.pop('workout_intensity')
        if 'workout_type' in validated_data:
            fitness_profile_data['workout_type'] = validated_data.pop('workout_type')
        if 'workout_goal' in validated_data:
            fitness_profile_data['workout_goal'] = validated_data.pop('workout_goal')
        if 'health_goal' in validated_data:
            fitness_profile_data['health_goal'] = validated_data.pop('health_goal')
        
        dietary_profile_data = {}
        if 'diet_preference' in validated_data:
            dietary_profile_data['diet_preference'] = validated_data.pop('diet_preference')
        if 'diet_goal' in validated_data:
            dietary_profile_data['diet_goal'] = validated_data.pop('diet_goal')
        
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            username=validated_data.pop('username'),
            email=validated_data.pop('email'),
            password=password,
            **validated_data
        )
        
        if any(k in physical_profile_data for k in ['height', 'weight', 'gender']):
            if 'height' not in physical_profile_data:
                physical_profile_data['height'] = 0  
            if 'weight' not in physical_profile_data:
                physical_profile_data['weight'] = 0  
            if 'gender' not in physical_profile_data:
                physical_profile_data['gender'] = '' 
            
            PhysicalProfile.objects.create(user=user, **physical_profile_data)
            
        if any(k in fitness_profile_data for k in [
            'fitness_level', 'workout_frequency', 'workout_duration', 
            'workout_intensity', 'workout_type', 'workout_goal', 'health_goal']):
            
            if 'workout_frequency' not in fitness_profile_data:
                fitness_profile_data['workout_frequency'] = 0  
            if 'workout_duration' not in fitness_profile_data:
                fitness_profile_data['workout_duration'] = 0  
            if 'workout_intensity' not in fitness_profile_data:
                fitness_profile_data['workout_intensity'] = 0  
            if 'workout_type' not in fitness_profile_data:
                fitness_profile_data['workout_type'] = ''  
            if 'workout_goal' not in fitness_profile_data:
                fitness_profile_data['workout_goal'] = ''  
            if 'health_goal' not in fitness_profile_data:
                fitness_profile_data['health_goal'] = ''  
                
            FitnessProfile.objects.create(user=user, **fitness_profile_data)
            
        if any(k in dietary_profile_data for k in ['diet_preference', 'diet_goal']):
            if 'diet_goal' not in dietary_profile_data:
                dietary_profile_data['diet_goal'] = ''  
                
            DietaryProfile.objects.create(user=user, **dietary_profile_data)
            
        return user

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'age', 'occupation', 'about_me', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class PhysicalProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhysicalProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class FitnessProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitnessProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class DietaryProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietaryProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class UserDetailSerializer(serializers.ModelSerializer):
    physical_profile = PhysicalProfileSerializer(read_only=True)
    fitness_profile = FitnessProfileSerializer(read_only=True)
    dietary_profile = DietaryProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'age', 'occupation', 
                 'about_me', 'physical_profile', 'fitness_profile', 'dietary_profile', 
                 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class FitnessContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FitnessContent
        fields = '__all__'
        read_only_fields = ['id', 'embedding_id', 'created_at', 'updated_at']


