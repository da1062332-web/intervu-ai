import { useEffect, useState } from 'react';
import { eventTracker } from '../services/test-event-tracker';
import { apiClient } from '@/services/api/client';

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

        // Transmit proctoring event to live monitoring server
        try {
          const testId = (window as any).__current_test_instance_id;
          if (testId && !testId.startsWith('demo-')) {
            apiClient
              .request(`/tests/${testId}/telemetry/proctoring`, {
                method: 'POST',
                body: {
                  eventType: 'TAB_HIDDEN',
                  metadata: { hiddenTimestamp: new Date().toISOString() },
                },
                skipErrorToast: true,
              })
              .catch(() => {});
          }
        } catch {}
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
