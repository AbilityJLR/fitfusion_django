'use client'

import { getProfile, getPhysicalProfile, getFitnessProfile, getDietaryProfile } from '../utils/profile'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Profile.module.css'
import Link from 'next/link'
import '../style.css'

export default function Profile() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [physicalData, setPhysicalData] = useState(null)
  const [fitnessData, setFitnessData] = useState(null)
  const [dietaryData, setDietaryData] = useState(null)
  const [error, setError] = useState(null)
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true)
      try {
        const userProfile = await getProfile()
        setUserData(userProfile)

        try {
          const physical = await getPhysicalProfile()
          setPhysicalData(physical)
        } catch (err) {
          console.log('Physical profile not found')
        }

        try {
          const fitness = await getFitnessProfile()
          setFitnessData(fitness)
        } catch (err) {
          console.log('Fitness profile not found')
        }

        try {
          const dietary = await getDietaryProfile()
          setDietaryData(dietary)
        } catch (err) {
          console.log('Dietary profile not found')
        }

      } catch (err) {
        setError('Failed to fetch profile data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const handleCompleteProfile = () => {
    setNavigating(true)
    router.push('/profile/setup')
  }

  if (loading) {
    return <div className={styles.container}>Loading profile data...</div>
  }

  if (error) {
    return <div className={styles.container}>{error}</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <div className={styles.profile}>
          {userData && (
            <div className={styles.profileTitle}>
              <h1>My Profile</h1>
              <Link href="/profile/setup">
                <button className='btn btn-primary'>Edit Profile</button>
              </Link>
            </div>
          )}

          {userData && (
            <div className={styles.basicProfile}>
              <h2>Basic Profile</h2>
              <div className={styles.profileGrid}>
                <div>
                  <p>Username: <span>{userData.username}</span></p>
                  <p>Email: <span>{userData.email}</span></p>
                  <p>Full Name: <span>{userData.first_name} {userData.last_name}</span></p>
                </div>
                <div>
                  <p>Age: <span>{userData.age || 'Not specified'}</span></p>
                  <p>Occupation: <span>{userData.occupation || 'Not specified'}</span></p>
                  <p>About Me: <span>{userData.about_me || 'Not specified'}</span></p>
                </div>
              </div>
            </div>
          )}

          {physicalData && (
            <div className={styles.profileSection}>
              <h2>Physical Profile</h2>
              <div className={styles.profileGrid}>
                <div>
                  <p>Height: <span>{physicalData.height} cm</span></p>
                  <p>Weight: <span>{physicalData.weight} kg</span></p>
                  <p>Gender: <span>{physicalData.gender}</span></p>
                </div>
                <div>
                  <p>Body Fat: <span>{physicalData.body_fat || 'Not specified'}%</span></p>
                  <p>Muscle Mass: <span>{physicalData.body_mass ? `${physicalData.body_mass} kg` : 'Not specified'}</span></p>
                  <p>Health Condition: <span>{physicalData.health_condition || 'Not specified'}</span></p>
                </div>
              </div>
            </div>
          )}

          {fitnessData && (
            <div className={styles.profileSection}>
              <h2>Fitness Profile</h2>
              <div className={styles.profileGrid}>
                <div>
                  <p>Fitness Level: <span>{fitnessData.fitness_level}</span></p>
                  <p>Workout Frequency: <span>{fitnessData.workout_frequency} times per week</span></p>
                  <p>Workout Duration: <span>{fitnessData.workout_duration} minutes</span></p>
                  <p>Workout Intensity: <span>{fitnessData.workout_intensity}/10</span></p>
                </div>
                <div>
                  <p>Workout Type: <span>{fitnessData.workout_type}</span></p>
                  <p>Workout Goal: <span>{fitnessData.workout_goal}</span></p>
                  <p>Health Goal: <span>{fitnessData.health_goal}</span></p>
                  <p>Equipment: <span>{fitnessData.workout_equipment || 'Not specified'}</span></p>
                </div>
              </div>
            </div>
          )}

          {dietaryData && (
            <div className={styles.profileSection}>
              <h2>Dietary Profile</h2>
              <div className={styles.profileGrid}>
                <div>
                  <p>Diet Preference: <span>{dietaryData.diet_preference || 'Not specified'}</span></p>
                  <p>Diet Goal: <span>{dietaryData.diet_goal}</span></p>
                </div>
                <div>
                  <p>Allergies: <span>{dietaryData.diet_allergies || 'None'}</span></p>
                  <p>Restrictions: <span>{dietaryData.diet_restrictions || 'None'}</span></p>
                  <p>Food Preferences: <span>{dietaryData.diet_preferences || 'Not specified'}</span></p>
                </div>
              </div>
            </div>
          )}

          {(!physicalData || !fitnessData || !dietaryData) && (
            <div className={styles.completeProfile}>
              <h3>Complete Your Profile</h3>
              <p>
                Some of your profile information is missing. Please complete your profile to get personalized recommendations.
              </p>
              <button
                className="btn btn-primary"
                onClick={handleCompleteProfile}
                disabled={navigating}
              >
                {navigating ? 'Navigating...' : 'Complete Profile'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
