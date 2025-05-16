'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Navbar from '@/app/components/Navbar'
import styles from './Content.module.css'
import '../../style.css'

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

  const getEmbedUrl = (youtube_url) => {
    if (!youtube_url || typeof youtube_url !== "string") return null;
    const video_id = youtube_url.split('/').pop();
    return `https://www.youtube.com/embed/${video_id}`
  }

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

  useEffect(() => {
    if (successMessage) {
      alert(successMessage);
    }
  }, [successMessage]);

  return (
    <div>
      <Navbar />

      <div className={styles.container}>
        <div className={styles.contentContainer}>
          <div className={styles.innerContainer}>
            <h1 className='gradient-text'>Fitness Content Management</h1>
            <hr className='line' />
            <h2>
              {editingId ? 'Edit Content' : 'Add New Content'}
            </h2>

            {successMessage && (
              <div>
                <p>{successMessage}</p>
              </div>
            )}

            {error && (
              <div>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className={styles.content}>
                <div>
                  <label className='form-label'>Title</label>
                  <input
                    className='form-input'
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className='form-label'>Content Type</label>
                  <select
                    className='form-input'
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleChange}
                    required
                  >
                    <option value="exercise">Exercise</option>
                    <option value="workout">Workout</option>
                    <option value="article">Article</option>
                    <option value="tutorial">Tutorial</option>
                    <option value="diet">Diet</option>
                  </select>
                </div>

                <div>
                  <label className='form-label'>Description</label>
                  <textarea
                    className='form-input'
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className='form-label'>URL</label>
                  <input
                    className='form-input'
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://example.com/article"
                  />
                </div>

                <div>
                  <label className='form-label'>YouTube URL</label>
                  <input
                    className='form-input'
                    type="url"
                    name="youtube_url"
                    value={formData.youtube_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div>
                  <label className='form-label'>Difficulty Level</label>
                  <select
                    className='form-input'
                    name="difficulty_level"
                    value={formData.difficulty_level}
                    onChange={handleChange}
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
                  <label className='form-label'>Equipment Required</label>
                  <input
                    className='form-input'
                    type="text"
                    name="equipment_required"
                    value={formData.equipment_required}
                    onChange={handleChange}
                    placeholder="Dumbbells, resistance bands, etc."
                  />
                </div>

                <div>
                  <label className='form-label'>Duration (minutes)</label>
                  <input
                    className='form-input'
                    type="number"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div>
                  <label className='form-label'>Calories Burned</label>
                  <input
                    className='form-input'
                    type="number"
                    name="calories_burned"
                    value={formData.calories_burned}
                    onChange={handleChange}
                    min="0"
                  />
                </div>

                <div>
                  <label className='form-label'>Target Muscles</label>
                  <input
                    className='form-input'
                    type="text"
                    name="target_muscles"
                    value={formData.target_muscles}
                    onChange={handleChange}
                    placeholder="Chest, biceps, legs, etc."
                  />
                </div>
              </div>

              <div>
                <button
                  className='btn btn-primary'
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Content' : 'Add Content'}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
          <hr className='line' />
          <div>
            <h2 style={{ margin: ".5rem 0" }}>Content List</h2>

            {isLoading ? (
              <div>Loading...</div>
            ) : contents.length === 0 ? (
              <div>
                <p>No fitness content available. Add your first content above.</p>
              </div>
            ) : (
              <div className={styles.contentList}>
                {contents.map((content) => (
                  <div key={content.id} className={styles.contentListBox}>
                    <div>
                      <div className={styles.retrieveContent}>
                        <h3>{content.title}</h3>
                        <iframe width="100%" height="300px"
                          className={styles.video}
                          src={getEmbedUrl(content.youtube_url)}
                          title="YouTube Shorts video"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen>
                        </iframe>
                        <p>
                          <span className='badge-light'>{content.content_type}</span><span className='badge-light'>{
                            content.difficulty_level === 1 ? 'Beginner' :
                              content.difficulty_level === 2 ? 'Intermediate' :
                                content.difficulty_level === 3 ? 'Advanced' :
                                  content.difficulty_level === 4 ? 'Expert' : 'Professional'
                          }</span>
                        </p>
                      </div>
                      <div className={styles.descriptionContent}>{content.description}</div>

                      <div className={styles.manageButtonBox}>
                        <button
                          className='btn btn-warn'
                          onClick={() => handleEdit(content)}
                        >
                          Edit
                        </button>
                        <button
                          className='btn btn-danger'
                          style={{ marginLeft: ".5rem", fontSize: ".875rem" }}
                          onClick={() => handleDelete(content.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>


                    {content.embedding_id && (
                      <div style={{ marginTop: "1rem" }}>
                        <span className='badge-light'>Pinecone</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 
