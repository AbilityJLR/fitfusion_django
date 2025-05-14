'use client'
import { useState } from "react"
import { login } from "../utils/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "../components/AuthProvider"
import Navbar from "../components/Navbar"

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuth()
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })
  const [error, setError] = useState("")
  const [loginInProgress, setLoginInProgress] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoginInProgress(true)
    
    try {
      const result = await login(formData.username, formData.password)
      
      if (result.success) {
        setAuth({
          isAuthenticated: true,
          isLoading: false
        })
        
        router.push('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoginInProgress(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
        <div className="w-full bg-white rounded-lg shadow md:mt-0 sm:max-w-md xl:p-0">
          <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
              Sign in to your account
            </h1>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  id="username"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  placeholder="yourusername"
                  required
                  onChange={handleChange}
                  value={formData.username}
                />
              </div>
              <div>
                <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                  required
                  onChange={handleChange}
                  value={formData.password}
                />
              </div>
              
              {error && <div className="text-red-500 text-sm">{error}</div>}
              
              <button
                type="submit"
                className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                disabled={loginInProgress}
              >
                {loginInProgress ? "Signing in..." : "Sign in"}
              </button>
              
              <p className="text-sm font-light text-gray-500">
                Don't have an account yet? <a href="/register" className="font-medium text-primary-600 hover:underline">Sign up</a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
