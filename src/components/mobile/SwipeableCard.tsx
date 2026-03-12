import { ReactNode, useRef, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: ReactNode;
  rightAction?: ReactNode;
  className?: string;
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  className = ''
}: SwipeableCardProps) {
  const [dragX, setDragX] = useState(0);
  const constraintsRef = useRef(null);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;

    if (info.offset.x > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    setDragX(0);
  };

  return (
    <div className="relative overflow-hidden" ref={constraintsRef}>
      {/* Left Action (Swipe Right) */}
      {rightAction && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 bg-green-500">
          {rightAction}
        </div>
      )}

      {/* Right Action (Swipe Left) */}
      {leftAction && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center px-4 bg-red-500">
          {leftAction}
        </div>
      )}

      {/* Card Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={(event, info) => setDragX(info.offset.x)}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        className={`relative bg-white ${className}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
