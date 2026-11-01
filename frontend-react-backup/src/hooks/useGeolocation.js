import { useState, useCallback } from 'react';

/**
 * Haversine formula to compute great-circle distance between two points in meters
 */
const calculateHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

export const useGeolocation = () => {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message || 'Location permission denied');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  }, []);

  /**
   * Estimate walk time in minutes to target service coordinates
   * Walking speed roughly 75 meters / minute (~4.5 km/h) on campus paths
   */
  const estimateWalkTimeMinutes = useCallback(
    (targetLat, targetLng) => {
      if (!coordinates || !targetLat || !targetLng) return null;

      const distanceMeters = calculateHaversineDistanceMeters(
        coordinates.lat,
        coordinates.lng,
        targetLat,
        targetLng
      );

      // Add a 20% indirect pathway factor for campus walkways
      const effectiveDistance = distanceMeters * 1.2;
      const walkTimeMinutes = Math.max(1, Math.round(effectiveDistance / 75));

      return {
        distanceMeters: Math.round(distanceMeters),
        walkTimeMinutes,
      };
    },
    [coordinates]
  );

  return {
    coordinates,
    loading,
    error,
    requestLocation,
    estimateWalkTimeMinutes,
  };
};
