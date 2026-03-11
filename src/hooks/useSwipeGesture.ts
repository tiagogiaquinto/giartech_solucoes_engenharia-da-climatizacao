import { useEffect, useRef, useState } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export const useSwipeGesture = (options: SwipeGestureOptions) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefaultTouchmoveEvent = false,
  } = options;

  const touchStart = useRef<TouchPosition | null>(null);
  const touchEnd = useRef<TouchPosition | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
    setIsSwiping(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (preventDefaultTouchmoveEvent && touchStart.current) {
      e.preventDefault();
    }
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) {
      setIsSwiping(false);
      return;
    }

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = touchEnd.current.time - touchStart.current.time;

    if (deltaTime > maxSwipeTime) {
      setIsSwiping(false);
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY && absX > minSwipeDistance) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > minSwipeDistance) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    setIsSwiping(false);
    touchStart.current = null;
    touchEnd.current = null;
  };

  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, minSwipeDistance, maxSwipeTime]);

  return { ref, isSwiping };
};
