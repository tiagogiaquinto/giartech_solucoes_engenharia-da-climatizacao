import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface DonutChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
  subtitle?: string;
  onSegmentClick?: (index: number) => void;
}

const DonutChart: React.FC<DonutChartProps> = ({ 
  data, 
  title, 
  subtitle,
  onSegmentClick 
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  const handleClick = (_: any, index: number) => {
    if (onSegmentClick) {
      onSegmentClick(index);
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{payload[0].name}</p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 h-full">
      <div className="flex flex-col items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900 text-center">{title}</h2>
        {subtitle && <p className="text-xs text-gray-600 text-center">{subtitle}</p>}
      </div>
      
      <div className="h-48 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              animationDuration={300}
              animationBegin={0}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke={entry.color}
                  style={{ 
                    filter: activeIndex === index ? 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.2))' : 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))',
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.7,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {data.map((entry, index) => (
          <motion.div 
            key={entry.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 p-1 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => handleClick(entry, index)}
            onMouseEnter={() => handleMouseEnter(entry, index)}
            onMouseLeave={handleMouseLeave}
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 truncate">{entry.name}</p>
            </div>
            <p className="text-xs font-bold text-gray-900">{entry.value}%</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;