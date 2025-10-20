import React from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  hover?: boolean
  className?: string
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  hover = false,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4 } : undefined}
      className={`bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow ${
        hover ? 'hover:shadow-md' : ''
      } ${className}`}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  )
}

export default Card
