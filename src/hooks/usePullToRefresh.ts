import { useEffect, useRef, useState, useCallback } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPullDistance = 150,
  disabled = false,
}: PullToRefreshOptions) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);

  const touchStartY = useRef(0);
  const scrollableElement = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing) return;

    const scrollTop = scrollableElement.current?.scrollTop || window.scrollY;
    if (scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || isRefreshing || touchStartY.current === 0) return;

    const scrollTop = scrollableElement.current?.scrollTop || window.scrollY;
    if (scrollTop > 0) {
      touchStartY.current = 0;
      setPullDistance(0);
      setCanRefresh(false);
      return;
    }

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY.current;

    if (deltaY > 0) {
      e.preventDefault();
      const distance = Math.min(deltaY * 0.5, maxPullDistance);
      setPullDistance(distance);
      setCanRefresh(distance >= threshold);
    }
  }, [disabled, isRefreshing, threshold, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;

    touchStartY.current = 0;

    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          setCanRefresh(false);
        }, 300);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [canRefresh, disabled, isRefreshing, onRefresh, pullDistance, threshold]);

  const ref = useCallback((node: HTMLElement | null) => {
    scrollableElement.current = node;
  }, []);

  useEffect(() => {
    const element = scrollableElement.current || document.body;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min((pullDistance / threshold) * 100, 100);

  return {
    ref,
    pullDistance,
    isRefreshing,
    canRefresh,
    progress,
  };
};
