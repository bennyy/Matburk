import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

/**
 * Hook to manage week lock state with localStorage persistence
 */
export function useWeekLock(currentWeekStart) {
  const weekKey = format(currentWeekStart, 'yyyy-MM-dd');

  const [isWeekLocked, setIsWeekLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`weekLock_${weekKey}`);
      return stored === null ? true : stored === 'true';
    }
    return false;
  });

  // Sync lock state when week changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`weekLock_${weekKey}`);
      const locked = stored === null ? true : stored === 'true';
      setIsWeekLocked(locked);
    }
  }, [weekKey]);

  const toggleWeekLock = useCallback(() => {
    const newLocked = !isWeekLocked;
    setIsWeekLocked(newLocked);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`weekLock_${weekKey}`, newLocked.toString());
    }
  }, [isWeekLocked, weekKey]);

  return { isWeekLocked, toggleWeekLock };
}
