'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '../utils/auth';
import style from './Register.module.css'
import Navbar from '../components/Navbar';
import '../style.css'

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: ''
  })
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await register(formData);

      if (result.success) {
        console.log("Registration successful:", result.data);
        setSuccess(true);

        setTimeout(() => {
          router.push('/profile/setup');
        }, 1500);
      } else {
        setErrorMessage(result.error);
      }
    } catch (error) {
      console.error('Error during registration:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      {loading && <div>Loading...</div>}
      {success && (
        <div style={{ color: 'green', margin: '10px 0' }}>
          Registration successful! You can now log in.
        </div>
      )}
      {errorMessage && (
        <div style={{ color: 'red', margin: '10px 0', whiteSpace: 'pre-line' }}>
          {errorMessage}
        </div>
      )}
      <div className={style.container}>
        <div className={style.inner_container}>
          <h1>Register</h1>
          <form onSubmit={onSubmit}>
            <label className='form-label'>email</label>
            <input className='form-input' type='email' name='email' value={formData.email} onChange={handleChange} placeholder='email' required />
            <label className='form-label'>username</label>
            <input className='form-input' name='username' value={formData.username} onChange={handleChange} placeholder='username' required />
            <div className={style.test}>
              <div>
                <label className='form-label'>password</label>
                <input className='form-input' type='password' name='password' value={formData.password} onChange={handleChange} placeholder='password' required />
              </div>
              <div>
                <label className='form-label'>confirm password</label>
                <input className='form-input' type='password' name='password2' value={formData.password2} onChange={handleChange} placeholder='confirm password' required />
              </div>
            </div>
            <input className='btn btn-primary' style={{ marginTop: "1rem" }} type='submit' disabled={loading} />
          </form>
        </div>
      </div>
    </div>
  )
}
