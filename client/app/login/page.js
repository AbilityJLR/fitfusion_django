'use client'

import { useState } from "react"
import { login } from "../utils/auth"
import { useRouter } from "next/navigation"
import { useAuth } from "../components/AuthProvider"
import Link from "next/link"
import Navbar from "../components/Navbar"
import style from "./Login.module.css"
import '../style.css'

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
    <div>
      <Navbar />
      <div className={style.container}>
        <div className={style.box}>
          <div>
            <h1>
              Sign in to your account
            </h1>
            <form onSubmit={handleSubmit}>
              <div>
                <label className="form-label">
                  Username
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="username"
                  id="username"
                  placeholder="yourusername"
                  required
                  onChange={handleChange}
                  value={formData.username}
                />
              </div>
              <div>
                <label className="form-label">
                  Password
                </label>
                <input
                  className="form-input"
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  required
                  onChange={handleChange}
                  value={formData.password}
                />
              </div>

              {error && <div>{error}</div>}

              <button
                className="btn btn-primary"
                style={{ marginTop: "1rem", marginBottom: ".5rem" }}
                type="submit"
                disabled={loginInProgress}
              >
                {loginInProgress ? "Signing in..." : "Sign in"}
              </button>

              <p>
                Don't have an account yet? <Link href="/register">Sign up</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
