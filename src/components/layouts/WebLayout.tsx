import React, { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import Sidebar from '../navigation/Sidebar'
import { useUser } from '../../contexts/UserContext'
import BroadcastBanner from '../BroadcastBanner'

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
      <div className="transition-all duration-300 flex flex-col min-h-screen" style={{ marginLeft: mainContentMargin }}>
        <BroadcastBanner />
        <main className="flex-1">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
}

export default WebLayout
