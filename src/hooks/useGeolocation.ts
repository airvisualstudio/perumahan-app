import { useState, useEffect } from 'react';

export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * Calculates distance between two coordinates in meters using the Haversine formula
 */
export function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        let msg = 'Gagal mengambil lokasi.';
        if (err.code === 1) msg = 'Izin lokasi ditolak.';
        else if (err.code === 2) msg = 'Posisi lokasi tidak tersedia.';
        else if (err.code === 3) msg = 'Waktu pengambilan lokasi habis.';
        
        setError(msg);
        setLoading(false);
        
        // Default fallback (e.g. Jakarta office)
        setCoords({
          latitude: -6.2088,
          longitude: 106.8456
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  return { coords, setCoords, error, loading, refresh: fetchLocation };
}
