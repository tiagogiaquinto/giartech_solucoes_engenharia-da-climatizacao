import React, { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../navigation/Sidebar'
import { isMobile } from '../../utils/pwa'

interface WebLayoutProps {
  children?: React.ReactNode
}

const WebLayout: React.FC<WebLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [mainContentMargin, setMainContentMargin] = useState('280px')

  useEffect(() => {
    const checkMobile = () => {
      const mobileDetected = isMobile() || window.innerWidth < 768
      setMobile(mobileDetected)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (mobile) {
      setMainContentMargin('0px')
    } else if (sidebarCollapsed) {
      setMainContentMargin('80px')
    } else {
      setMainContentMargin('280px')
    }
  }, [sidebarCollapsed, mobile])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'h') {
        console.log('Quick access activated with Alt+H')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {!mobile && <Sidebar onCollapse={setSidebarCollapsed} />}

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