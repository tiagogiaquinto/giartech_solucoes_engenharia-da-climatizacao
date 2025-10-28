/**
 * Indicador Visual de Auto-Save
 *
 * Mostra status do salvamento automático:
 * - Salvando...
 * - Salvo há X minutos
 * - Erro ao salvar
 */

import React from 'react'
import { Save, Check, AlertCircle, Loader2, Cloud } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DraftStatus } from '../hooks/useDraftAutoSave'

interface DraftAutoSaveIndicatorProps {
  status: DraftStatus
  timeSinceLastSave: string | null
  className?: string
}

export const DraftAutoSaveIndicator: React.FC<DraftAutoSaveIndicatorProps> = ({
  status,
  timeSinceLastSave,
  className = ''
}) => {
  // Não mostrar se nunca foi salvo
  if (!status.lastSaved && !status.isSaving && !status.error) {
    return null
  }

  const getStatusConfig = () => {
    if (status.error) {
      return {
        icon: AlertCircle,
        text: 'Erro ao salvar',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      }
    }

    if (status.isSaving) {
      return {
        icon: Loader2,
        text: 'Salvando...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        animate: true
      }
    }

    return {
      icon: Check,
      text: timeSinceLastSave ? `Salvo ${timeSinceLastSave}` : 'Salvo',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border
          ${config.bgColor} ${config.borderColor}
          ${className}
        `}
      >
        <Icon
          className={`
            w-4 h-4 ${config.color}
            ${config.animate ? 'animate-spin' : ''}
          `}
        />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>

        {status.error && (
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-red-700 hover:underline ml-2"
          >
            Recarregar
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Versão compacta (ícone apenas)
 */
export const DraftAutoSaveIcon: React.FC<DraftAutoSaveIndicatorProps> = ({
  status,
  timeSinceLastSave,
  className = ''
}) => {
  if (!status.lastSaved && !status.isSaving && !status.error) {
    return null
  }

  const getStatusConfig = () => {
    if (status.error) {
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        title: 'Erro ao salvar'
      }
    }

    if (status.isSaving) {
      return {
        icon: Loader2,
        color: 'text-blue-600',
        title: 'Salvando...',
        animate: true
      }
    }

    return {
      icon: Cloud,
      color: 'text-green-600',
      title: timeSinceLastSave ? `Salvo ${timeSinceLastSave}` : 'Salvo'
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div
      className={`relative ${className}`}
      title={config.title}
    >
      <Icon
        className={`
          w-5 h-5 ${config.color}
          ${config.animate ? 'animate-spin' : ''}
        `}
      />

      {!status.error && !status.isSaving && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"
        />
      )}
    </div>
  )
}

export default DraftAutoSaveIndicator
