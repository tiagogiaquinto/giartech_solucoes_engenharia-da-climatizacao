import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Info } from 'lucide-react';

interface BarChartComponentProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  title: string;
  subtitle?: string;
  prefix?: string;
  suffix?: string;
  onBarClick?: (index: number) => void;
}

const BarChartComponent: React.FC<BarChartComponentProps> = ({ 
  data, 
  title, 
  subtitle,
  prefix = '',
  suffix = '',
  onBarClick 
}) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            {prefix}{payload[0].value}{suffix}
          </p>
        </div>
      );
    }
    return null;
  };

  const handleBarClick = (data: any, index: number) => {
    if (onBarClick) {
      onBarClick(index);
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 h-full">
      <div className="flex justify-between items-center mb-4">
        <div className="text-center w-full">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 20, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 10 }}
              height={50}
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="value" 
              animationDuration={300}
              animationBegin={0}
              label={{ 
                position: 'top', 
                fill: '#6b7280',
                fontSize: 10,
                formatter: (value: number) => `${prefix}${value}${suffix}`
              }}
              onClick={handleBarClick}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{ 
                    filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;