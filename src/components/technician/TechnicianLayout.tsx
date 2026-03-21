import { ReactNode } from 'react'
import TechnicianBottomNav from './TechnicianBottomNav'

interface TechnicianLayoutProps {
  children: ReactNode
}

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => {
  return (
    <div className="min-h-screen bg-[#f0f4f8] antialiased overflow-x-hidden">
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-[#0f172a]"
        style={{ height: 'env(safe-area-inset-top, 0px)' }}
      />
      <main
        className="pb-[88px] min-h-screen"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {children}
      </main>
      <TechnicianBottomNav />
    </div>
  )
}

export default TechnicianLayout
