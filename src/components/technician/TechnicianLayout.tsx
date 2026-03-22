import { ReactNode } from 'react'
import TechnicianBottomNav from './TechnicianBottomNav'

interface TechnicianLayoutProps {
  children: ReactNode
}

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-100 antialiased">
      <div className="flex justify-center min-h-screen">
        <div className="w-full max-w-[600px] bg-[#f0f4f8] relative flex flex-col min-h-screen shadow-[0_0_60px_rgba(0,0,0,0.12)]">
          <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />
          <main className="flex-1 pb-[80px]">
            {children}
          </main>
          <TechnicianBottomNav />
        </div>
      </div>
    </div>
  )
}

export default TechnicianLayout
