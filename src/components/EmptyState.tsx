import React from 'react'
import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  size = 'md'
}) => {
  const sizes = {
    sm: {
      icon: 'w-12 h-12',
      iconSize: 'w-6 h-6',
      title: 'text-base',
      description: 'text-sm',
      padding: 'py-8'
    },
    md: {
      icon: 'w-16 h-16',
      iconSize: 'w-8 h-8',
      title: 'text-lg',
      description: 'text-sm',
      padding: 'py-12'
    },
    lg: {
      icon: 'w-20 h-20',
      iconSize: 'w-10 h-10',
      title: 'text-xl',
      description: 'text-base',
      padding: 'py-16'
    }
  }

  const currentSize = sizes[size]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center ${currentSize.padding} px-4 ${className}`}
    >
      <div className={`${currentSize.icon} bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-4 shadow-sm`}>
        <Icon className={`${currentSize.iconSize} text-gray-400`} />
      </div>

      <h3 className={`${currentSize.title} font-semibold text-gray-900 mb-2 text-center`}>
        {title}
      </h3>

      <p className={`${currentSize.description} text-gray-600 text-center max-w-md mb-6`}>
        {description}
      </p>

      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                action.variant === 'secondary'
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
              }`}
            >
              {action.label}
            </motion.button>
          )}
          {secondaryAction && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={secondaryAction.onClick}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
            >
              {secondaryAction.label}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default EmptyState
