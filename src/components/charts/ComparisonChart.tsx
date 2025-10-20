import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonChartProps {
  data: Array<{
    name: string;
    current: number;
    previous: number;
    color: string;
  }>;
  title: string;
  subtitle?: string;
  metricType: string;
  onMetricChange: (metric: string) => void;
  onBarClick?: (index: number) => void;
}

const ComparisonChart: React.FC<ComparisonChartProps> = ({ 
  data, 
  title, 
  subtitle,
  metricType,
  onMetricChange,
  onBarClick 
}) => {
  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}%
            </p>
          ))}
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

  const metricOptions = [
    { value: 'productivity', label: 'Produtividade' },
    { value: 'efficiency', label: 'Eficiência' },
    { value: 'quality', label: 'Qualidade' },
    { value: 'satisfaction', label: 'Satisfação' }
  ];

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 h-full">
      <div className="flex flex-col items-center mb-4">
        <h2 className="text-base font-semibold text-gray-900 text-center">{title}</h2>
        {subtitle && <p className="text-xs text-gray-600 text-center">{subtitle}</p>}
        
        <select
          value={metricType}
          onChange={(e) => onMetricChange(e.target.value)}
          className="mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          {metricOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
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
              domain={[0, 100]} 
              tick={{ fontSize: 10 }}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: '10px' }}/>
            <Bar 
              name="Atual" 
              dataKey="current" 
              fill="#3b82f6"
              animationDuration={300}
              animationBegin={0}
              radius={[4, 4, 0, 0]}
              onClick={handleBarClick}
            />
            <Bar 
              name="Anterior" 
              dataKey="previous" 
              fill="#93c5fd"
              animationDuration={300}
              animationBegin={150}
              radius={[4, 4, 0, 0]}
              onClick={handleBarClick}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ComparisonChart;