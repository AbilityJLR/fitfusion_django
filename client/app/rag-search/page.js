'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

export default function RAGSearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [contentType, setContentType] = useState('')
  const [difficultyLevel, setDifficultyLevel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [error, setError] = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.append('query', query)
      if (contentType) params.append('content_type', contentType)
      if (difficultyLevel) params.append('difficulty_level', difficultyLevel)
      
      const response = await axios.get(`http://localhost:8000/api/fitness-content/search/?${params.toString()}`, {
        withCredentials: true
      })
      
      setSearchResults(response.data.results || [])
    } catch (err) {
      console.error('Search error:', err)
      setError(err.response?.data?.message || 'An error occurred while searching')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fitness Knowledge Search</h1>
      <p className="text-gray-600 mb-6">
        Search our fitness database for workouts, exercises, and tips using our AI-powered search
      </p>
      
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-6">
          <label htmlFor="query" className="block text-sm font-medium mb-2">
            Search Query
          </label>
          <input
            type="text"
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E.g., best exercises for weight loss, upper body workouts..."
            className="w-full p-3 border rounded-md"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="contentType" className="block text-sm font-medium mb-2">
              Content Type
            </label>
            <select
              id="contentType"
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full p-3 border rounded-md"
            >
              <option value="">All Types</option>
              <option value="exercise">Exercise</option>
              <option value="workout">Workout</option>
              <option value="article">Article</option>
              <option value="tutorial">Tutorial</option>
              <option value="diet">Diet</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="difficultyLevel" className="block text-sm font-medium mb-2">
              Difficulty Level
            </label>
            <select
              id="difficultyLevel"
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full p-3 border rounded-md"
            >
              <option value="">All Levels</option>
              <option value="1">Beginner</option>
              <option value="2">Intermediate</option>
              <option value="3">Advanced</option>
              <option value="4">Expert</option>
              <option value="5">Professional</option>
            </select>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md disabled:bg-blue-300"
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {searchResults.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Search Results</h2>
          {searchResults.map((result, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex justify-between">
                <h3 className="text-xl font-bold">{result.metadata.title}</h3>
                <span className="text-sm bg-blue-100 text-blue-800 py-1 px-2 rounded">
                  Match: {Math.round(result.score * 100)}%
                </span>
              </div>
              
              <p className="text-gray-600 mt-2">{result.metadata.description}</p>
              
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {result.metadata.content_type}
                </div>
                <div>
                  <span className="font-medium">Difficulty:</span> {
                    result.metadata.difficulty_level === 1 ? 'Beginner' :
                    result.metadata.difficulty_level === 2 ? 'Intermediate' :
                    result.metadata.difficulty_level === 3 ? 'Advanced' :
                    result.metadata.difficulty_level === 4 ? 'Expert' : 'Professional'
                  }
                </div>
                {result.metadata.duration_minutes && (
                  <div>
                    <span className="font-medium">Duration:</span> {result.metadata.duration_minutes} minutes
                  </div>
                )}
                {result.metadata.calories_burned && (
                  <div>
                    <span className="font-medium">Calories:</span> ~{result.metadata.calories_burned}
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                {result.metadata.url && (
                  <a 
                    href={result.metadata.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm inline-flex items-center"
                  >
                    <span>Read More</span>
                  </a>
                )}
                {result.metadata.youtube_url && (
                  <a 
                    href={result.metadata.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm inline-flex items-center"
                  >
                    <span>Watch Video</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : query && !isLoading ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-gray-600">No results found. Try a different search query.</p>
        </div>
      ) : null}
    </div>
  )
} 