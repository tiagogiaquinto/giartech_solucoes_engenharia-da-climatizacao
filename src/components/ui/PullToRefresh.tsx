import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}) => {
  const { ref, pullDistance, isRefreshing, canRefresh, progress } = usePullToRefresh({
    onRefresh,
    threshold,
    disabled,
  });

  return (
    <div ref={ref} className="relative overflow-auto h-full">
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-50"
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: pullDistance > 0 ? pullDistance : 0,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex flex-col items-center gap-2 pb-2">
          <motion.div
            animate={{
              rotate: isRefreshing ? 360 : progress * 3.6,
            }}
            transition={{
              duration: isRefreshing ? 1 : 0,
              repeat: isRefreshing ? Infinity : 0,
              ease: 'linear',
            }}
          >
            <RefreshCw
              className={`w-6 h-6 ${
                canRefresh ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
          </motion.div>
          {pullDistance > 0 && (
            <motion.span
              className="text-xs font-medium text-gray-600 dark:text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {isRefreshing
                ? 'Atualizando...'
                : canRefresh
                ? 'Solte para atualizar'
                : 'Puxe para atualizar'}
            </motion.span>
          )}
        </div>
      </motion.div>

      <motion.div
        animate={{
          y: pullDistance > 0 && !isRefreshing ? pullDistance : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
