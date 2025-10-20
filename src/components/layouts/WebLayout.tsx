import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../navigation/Sidebar'

interface WebLayoutProps {
  children?: React.ReactNode
}

const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mainContentWidth, setMainContentWidth] = useState('calc(100% - 280px)')
  const [mainContentMargin, setMainContentMargin] = useState('280px')

  // Handle sidebar collapse state changes
  const handleSidebarCollapse = (collapsed: boolean) => {
    setSidebarCollapsed(collapsed)
  }

  // Update main content width and margin when sidebar state changes
  useEffect(() => {
    if (sidebarCollapsed) {
      setMainContentWidth('calc(100% - 80px)')
      setMainContentMargin('80px')
    } else {
      setMainContentWidth('calc(100% - 280px)')
      setMainContentMargin('280px')
    }
  }, [sidebarCollapsed])

  // Keyboard shortcut for quick access (Alt + H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'h') {
        // Quick access functionality
        console.log('Quick access activated with Alt+H')
        // Add your quick access functionality here
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Web Sidebar */}
      <Sidebar onCollapse={handleSidebarCollapse} />

      {/* Main Content - Web Optimized */}
      <main
        className="min-h-screen transition-all duration-300"
        style={{
          marginLeft: mainContentMargin
        }}
      >
        {children || <Outlet />}
      </main>
    </div>
  )
}

export default WebLayout