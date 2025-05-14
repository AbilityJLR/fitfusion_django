'use client'

import { useState } from 'react';
import axios from 'axios';

export default function () {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    password2: '',
    fullname 
  })
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    console.log('Submitting data:', formData);
    
    try {
      const response = await axios.post('http://localhost:8000/api/register/', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("Success:", response.data)
    } catch (error) {
      console.error('Error sending data:', error.message, error.code, error);
      if (error.response) {
        console.error('Server Error Response:', error.response.data);
        setErrorMessage(JSON.stringify(error.response.data));
      }
    }
  }

  return (
    <div>
      {errorMessage && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          {errorMessage}
        </div>
      )}
      <form onSubmit={onSubmit}>
        <label>email</label>
        <input type='email' name='email' value={formData.email} onChange={handleChange} placeholder='email' required />
        <label>username</label>
        <input name='username' value={formData.username} onChange={handleChange} placeholder='username' required />
        <label>password</label>
        <input type='password' name='password' value={formData.password} onChange={handleChange} placeholder='password' required />
        <label>confirm password</label>
        <input type='password' name='password2' value={formData.password2} onChange={handleChange} placeholder='confirm password' required />
        <input type='submit' />
      </form>
    </div>
  )
}
