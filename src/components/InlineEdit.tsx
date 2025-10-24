import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit2, Check, X, Loader } from 'lucide-react'

interface InlineEditProps {
  value: string | number
  onSave: (newValue: string | number) => Promise<boolean>
  type?: 'text' | 'number' | 'currency' | 'date' | 'textarea'
  placeholder?: string
  className?: string
  displayFormat?: (value: any) => string
  validate?: (value: any) => string | null
  disabled?: boolean
  multiline?: boolean
}

export const InlineEdit = ({
  value,
  onSave,
  type = 'text',
  placeholder = 'Clique para editar',
  className = '',
  displayFormat,
  validate,
  disabled = false,
  multiline = false
}: InlineEditProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (type === 'text' || type === 'textarea') {
        inputRef.current.select()
      }
    }
  }, [isEditing, type])

  const handleSave = async () => {
    setError(null)

    // Validação
    if (validate) {
      const validationError = validate(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }

    // Se não mudou, apenas cancela
    if (editValue === value) {
      setIsEditing(false)
      return
    }

    try {
      setIsSaving(true)
      const success = await onSave(editValue)

      if (success) {
        setIsEditing(false)
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      } else {
        setError('Erro ao salvar')
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      handleSave()
    }
  }

  const formatDisplay = (val: any) => {
    if (displayFormat) {
      return displayFormat(val)
    }

    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(val) || 0)

      case 'number':
        return new Intl.NumberFormat('pt-BR').format(Number(val) || 0)

      case 'date':
        return val ? new Date(val).toLocaleDateString('pt-BR') : ''

      default:
        return val || placeholder
    }
  }

  if (disabled) {
    return (
      <div className={`text-gray-900 ${className}`}>
        {formatDisplay(value)}
      </div>
    )
  }

  return (
    <div className={`relative group ${className}`}>
      {!isEditing ? (
        // Display Mode
        <button
          onClick={() => setIsEditing(true)}
          className="w-full text-left relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-transparent hover:border-blue-300 hover:bg-blue-50 transition-all group"
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {formatDisplay(value)}
          </span>
          <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full p-1"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      ) : (
        // Edit Mode
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <div className="flex items-start gap-2">
            {multiline || type === 'textarea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={3}
                className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  error ? 'border-red-500' : 'border-blue-500'
                }`}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type === 'currency' || type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                step={type === 'currency' ? '0.01' : undefined}
                className={`flex-1 px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  error ? 'border-red-500' : 'border-blue-500'
                }`}
              />
            )}

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                title={multiline ? 'Ctrl+Enter para salvar' : 'Enter para salvar'}
              >
                {isSaving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors"
                title="Esc para cancelar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 text-sm text-red-600"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {multiline && (
            <div className="mt-1 text-xs text-gray-500">
              Pressione Ctrl+Enter para salvar, Esc para cancelar
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
