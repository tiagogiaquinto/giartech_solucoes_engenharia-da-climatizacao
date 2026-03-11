import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'text',
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={{ width, height }}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3">
    <Skeleton width="60%" height="1.5rem" animation="wave" />
    <Skeleton width="100%" height="1rem" animation="wave" />
    <Skeleton width="80%" height="1rem" animation="wave" />
    <div className="flex gap-2 mt-4">
      <Skeleton width="5rem" height="2rem" variant="rounded" animation="wave" />
      <Skeleton width="5rem" height="2rem" variant="rounded" animation="wave" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="space-y-2">
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={`header-${i}`} height="2.5rem" animation="wave" variant="rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, colIndex) => (
          <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="3rem" animation="wave" variant="rounded" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
        <Skeleton width="3rem" height="3rem" variant="circular" animation="wave" />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height="1rem" animation="wave" />
          <Skeleton width="50%" height="0.875rem" animation="wave" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3">
          <Skeleton width="50%" height="1rem" animation="wave" />
          <Skeleton width="80%" height="2rem" animation="wave" />
          <Skeleton width="40%" height="0.875rem" animation="wave" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
        <Skeleton width="40%" height="1.5rem" animation="wave" />
        <Skeleton width="100%" height="15rem" animation="wave" variant="rounded" />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-4">
        <Skeleton width="40%" height="1.5rem" animation="wave" />
        <Skeleton width="100%" height="15rem" animation="wave" variant="rounded" />
      </div>
    </div>
  </div>
);

export const SkeletonForm: React.FC<{ fields?: number }> = ({ fields = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton width="30%" height="1rem" animation="wave" />
        <Skeleton width="100%" height="2.5rem" animation="wave" variant="rounded" />
      </div>
    ))}
    <div className="flex gap-3 mt-6">
      <Skeleton width="8rem" height="2.5rem" variant="rounded" animation="wave" />
      <Skeleton width="8rem" height="2.5rem" variant="rounded" animation="wave" />
    </div>
  </div>
);
