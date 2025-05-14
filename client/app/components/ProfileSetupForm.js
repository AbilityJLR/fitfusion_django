'use client';

import { useState, useEffect } from 'react';
import { setupProfiles } from '../utils/profile';

export default function ProfileSetupForm({ onSubmitStart, onSubmitEnd, onSubmitSuccess, submitting, initialData }) {
  const [formData, setFormData] = useState({
    user_profile: {
      first_name: '',
      last_name: '',
      age: 0,
      occupation: '',
      about_me: '',
    },
    physical_profile: {
      height: 0,
      weight: 0,
      gender: '',
      body_fat: null,
      body_mass: null,
      health_condition: '',
    },
    fitness_profile: {
      fitness_level: 1,
      workout_frequency: 0,
      workout_duration: 0,
      workout_intensity: 0,
      workout_type: '',
      workout_equipment: '',
      workout_style: '',
      workout_goal: '',
      health_goal: '',
    },
    dietary_profile: {
      diet_preference: '',
      diet_allergies: '',
      diet_restrictions: '',
      diet_preferences: '',
      diet_goal: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        user_profile: {
          ...formData.user_profile,
          ...initialData.user_profile
        },
        physical_profile: {
          ...formData.physical_profile,
          ...initialData.physical_profile
        },
        fitness_profile: {
          ...formData.fitness_profile,
          ...initialData.fitness_profile
        },
        dietary_profile: {
          ...formData.dietary_profile,
          ...initialData.dietary_profile
        }
      });
    }
  }, [initialData]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (profileType, field, value) => {
    setFormData({
      ...formData,
      [profileType]: {
        ...formData[profileType],
        [field]: value,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (onSubmitStart) onSubmitStart();
    
    try {
      const response = await setupProfiles(formData);
      setSuccess(true);
      console.log('Profile setup successful:', response);
      
      if (onSubmitSuccess) onSubmitSuccess();
    } catch (err) {
      setError(err.response?.data || 'An error occurred during profile setup');
      console.error('Profile setup error:', err);
    } finally {
      setLoading(false);
      if (onSubmitEnd) onSubmitEnd();
    }
  };

  const isSubmitting = submitting !== undefined ? submitting : loading;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Complete Your Profile</h2>
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 mb-6 rounded">
          Your profile has been set up successfully!
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 mb-6 rounded">
          {typeof error === 'string' ? error : 'An error occurred during setup'}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">First Name</label>
              <input
                type="text"
                value={formData.user_profile.first_name}
                onChange={(e) => handleChange('user_profile', 'first_name', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Last Name</label>
              <input
                type="text"
                value={formData.user_profile.last_name}
                onChange={(e) => handleChange('user_profile', 'last_name', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Age</label>
              <input
                type="number"
                value={formData.user_profile.age}
                onChange={(e) => handleChange('user_profile', 'age', Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Occupation</label>
              <input
                type="text"
                value={formData.user_profile.occupation}
                onChange={(e) => handleChange('user_profile', 'occupation', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1">About Me</label>
              <textarea
                rows="3"
                value={formData.user_profile.about_me}
                onChange={(e) => handleChange('user_profile', 'about_me', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Tell us a bit about yourself"
              />
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Physical Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.physical_profile.height}
                onChange={(e) => handleChange('physical_profile', 'height', Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Weight (kg)</label>
              <input
                type="number"
                value={formData.physical_profile.weight}
                onChange={(e) => handleChange('physical_profile', 'weight', Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Gender</label>
              <select
                value={formData.physical_profile.gender}
                onChange={(e) => handleChange('physical_profile', 'gender', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Body Fat (%)</label>
              <input
                type="number"
                value={formData.physical_profile.body_fat || ''}
                onChange={(e) => handleChange('physical_profile', 'body_fat', e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block mb-1">Muscle Mass (kg)</label>
              <input
                type="number"
                value={formData.physical_profile.body_mass || ''}
                onChange={(e) => handleChange('physical_profile', 'body_mass', e.target.value ? Number(e.target.value) : null)}
                className="w-full p-2 border rounded"
                placeholder="Estimated skeletal muscle mass"
              />
            </div>
            <div>
              <label className="block mb-1">Health Condition</label>
              <input
                type="text"
                value={formData.physical_profile.health_condition}
                onChange={(e) => handleChange('physical_profile', 'health_condition', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Any health conditions or concerns"
              />
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Fitness Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Fitness Level</label>
              <select
                value={formData.fitness_profile.fitness_level}
                onChange={(e) => handleChange('fitness_profile', 'fitness_level', Number(e.target.value))}
                className="w-full p-2 border rounded"
              >
                <option value={1}>Beginner</option>
                <option value={2}>Intermediate</option>
                <option value={3}>Advanced</option>
                <option value={4}>Expert</option>
                <option value={5}>Professional</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Workout Frequency (per week)</label>
              <input
                type="number"
                value={formData.fitness_profile.workout_frequency}
                onChange={(e) => handleChange('fitness_profile', 'workout_frequency', Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Workout Duration (minutes)</label>
              <input
                type="number"
                value={formData.fitness_profile.workout_duration}
                onChange={(e) => handleChange('fitness_profile', 'workout_duration', Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Workout Intensity (1-10)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.fitness_profile.workout_intensity}
                  onChange={(e) => handleChange('fitness_profile', 'workout_intensity', Number(e.target.value))}
                  className="w-full"
                />
                <span className="text-sm font-medium">{formData.fitness_profile.workout_intensity}</span>
              </div>
            </div>
            <div>
              <label className="block mb-1">Workout Type</label>
              <select
                value={formData.fitness_profile.workout_type}
                onChange={(e) => handleChange('fitness_profile', 'workout_type', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Type</option>
                <option value="cardio">Cardio</option>
                <option value="strength">Strength Training</option>
                <option value="hiit">HIIT</option>
                <option value="yoga">Yoga</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Equipment Used</label>
              <input
                type="text"
                value={formData.fitness_profile.workout_equipment}
                onChange={(e) => handleChange('fitness_profile', 'workout_equipment', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., dumbbells, treadmill, etc."
              />
            </div>
            <div>
              <label className="block mb-1">Workout Style</label>
              <input
                type="text"
                value={formData.fitness_profile.workout_style}
                onChange={(e) => handleChange('fitness_profile', 'workout_style', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., CrossFit, bodybuilding, etc."
              />
            </div>
            <div>
              <label className="block mb-1">Workout Goal</label>
              <select
                value={formData.fitness_profile.workout_goal}
                onChange={(e) => handleChange('fitness_profile', 'workout_goal', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Goal</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="endurance">Endurance</option>
                <option value="flexibility">Flexibility</option>
                <option value="general_fitness">General Fitness</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Health Goal</label>
              <input
                type="text"
                value={formData.fitness_profile.health_goal}
                onChange={(e) => handleChange('fitness_profile', 'health_goal', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Your overall health goal"
              />
            </div>
          </div>
        </section>
        
        <section className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Dietary Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Diet Preference</label>
              <select
                value={formData.dietary_profile.diet_preference}
                onChange={(e) => handleChange('dietary_profile', 'diet_preference', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Preference</option>
                <option value="omnivore">Omnivore</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="pescatarian">Pescatarian</option>
                <option value="keto">Keto</option>
                <option value="paleo">Paleo</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Diet Goal</label>
              <select
                value={formData.dietary_profile.diet_goal}
                onChange={(e) => handleChange('dietary_profile', 'diet_goal', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Goal</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="healthy_eating">Healthy Eating</option>
              </select>
            </div>
            <div>
              <label className="block mb-1">Allergies</label>
              <input
                type="text"
                value={formData.dietary_profile.diet_allergies}
                onChange={(e) => handleChange('dietary_profile', 'diet_allergies', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., nuts, dairy, seafood"
              />
            </div>
            <div>
              <label className="block mb-1">Dietary Restrictions</label>
              <input
                type="text"
                value={formData.dietary_profile.diet_restrictions}
                onChange={(e) => handleChange('dietary_profile', 'diet_restrictions', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="e.g., gluten-free, low carb"
              />
            </div>
            <div>
              <label className="block mb-1">Food Preferences</label>
              <input
                type="text"
                value={formData.dietary_profile.diet_preferences}
                onChange={(e) => handleChange('dietary_profile', 'diet_preferences', e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Foods you particularly enjoy"
              />
            </div>
          </div>
        </section>
        
        <div className="mt-6">
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting || success}
          >
            {isSubmitting ? 'Saving Profile...' : success ? 'Profile Saved!' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
} 