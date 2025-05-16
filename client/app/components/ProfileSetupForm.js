'use client';

import { useState, useEffect } from 'react';
import { setupProfiles } from '../utils/profile';
import styles from '../profile/setup/Setup.module.css'
import '../style.css'

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
      body_fat: '',
      body_mass: '',
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
      const processedData = {
        user_profile: {
          ...formData.user_profile,
          ...initialData.user_profile,
          age: initialData.user_profile?.age ?? 0,
        },
        physical_profile: {
          ...formData.physical_profile,
          ...initialData.physical_profile,
          height: initialData.physical_profile?.height ?? 0,
          weight: initialData.physical_profile?.weight ?? 0,
          body_fat: initialData.physical_profile?.body_fat ?? '',
          body_mass: initialData.physical_profile?.body_mass ?? '',
          gender: initialData.physical_profile?.gender ?? '',
          health_condition: initialData.physical_profile?.health_condition ?? '',
        },
        fitness_profile: {
          ...formData.fitness_profile,
          ...initialData.fitness_profile,
          fitness_level: initialData.fitness_profile?.fitness_level ?? 1,
          workout_frequency: initialData.fitness_profile?.workout_frequency ?? 0,
          workout_duration: initialData.fitness_profile?.workout_duration ?? 0,
          workout_intensity: initialData.fitness_profile?.workout_intensity ?? 0,
        },
        dietary_profile: {
          ...formData.dietary_profile,
          ...initialData.dietary_profile,
        }
      };

      setFormData(processedData);
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
      const processedData = {
        user_profile: {
          ...formData.user_profile,
          age: formData.user_profile.age ? parseInt(formData.user_profile.age) : 0,
        },
        physical_profile: {
          ...formData.physical_profile,
          height: formData.physical_profile.height ? parseInt(formData.physical_profile.height) : 0,
          weight: formData.physical_profile.weight ? parseInt(formData.physical_profile.weight) : 0,
          body_fat: formData.physical_profile.body_fat !== '' ? parseInt(formData.physical_profile.body_fat) : null,
          body_mass: formData.physical_profile.body_mass !== '' ? parseInt(formData.physical_profile.body_mass) : null,
        },
        fitness_profile: {
          ...formData.fitness_profile,
          fitness_level: formData.fitness_profile.fitness_level ? parseInt(formData.fitness_profile.fitness_level) : 1,
          workout_frequency: formData.fitness_profile.workout_frequency ? parseInt(formData.fitness_profile.workout_frequency) : 0,
          workout_duration: formData.fitness_profile.workout_duration ? parseInt(formData.fitness_profile.workout_duration) : 0,
          workout_intensity: formData.fitness_profile.workout_intensity ? parseInt(formData.fitness_profile.workout_intensity) : 0,
        },
        dietary_profile: formData.dietary_profile,
      };

      const response = await setupProfiles(processedData);
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
    <div className={styles.innerContainer}>
      <h2>Complete Your Profile</h2>

      {success && (
        <div>
          Your profile has been set up successfully!
        </div>
      )}

      {error && (
        <div>
          {typeof error === 'string' ? error : 'An error occurred during setup'}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <section>
          <h3>Basic Information</h3>
          <div className={styles.contentContainer}>
            <div>
              <label className='form-label'>First Name</label>
              <input
                className='form-input'
                type="text"
                value={formData.user_profile.first_name || ''}
                onChange={(e) => handleChange('user_profile', 'first_name', e.target.value)}
              />
            </div>
            <div>
              <label className='form-label'>Last Name</label>
              <input
                className='form-input'
                type="text"
                value={formData.user_profile.last_name || ''}
                onChange={(e) => handleChange('user_profile', 'last_name', e.target.value)}
              />
            </div>
            <div>
              <label className='form-label'>Age</label>
              <input
                className='form-input'
                type="number"
                value={formData.user_profile.age || 0}
                onChange={(e) => handleChange('user_profile', 'age', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className='form-label'>Occupation</label>
              <input
                className='form-input'
                type="text"
                value={formData.user_profile.occupation || ''}
                onChange={(e) => handleChange('user_profile', 'occupation', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">About Me</label>
              <textarea
                className='form-input'
                rows="3"
                value={formData.user_profile.about_me || ''}
                onChange={(e) => handleChange('user_profile', 'about_me', e.target.value)}
                placeholder="Tell us a bit about yourself"
              />
            </div>
          </div>
        </section>

        <hr className='line' />

        <section>
          <h3>Physical Information</h3>
          <div className={styles.contentContainer}>
            <div>
              <label className='form-label'>Height (cm)</label>
              <input
                className='form-input'
                type="number"
                value={formData.physical_profile.height || 0}
                onChange={(e) => handleChange('physical_profile', 'height', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className='form-label'>Weight (kg)</label>
              <input
                className='form-input'
                type="number"
                value={formData.physical_profile.weight || 0}
                onChange={(e) => handleChange('physical_profile', 'weight', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className='form-label'>Gender</label>
              <select
                className='form-input'
                value={formData.physical_profile.gender || ''}
                onChange={(e) => handleChange('physical_profile', 'gender', e.target.value)}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className='form-label'>Body Fat (%)</label>
              <input
                className='form-input'
                type="number"
                value={formData.physical_profile.body_fat || ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? '' : e.target.value;
                  handleChange('physical_profile', 'body_fat', value);
                }}
                placeholder="Optional"
              />
            </div>
            <div>
              <label className='form-label'>Muscle Mass (kg)</label>
              <input
                className='form-input'
                type="number"
                value={formData.physical_profile.body_mass || ''}
                onChange={(e) => {
                  const value = e.target.value.trim() === '' ? '' : e.target.value;
                  handleChange('physical_profile', 'body_mass', value);
                }}
                placeholder="Estimated skeletal muscle mass"
              />
            </div>
            <div>
              <label className="form-label">Health Condition</label>
              <input
                className='form-input'
                type="text"
                value={formData.physical_profile.health_condition || ''}
                onChange={(e) => handleChange('physical_profile', 'health_condition', e.target.value)}
                placeholder="Any health conditions or concerns"
              />
            </div>
          </div>
        </section>

        <hr className='line' />

        <section>
          <h3>Fitness Information</h3>
          <div className={styles.contentContainer}>
            <div>
              <label className='form-label'>Fitness Level</label>
              <select
                className='form-input'
                value={formData.fitness_profile.fitness_level || 1}
                onChange={(e) => handleChange('fitness_profile', 'fitness_level', Number(e.target.value) || 1)}
              >
                <option value={1}>Beginner</option>
                <option value={2}>Intermediate</option>
                <option value={3}>Advanced</option>
                <option value={4}>Expert</option>
                <option value={5}>Professional</option>
              </select>
            </div>
            <div>
              <label className='form-label'>Workout Frequency (per week)</label>
              <input
                className='form-input'
                type="number"
                value={formData.fitness_profile.workout_frequency || 0}
                onChange={(e) => handleChange('fitness_profile', 'workout_frequency', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className='form-label'>Workout Duration (minutes)</label>
              <input
                className='form-input'
                type="number"
                value={formData.fitness_profile.workout_duration || 0}
                onChange={(e) => handleChange('fitness_profile', 'workout_duration', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className='form-label'>Workout Intensity (1-10)</label>
              <div>
                <input
                  className='form-range'
                  type="range"
                  min="1"
                  max="10"
                  value={formData.fitness_profile.workout_intensity || 1}
                  onChange={(e) => handleChange('fitness_profile', 'workout_intensity', Number(e.target.value) || 1)}
                />
                <div className='form-range-text'>{formData.fitness_profile.workout_intensity || 1}</div>
              </div>
            </div>
            <div>
              <label className='form-label'>Workout Type</label>
              <select
                className='form-input'
                value={formData.fitness_profile.workout_type || ''}
                onChange={(e) => handleChange('fitness_profile', 'workout_type', e.target.value)}
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
              <label className='form-label'>Equipment Used</label>
              <input
                className='form-input'
                type="text"
                value={formData.fitness_profile.workout_equipment || ''}
                onChange={(e) => handleChange('fitness_profile', 'workout_equipment', e.target.value)}
                placeholder="e.g., dumbbells, treadmill, etc."
              />
            </div>
            <div>
              <label className='form-label'>Workout Style</label>
              <input
                className='form-input'
                type="text"
                value={formData.fitness_profile.workout_style || ''}
                onChange={(e) => handleChange('fitness_profile', 'workout_style', e.target.value)}
                placeholder="e.g., CrossFit, bodybuilding, etc."
              />
            </div>
            <div>
              <label className='form-label'>Workout Goal</label>
              <select
                className='form-input'
                value={formData.fitness_profile.workout_goal || ''}
                onChange={(e) => handleChange('fitness_profile', 'workout_goal', e.target.value)}
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
              <label className='form-label'>Health Goal</label>
              <input
                className='form-input'
                type="text"
                value={formData.fitness_profile.health_goal || ''}
                onChange={(e) => handleChange('fitness_profile', 'health_goal', e.target.value)}
                placeholder="Your overall health goal"
              />
            </div>
          </div>
        </section>

        <hr className='line' />

        <section>
          <h3>Dietary Information</h3>
          <div className={styles.contentContainer}>
            <div>
              <label className='form-label'>Diet Preference</label>
              <select
                className='form-input'
                value={formData.dietary_profile.diet_preference || ''}
                onChange={(e) => handleChange('dietary_profile', 'diet_preference', e.target.value)}
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
              <label className='form-label'>Diet Goal</label>
              <select
                className='form-input'
                value={formData.dietary_profile.diet_goal || ''}
                onChange={(e) => handleChange('dietary_profile', 'diet_goal', e.target.value)}
              >
                <option value="">Select Goal</option>
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_gain">Muscle Gain</option>
                <option value="maintenance">Maintenance</option>
                <option value="healthy_eating">Healthy Eating</option>
              </select>
            </div>
            <div>
              <label className='form-label'>Allergies</label>
              <input
                className='form-input'
                type="text"
                value={formData.dietary_profile.diet_allergies || ''}
                onChange={(e) => handleChange('dietary_profile', 'diet_allergies', e.target.value)}
                placeholder="e.g., nuts, dairy, seafood"
              />
            </div>
            <div>
              <label className='form-label'>Dietary Restrictions</label>
              <input
                className='form-input'
                type="text"
                value={formData.dietary_profile.diet_restrictions || ''}
                onChange={(e) => handleChange('dietary_profile', 'diet_restrictions', e.target.value)}
                placeholder="e.g., gluten-free, low carb"
              />
            </div>
            <div>
              <label className='form-label'>Food Preferences</label>
              <input
                className='form-input'
                type="text"
                value={formData.dietary_profile.diet_preferences || ''}
                onChange={(e) => handleChange('dietary_profile', 'diet_preferences', e.target.value)}
                placeholder="Foods you particularly enjoy"
              />
            </div>
          </div>
        </section>

        <hr className='line' />

        <div>
          <button
            className='btn btn-primary'
            type="submit"
            disabled={isSubmitting || success}
          >
            {isSubmitting ? 'Saving Profile...' : success ? 'Profile Saved!' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
} 
