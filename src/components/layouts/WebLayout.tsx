import React, { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '../navigation/Sidebar'
import { useUser } from '../../contexts/UserContext'

interface WebLayoutProps {
  children?: React.ReactNode
}

const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  const { isTechnician, isLoading } = useUser()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mainContentMargin, setMainContentMargin] = useState('272px')

  useEffect(() => {
    setMainContentMargin(sidebarCollapsed ? '72px' : '272px')
  }, [sidebarCollapsed])

  if (isLoading) return null

  if (isTechnician) {
    return <Navigate to="/tecnico" replace />
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
