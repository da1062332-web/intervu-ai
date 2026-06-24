import { useEffect, useState } from 'react';
import { eventTracker } from '../services/test-event-tracker';

export function useTabMonitor() {
  const [tabHiddenCount, setTabHiddenCount] = useState(0);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      setIsTabHidden(hidden);

      if (hidden) {
        setTabHiddenCount((prev) => prev + 1);
        setShowWarning(true);
        eventTracker.track('TAB_HIDDEN');
      } else {
        eventTracker.track('TAB_VISIBLE');
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, []);

  const dismissWarning = () => setShowWarning(false);

  return { tabHiddenCount, isTabHidden, showWarning, dismissWarning };
}
