import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, Wifi, Cloud, CloudOff, RefreshCw } from 'lucide-react'

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showIndicator, setShowIndicator] = useState(!navigator.onLine)
  const [pendingSync, setPendingSync] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowIndicator(true)

      // Esconder após 3 segundos
      setTimeout(() => setShowIndicator(false), 3000)

      // Tentar sincronizar dados pendentes
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          return (registration as any).sync?.register('sync-pending-requests')
        }).then(() => {
          setPendingSync(true)
        }).catch(err => {
          console.error('Sync registration failed:', err)
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listener para mensagens do Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_COMPLETE') {
          setPendingSync(false)
          console.log(`Synced ${event.data.count} pending requests`)
        }
      })
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Não mostrar nada se online e não deve mostrar indicador
  if (isOnline && !showIndicator) {
    return null
  }

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div
            className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-lg ${
              isOnline
                ? 'bg-green-500 text-white'
                : 'bg-orange-500 text-white'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-5 w-5" />
                <span className="font-medium">Conectado</span>
                {pendingSync && (
                  <>
                    <div className="h-4 w-px bg-white/30" />
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Sincronizando...</span>
                  </>
                )}
              </>
            ) : (
              <>
                <WifiOff className="h-5 w-5" />
                <span className="font-medium">Modo Offline</span>
                <div className="h-4 w-px bg-white/30" />
                <CloudOff className="h-4 w-4" />
                <span className="text-sm">Dados em cache</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
