import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertBellProps {
  count: number;
  color: string;
  onClick: () => void;
  tooltip?: {
    title: string;
    content: string;
  };
}

const AlertBell: React.FC<AlertBellProps> = ({ count, color, onClick, tooltip }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Bell className="h-5 w-5" style={{ color }} />
        <span 
          className="absolute -top-2 -right-2 w-4 h-4 text-white text-xs flex items-center justify-center rounded-full"
          style={{ backgroundColor: color }}
        >
          {count}
        </span>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200 w-48"
          >
            <div className="h-1 w-full absolute top-0 left-0 rounded-t-lg" style={{ backgroundColor: color }}></div>
            <h4 className="font-medium text-gray-900 mb-1">{tooltip.title}</h4>
            <p className="text-xs text-gray-600">{tooltip.content}</p>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-200"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertBell;