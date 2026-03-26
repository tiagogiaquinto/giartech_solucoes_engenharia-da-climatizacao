import { ReactNode, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X } from 'lucide-react'
import TechnicianBottomNav from './TechnicianBottomNav'
import { useProximityDetector } from '../../hooks/useProximityDetector'
import { useUser } from '../../contexts/UserContext'

interface TechnicianLayoutProps {
  children: ReactNode
}

const TechnicianLayout = ({ children }: TechnicianLayoutProps) => {
  const { user } = useUser()
  const [arrivalBanner, setArrivalBanner] = useState<{ orderNumber: string; clientName: string } | null>(null)

  useProximityDetector({
    employeeId: user?.employee_id ?? null,
    enabled: !!user?.employee_id,
    onArrival: (order) => {
      setArrivalBanner({
        orderNumber: order.order_number,
        clientName: order.client_name ?? 'Cliente',
      })
      setTimeout(() => setArrivalBanner(null), 8000)
    },
  })

  return (
    <div className="mobile-container">
      <div
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        className="mobile-container__inner"
      >
        <AnimatePresence>
          {arrivalBanner && (
            <motion.div
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              className="fixed top-0 left-0 right-0 z-50 mx-3 mt-3"
            >
              <div className="bg-emerald-600 text-white rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">Chegada detectada!</p>
                  <p className="text-xs text-emerald-100 truncate">
                    OS #{arrivalBanner.orderNumber} — {arrivalBanner.clientName}
                  </p>
                  <p className="text-xs text-emerald-200">Status atualizado para Em Atendimento</p>
                </div>
                <button
                  onClick={() => setArrivalBanner(null)}
                  className="p-1 rounded-lg hover:bg-white/20 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="mobile-container__content">
          {children}
        </main>
        <TechnicianBottomNav />
      </div>
    </div>
  )
}

export default TechnicianLayout
