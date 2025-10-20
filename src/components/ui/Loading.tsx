import React from 'react'
import { motion } from 'framer-motion'
import { Loader as Loader2 } from 'lucide-react'

interface LoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
  className?: string
}

const Loading: React.FC<LoadingProps> = ({
  message = 'Carregando...',
  size = 'md',
  fullScreen = false,
  className = ''
}) => {
  const sizes = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`flex flex-col items-center justify-center ${className}`}
    >
      <Loader2 className={`${sizes[size]} text-blue-600 animate-spin`} />
      {message && (
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      )}
    </motion.div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  )
}

export default Loading
