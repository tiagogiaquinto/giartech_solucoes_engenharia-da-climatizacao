import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Info, ExternalLink } from 'lucide-react';

interface InteractiveKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  trend?: {
    value: number;
    label: string;
  };
  onClick?: () => void;
  details?: {
    label: string;
    value: string;
  }[];
  externalLink?: string;
}

export function InteractiveKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
  details,
  externalLink
}: InteractiveKPICardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, translateY: -4 }}
      className={`
        bg-white rounded-2xl p-6 shadow-lg border border-gray-100
        transition-all duration-300 cursor-pointer
        ${onClick ? 'hover:shadow-2xl' : 'hover:shadow-xl'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="h-7 w-7 text-white" />
        </div>

        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
            trend.value >= 0 ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {trend.value >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-xs font-semibold ${
              trend.value >= 0 ? 'text-green-700' : 'text-red-700'
            }`}>
              {Math.abs(trend.value)}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {title}
          {details && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Info className="h-4 w-4" />
            </button>
          )}
        </h3>

        <p className="text-3xl font-bold text-gray-900">{value}</p>

        {subtitle && (
          <p className="text-xs text-gray-500">{subtitle}</p>
        )}

        {trend && (
          <p className="text-xs text-gray-500">{trend.label}</p>
        )}
      </div>

      {showDetails && details && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t border-gray-200 space-y-2"
        >
          {details.map((detail, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{detail.label}</span>
              <span className="font-semibold text-gray-900">{detail.value}</span>
            </div>
          ))}
        </motion.div>
      )}

      {externalLink && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(externalLink, '_blank');
            }}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Ver detalhes completos
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
    </motion.div>
  );
}
