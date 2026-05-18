import { useEffect, useRef, useCallback } from 'react';
import { updateLiveLocation } from '../lib/api';

/**
 * Background geolocation tracking hook for drivers.
 * Watches the driver's position and upserts it to the `live_locations` table
 * via Supabase realtime so passengers can track the ride.
 */
export function useLocationTracking(
  rideId: string | undefined,
  driverId: string | undefined,
  enabled: boolean
) {
  const watchRef = useRef<number | null>(null);
  const lastUpdate = useRef<number>(0);

  const handlePosition = useCallback(
    async (position: GeolocationPosition) => {
      if (!rideId || !driverId) return;

      // Throttle updates to every 5 seconds minimum
      const now = Date.now();
      if (now - lastUpdate.current < 5000) return;
      lastUpdate.current = now;

      try {
        await updateLiveLocation(
          rideId,
          driverId,
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          position.coords.speed
        );
      } catch (error) {
        console.error('[LocationTracking] Failed to update location:', error);
      }
    },
    [rideId, driverId]
  );

  const handleError = useCallback((error: GeolocationPositionError) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.warn('[LocationTracking] User denied geolocation permission');
        break;
      case error.POSITION_UNAVAILABLE:
        console.warn('[LocationTracking] Position unavailable');
        break;
      case error.TIMEOUT:
        console.warn('[LocationTracking] Geolocation request timed out');
        break;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !rideId || !driverId) {
      // Clear any existing watcher
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      console.error('[LocationTracking] Geolocation API not supported');
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
        watchRef.current = null;
      }
    };
  }, [enabled, rideId, driverId, handlePosition, handleError]);
}
