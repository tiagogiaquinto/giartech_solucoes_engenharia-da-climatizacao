import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, X, Sparkles, ArrowRight } from 'lucide-react'
import { useAppUpdate } from '../hooks/useAppUpdate'

export default function UpdateBanner() {
  const { updateAvailable, newVersion, applyUpdate, dismissUpdate } = useAppUpdate()

  return (
    <AnimatePresence>
      {updateAvailable && newVersion && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[9999]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="bg-[#0f172a] border-b border-blue-800/60 shadow-2xl">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">
                  Nova versão disponível — {newVersion.version}
                </p>
                {newVersion.release_notes && (
                  <p className="text-blue-300 text-xs mt-0.5 truncate">{newVersion.release_notes}</p>
                )}
              </div>

              <button
                onClick={applyUpdate}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-colors active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
                <ArrowRight className="w-3 h-3" />
              </button>

              <button
                onClick={dismissUpdate}
                className="p-1.5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
