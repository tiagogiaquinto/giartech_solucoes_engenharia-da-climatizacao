import React, { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '../navigation/Sidebar'
import TechnicianLayout from '../technician/TechnicianLayout'
import { useUser } from '../../contexts/UserContext'

interface WebLayoutProps {
  children?: React.ReactNode
}

const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  const { profile, isLoading } = useUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mainContentMargin, setMainContentMargin] = useState('280px')

  const isTechnician =
    profile?.role === 'technician' || profile?.user_type === 'tecnico'

  useEffect(() => {
    setMainContentMargin(sidebarCollapsed ? '80px' : '280px')
  }, [sidebarCollapsed])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'h') {
        console.log('Quick access activated with Alt+H')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (isLoading) return null

  if (isTechnician) {
    return (
      <TechnicianLayout>
        <Navigate to="/tecnico" replace />
      </TechnicianLayout>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar onCollapse={setSidebarCollapsed} />
      <main
        className="min-h-screen transition-all duration-300"
        style={{ marginLeft: mainContentMargin }}
      >
        {children || <Outlet />}
      </main>
    </div>
  )
}

export default WebLayout
