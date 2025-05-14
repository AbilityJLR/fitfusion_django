'use client'

import { getProfile, getPhysicalProfile, getFitnessProfile, getDietaryProfile } from '../utils/profile'
import getRecommendations from '../utils/recommendations'
import getGenAI from '../utils/gen_ai'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const router = useRouter()
  const [chat, setChat] = useState('')
  const [chatResponse, setChatResponse] = useState('')
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

        // try {
        //   const recommendations = await getRecommendations()
        //   if (recommendations) {
        //     console.log('Recommendations loaded:', recommendations)
        //   }
        // } catch (err) {
        //   console.log('Error loading recommendations:', err)
        // }

      } catch (err) {
        setError('Failed to fetch profile data')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const onSubmitChat = async (e) => {
    e.preventDefault()
    try {
      const response = await getGenAI(chat)
      if (response) {
        setChatResponse(response.reply)
      }
    } catch (err) {
      console.log('error', err)
    }
  }

  const handleCompleteProfile = () => {
    setNavigating(true)
    router.push('/profile/setup')
  }

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (navigating) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3">Navigating to profile setup...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <Navbar />
        <div className="text-red-500 flex justify-center items-center h-screen">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {userData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Basic Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Username: <span className="font-normal">{userData.username}</span></p>
                <p className="font-medium">Email: <span className="font-normal">{userData.email}</span></p>
                <p className="font-medium">Full Name: <span className="font-normal">{userData.first_name} {userData.last_name}</span></p>
              </div>
              <div>
                <p className="font-medium">Age: <span className="font-normal">{userData.age || 'Not specified'}</span></p>
                <p className="font-medium">Occupation: <span className="font-normal">{userData.occupation || 'Not specified'}</span></p>
                <p className="font-medium">About Me: <span className="font-normal">{userData.about_me || 'Not specified'}</span></p>
              </div>
            </div>
          </div>
        )}

        {physicalData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Physical Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Height: <span className="font-normal">{physicalData.height} cm</span></p>
                <p className="font-medium">Weight: <span className="font-normal">{physicalData.weight} kg</span></p>
                <p className="font-medium">Gender: <span className="font-normal">{physicalData.gender}</span></p>
              </div>
              <div>
                <p className="font-medium">Body Fat: <span className="font-normal">{physicalData.body_fat || 'Not specified'}%</span></p>
                <p className="font-medium">Muscle Mass: <span className="font-normal">{physicalData.body_mass ? `${physicalData.body_mass} kg` : 'Not specified'}</span></p>
                <p className="font-medium">Health Condition: <span className="font-normal">{physicalData.health_condition || 'Not specified'}</span></p>
              </div>
            </div>
          </div>
        )}

        {fitnessData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Fitness Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Fitness Level: <span className="font-normal">{fitnessData.fitness_level_display}</span></p>
                <p className="font-medium">Workout Frequency: <span className="font-normal">{fitnessData.workout_frequency} times per week</span></p>
                <p className="font-medium">Workout Duration: <span className="font-normal">{fitnessData.workout_duration} minutes</span></p>
                <p className="font-medium">Workout Intensity: <span className="font-normal">{fitnessData.workout_intensity}/10</span></p>
              </div>
              <div>
                <p className="font-medium">Workout Type: <span className="font-normal">{fitnessData.workout_type}</span></p>
                <p className="font-medium">Workout Goal: <span className="font-normal">{fitnessData.workout_goal}</span></p>
                <p className="font-medium">Health Goal: <span className="font-normal">{fitnessData.health_goal}</span></p>
                <p className="font-medium">Equipment: <span className="font-normal">{fitnessData.workout_equipment || 'Not specified'}</span></p>
              </div>
            </div>
          </div>
        )}

        {dietaryData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Dietary Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium">Diet Preference: <span className="font-normal">{dietaryData.diet_preference || 'Not specified'}</span></p>
                <p className="font-medium">Diet Goal: <span className="font-normal">{dietaryData.diet_goal}</span></p>
              </div>
              <div>
                <p className="font-medium">Allergies: <span className="font-normal">{dietaryData.diet_allergies || 'None'}</span></p>
                <p className="font-medium">Restrictions: <span className="font-normal">{dietaryData.diet_restrictions || 'None'}</span></p>
                <p className="font-medium">Food Preferences: <span className="font-normal">{dietaryData.diet_preferences || 'Not specified'}</span></p>
              </div>
            </div>
          </div>
        )}

        {(!physicalData || !fitnessData || !dietaryData) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-medium text-yellow-700 mb-2">Complete Your Profile</h3>
            <p className="text-yellow-600">
              Some of your profile information is missing. Please complete your profile to get personalized recommendations.
            </p>
            <button
              onClick={handleCompleteProfile}
              disabled={navigating}
              className="mt-4 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition-colors disabled:opacity-50"
            >
              {navigating ? 'Navigating...' : 'Complete Profile'}
            </button>
          </div>
        )}
      </div>
      <div>test</div>
      <form onSubmit={onSubmitChat}>
        <label>query text</label>
        <input type='text' onChange={(e) => { setChat(e.target.value) }} value={chat} />
        <input type='submit' />
      </form>
      <div>
        {chatResponse}
      </div>
    </div>
  )
} 
