import { ReactNode } from 'react'
import TechnicianBottomNav from './TechnicianBottomNav'

interface TechnicianLayoutProps {
  children: ReactNode
}

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 antialiased">
      <div className="safe-area-top bg-gray-50" />
      <main className="pb-24 min-h-screen">
        {children}
      </main>
      <TechnicianBottomNav />
    </div>
  )
}

export default TechnicianLayout
