import { useState, useEffect } from 'react';
import { apiRequest } from './api';

export function useServerHealth() {
  const [isServerReachable, setIsServerReachable] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const data = await apiRequest('/health');
        if (isMounted) {
          setIsServerReachable(data?.status === 'ok');
        }
      } catch {
        if (isMounted) {
          setIsServerReachable(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return isServerReachable;
}
