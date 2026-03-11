import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  disabled = false,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef<NodeJS.Timeout>();
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + gap;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - gap;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + gap;
        break;
    }

    const padding = 8;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > window.innerHeight - padding) {
      top = window.innerHeight - tooltipRect.height - padding;
    }

    setCoords({ top, left });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
      return () => {
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isVisible]);

  const clonedChild = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter,
    onBlur: handleMouseLeave,
  });

  const arrowClasses = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700',
  };

  return (
    <>
      {clonedChild}
      {isVisible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={`fixed z-[9999] px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg pointer-events-none animate-fade-in ${className}`}
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            role="tooltip"
          >
            {content}
            <div
              className={`absolute w-0 h-0 border-4 border-transparent ${arrowClasses[position]}`}
            />
          </div>,
          document.body
        )}
    </>
  );
};

export const TooltipTrigger: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block">{children}</span>
);
