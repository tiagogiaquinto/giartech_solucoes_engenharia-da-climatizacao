import { motion, AnimatePresence } from 'framer-motion'
import { X, Save } from 'lucide-react'
import { ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon: React.ElementType
}

interface StandardModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  title: string
  subtitle?: string
  loading?: boolean
  saveButtonText?: string
  tabs?: Tab[]
  activeTab?: string
  onTabChange?: (tabId: string) => void
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl'
}

const StandardModal = ({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  loading = false,
  saveButtonText = 'Salvar',
  tabs,
  activeTab,
  onTabChange,
  children,
  maxWidth = '4xl'
}: StandardModalProps) => {
  if (!isOpen) return null

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl'
  }[maxWidth]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-xl w-full ${maxWidthClass} max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header com gradiente */}
        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && <p className="text-blue-100 text-sm mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs (opcional) */}
        {tabs && tabs.length > 0 && (
          <div className="flex border-b bg-gray-50">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange && onTabChange(tab.id)}
                  className={`flex-1 px-6 py-4 font-medium text-sm flex items-center justify-center gap-2 border-b-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Footer fixo */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-5 w-5" />
                {saveButtonText}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default StandardModal
