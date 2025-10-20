import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface DepartmentCardProps {
  id: string;
  name: string;
  color: string;
  metrics: {
    productivity: number;
    efficiency: number;
    quality: number;
    satisfaction: number;
  };
  performance: {
    current: number;
    previous: number;
    change: number;
  };
  isSelected: boolean;
  onClick: () => void;
}

const DepartmentCard: React.FC<DepartmentCardProps> = ({
  id,
  name,
  color,
  metrics,
  performance,
  isSelected,
  onClick
}) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
        isSelected 
          ? 'border-blue-300 bg-blue-50' 
          : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center mb-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center" 
            style={{ backgroundColor: color }}
          >
            <span className="text-xs font-bold text-white">{name.charAt(0)}</span>
          </div>
        </div>
        
        <h3 className="font-medium text-gray-900 text-base mb-1">{name}</h3>
        
        <div className="flex items-center space-x-1 mb-2">
          {performance.change > 0 ? (
            <ArrowUp className="h-3 w-3 text-green-500" />
          ) : performance.change < 0 ? (
            <ArrowDown className="h-3 w-3 text-red-500" />
          ) : null}
          <span className={`text-sm font-medium ${
            performance.change > 0 ? 'text-green-600' : 
            performance.change < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {performance.change > 0 ? '+' : ''}{performance.change}%
          </span>
        </div>
        
        <div className="w-full mb-2">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full"
              style={{ 
                width: `${performance.current}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>
        
        <div className="flex justify-between w-full text-xs text-gray-500">
          <span>Prod: {metrics.productivity}%</span>
          <span>Qual: {metrics.quality}%</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DepartmentCard;