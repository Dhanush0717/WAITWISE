import { Injectable, signal } from '@angular/core';

export interface ShouldIGoResult {
  status: 'URGENT_GO' | 'PREPARE' | 'RELAX';
  badge: string;
  headline: string;
  subtext: string;
  walkMinutes: number;
  distanceMeters: number;
  estimatedWaitMinutes: number;
  safetyBufferMinutes: number;
  differenceMinutes: number;
  colorScheme: 'red' | 'amber' | 'emerald' | 'blue';
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  userLocation = signal<{ lat: number; lng: number } | null>(null);
  locationError = signal<string | null>(null);
  hasLocationPermission = signal<boolean>(false);

  constructor() {
    this.requestCurrentPosition();
  }

  requestCurrentPosition() {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLocation.set({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          });
          this.hasLocationPermission.set(true);
          this.locationError.set(null);
        },
        (err) => {
          this.locationError.set(err.message);
          this.hasLocationPermission.set(false);
          // Default fallback coordinates (e.g. facility campus grounds)
          this.userLocation.set({ lat: 28.6139, lng: 77.2090 });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      this.locationError.set('Geolocation is not supported by your browser');
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  // Estimate walking duration assuming 80 meters/minute (4.8 km/h)
  estimateWalkMinutes(distanceMeters: number): number {
    const WALK_METERS_PER_MINUTE = 80;
    return Math.max(1, Math.ceil(distanceMeters / WALK_METERS_PER_MINUTE));
  }

  // Universal "Should I Go Now?" recommendation engine
  calculateShouldIGo(
    destinationCoords: { lat: number; lng: number } | undefined,
    peopleAhead: number,
    avgDurationPerPerson: number = 8,
    customWalkMinutes?: number,
    safetyBufferMinutes: number = 4
  ): ShouldIGoResult {
    let distanceMeters = 250;
    let walkMinutes = customWalkMinutes || 5;

    if (!customWalkMinutes && destinationCoords && this.userLocation()) {
      distanceMeters = this.calculateDistanceMeters(
        this.userLocation()!.lat,
        this.userLocation()!.lng,
        destinationCoords.lat,
        destinationCoords.lng
      );
      walkMinutes = this.estimateWalkMinutes(distanceMeters);
    } else if (customWalkMinutes) {
      distanceMeters = customWalkMinutes * 80;
      walkMinutes = customWalkMinutes;
    }

    const estimatedWaitMinutes = Math.max(0, peopleAhead * avgDurationPerPerson);
    const requiredDepartureTime = estimatedWaitMinutes - (walkMinutes + safetyBufferMinutes);

    if (requiredDepartureTime <= 0 || peopleAhead <= 1) {
      return {
        status: 'URGENT_GO',
        badge: 'GO NOW!',
        headline: 'Head to the counter immediately',
        subtext: 'Your turn is imminent! Leave right now to arrive comfortably before your token is called.',
        walkMinutes,
        distanceMeters,
        estimatedWaitMinutes,
        safetyBufferMinutes,
        differenceMinutes: requiredDepartureTime,
        colorScheme: 'emerald'
      };
    } else if (requiredDepartureTime <= 8) {
      return {
        status: 'PREPARE',
        badge: 'PREPARE TO MOVE',
        headline: 'Wrap up and get ready to walk',
        subtext: `You have roughly ${Math.round(requiredDepartureTime)} minutes before you must begin walking. Start packing up.`,
        walkMinutes,
        distanceMeters,
        estimatedWaitMinutes,
        safetyBufferMinutes,
        differenceMinutes: requiredDepartureTime,
        colorScheme: 'amber'
      };
    } else {
      return {
        status: 'RELAX',
        badge: 'RELAX',
        headline: 'You have plenty of time',
        subtext: `Feel free to sit down, grab refreshments, or work. We will notify you ~${walkMinutes + safetyBufferMinutes} mins before your turn.`,
        walkMinutes,
        distanceMeters,
        estimatedWaitMinutes,
        safetyBufferMinutes,
        differenceMinutes: requiredDepartureTime,
        colorScheme: 'blue'
      };
    }
  }
}
