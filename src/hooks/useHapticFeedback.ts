import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 30,
  success: [10, 50, 10],
  warning: [20, 100, 20],
  error: [30, 100, 30, 100, 30],
  selection: 5,
};

export const useHapticFeedback = () => {
  const isSupported = 'vibrate' in navigator;

  const vibrate = useCallback((pattern: HapticPattern | number | number[]) => {
    if (!isSupported) return;

    try {
      if (typeof pattern === 'string') {
        const vibrationPattern = patterns[pattern];
        navigator.vibrate(vibrationPattern);
      } else {
        navigator.vibrate(pattern);
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [isSupported]);

  const light = useCallback(() => vibrate('light'), [vibrate]);
  const medium = useCallback(() => vibrate('medium'), [vibrate]);
  const heavy = useCallback(() => vibrate('heavy'), [vibrate]);
  const success = useCallback(() => vibrate('success'), [vibrate]);
  const warning = useCallback(() => vibrate('warning'), [vibrate]);
  const error = useCallback(() => vibrate('error'), [vibrate]);
  const selection = useCallback(() => vibrate('selection'), [vibrate]);

  return {
    vibrate,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    isSupported,
  };
};
