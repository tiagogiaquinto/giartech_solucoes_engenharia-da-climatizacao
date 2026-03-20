import { ReactNode } from 'react'
import TechnicianBottomNav from './TechnicianBottomNav'

interface TechnicianLayoutProps {
  children: ReactNode
}

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-20">
        {children}
      </main>
      <TechnicianBottomNav />
    </div>
  )
}

export default TechnicianLayout
