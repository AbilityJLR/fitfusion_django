'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function FitnessContentAdmin() {
  const router = useRouter()
  const [contents, setContents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'exercise',
    url: '',
    youtube_url: '',
    difficulty_level: 2,
    equipment_required: '',
    duration_minutes: '',
    calories_burned: '',
    target_muscles: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    fetchContents()
  }, [])

  const fetchContents = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get('http://localhost:8000/api/fitness-content/', {
        withCredentials: true
      })
      setContents(response.data)
    } catch (err) {
      console.error('Error fetching content:', err)
      setError('Failed to load fitness content. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'exercise',
      url: '',
      youtube_url: '',
      difficulty_level: 2,
      equipment_required: '',
      duration_minutes: '',
      calories_burned: '',
      target_muscles: '',
    })
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccessMessage('')
    
    try {
      const submitData = {
        ...formData,
        difficulty_level: parseInt(formData.difficulty_level),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        calories_burned: formData.calories_burned ? parseInt(formData.calories_burned) : null,
      }
      
      if (editingId) {
        await axios.put(`http://localhost:8000/api/fitness-content/${editingId}/`, submitData, {
          withCredentials: true
        })
        setSuccessMessage('Content updated successfully')
      } else {
        await axios.post('http://localhost:8000/api/fitness-content/', submitData, {
          withCredentials: true
        })
        setSuccessMessage('Content created successfully')
      }
      
      await fetchContents()
      resetForm()
    } catch (err) {
      console.error('Error saving content:', err)
      setError(err.response?.data?.message || 'Failed to save fitness content')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (content) => {
    setFormData({
      title: content.title,
      description: content.description,
      content_type: content.content_type,
      url: content.url || '',
      youtube_url: content.youtube_url || '',
      difficulty_level: content.difficulty_level,
      equipment_required: content.equipment_required || '',
      duration_minutes: content.duration_minutes || '',
      calories_burned: content.calories_burned || '',
      target_muscles: content.target_muscles || '',
    })
    setEditingId(content.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this content?')) return
    
    try {
      await axios.delete(`http://localhost:8000/api/fitness-content/${id}/`, {
        withCredentials: true
      })
      setSuccessMessage('Content deleted successfully')
      await fetchContents()
    } catch (err) {
      console.error('Error deleting content:', err)
      setError('Failed to delete content')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fitness Content Management</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? 'Edit Content' : 'Add New Content'}
        </h2>
        
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <select
                name="content_type"
                value={formData.content_type}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="exercise">Exercise</option>
                <option value="workout">Workout</option>
                <option value="article">Article</option>
                <option value="tutorial">Tutorial</option>
                <option value="diet">Diet</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                rows="4"
                required
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="https://example.com/article"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">YouTube URL</label>
              <input
                type="url"
                name="youtube_url"
                value={formData.youtube_url}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Difficulty Level</label>
              <select
                name="difficulty_level"
                value={formData.difficulty_level}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="1">Beginner</option>
                <option value="2">Intermediate</option>
                <option value="3">Advanced</option>
                <option value="4">Expert</option>
                <option value="5">Professional</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Equipment Required</label>
              <input
                type="text"
                name="equipment_required"
                value={formData.equipment_required}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Dumbbells, resistance bands, etc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Calories Burned</label>
              <input
                type="number"
                name="calories_burned"
                value={formData.calories_burned}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Target Muscles</label>
              <input
                type="text"
                name="target_muscles"
                value={formData.target_muscles}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Chest, biceps, legs, etc."
              />
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-blue-300"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update Content' : 'Add Content'}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Content List</h2>
        
        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : contents.length === 0 ? (
          <div className="bg-gray-50 p-8 text-center rounded-lg">
            <p className="text-gray-600">No fitness content available. Add your first content above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contents.map((content) => (
              <div key={content.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{content.title}</h3>
                    <p className="text-sm text-gray-500">
                      Type: {content.content_type} | Difficulty: {
                        content.difficulty_level === 1 ? 'Beginner' :
                        content.difficulty_level === 2 ? 'Intermediate' :
                        content.difficulty_level === 3 ? 'Advanced' :
                        content.difficulty_level === 4 ? 'Expert' : 'Professional'
                      }
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(content)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(content.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <p className="mt-2 text-sm line-clamp-2">{content.description}</p>
                
                {content.embedding_id && (
                  <div className="mt-2">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Indexed in Pinecone</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 