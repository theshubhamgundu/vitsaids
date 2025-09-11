import { useState, useEffect } from 'react';
import { showToast } from '../utils/toast';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false
  });

  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: true }));
      showToast.network.online();
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({ ...prev, isOnline: false }));
      showToast.network.offline();
    };

    // Check connection speed
    const checkConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const slowTypes = ['slow-2g', '2g', '3g'];
        const isSlowConnection = slowTypes.includes(connection.effectiveType);
        
        setNetworkStatus(prev => {
          if (isSlowConnection && prev.isOnline && !prev.isSlowConnection) {
            showToast.network.slowConnection();
          }
          return { ...prev, isSlowConnection };
        });
      }
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection speed periodically
    const speedCheckInterval = setInterval(checkConnectionSpeed, 30000); // Every 30 seconds

    // Initial check
    checkConnectionSpeed();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(speedCheckInterval);
    };
  }, []);

  return networkStatus;
}