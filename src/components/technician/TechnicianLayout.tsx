import { ReactNode } from 'react'
import TechnicianBottomNav from './TechnicianBottomNav'

interface TechnicianLayoutProps {
  children: ReactNode
}

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => {
  return (
    <div className="mobile-container">
      <div
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className="mobile-container__inner"
      >
        <main className="mobile-container__content">
          {children}
        </main>
        <TechnicianBottomNav />
      </div>
    </div>
  )
}

export default TechnicianLayout
