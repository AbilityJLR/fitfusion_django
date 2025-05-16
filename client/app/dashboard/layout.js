'use client'

import Navbar from '../components/Navbar'

export default function DashboardLayout({ children }) {
  return (
    <div>
      <Navbar />
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  )
} 
