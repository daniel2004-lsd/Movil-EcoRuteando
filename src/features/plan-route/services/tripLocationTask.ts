import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { haversineM } from '../../../utils/geo';
import type { GpsBreadcrumb } from '../../../services/trips';
import { tripTelemetryService } from './tripTelemetryService';

export const TRIP_LOCATION_TASK_NAME = 'ECORUTEANDO_BACKGROUND_TRIP_LOCATION';
const ACTIVE_TRIP_ID_STORAGE_KEY = '@ecoruteando_active_trip_id';

export interface TripLocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: number;
  distanceDeltaM: number;
  totalDistanceM: number;
}

export type TripLocationListener = (update: TripLocationUpdate) => void;

export class TripLocationTaskManager {
  private activeTripId: string | null = null;
  private lastTrackPos: { latitude: number; longitude: number } | null = null;
  private accumulatedDistM: number = 0;
  private listeners: Set<TripLocationListener> = new Set();

  constructor() {
    this.registerBackgroundLocationTask();
  }

  private registerBackgroundLocationTask(): void {
    if (TaskManager.isTaskDefined(TRIP_LOCATION_TASK_NAME)) {
      return;
    }

    TaskManager.defineTask(TRIP_LOCATION_TASK_NAME, async ({ data, error }) => {
      if (error) {
        console.warn('[TripLocationTask] Error in background location task:', error.message);
        return;
      }
      if (!data) return;

      const { locations } = data as { locations?: Location.LocationObject[] };
      if (!locations || !Array.isArray(locations) || locations.length === 0) {
        return;
      }

      await this.processLocations(locations);
    });
  }

  public async initActiveTripId(): Promise<string | null> {
    if (this.activeTripId) return this.activeTripId;
    try {
      const stored = await AsyncStorage.getItem(ACTIVE_TRIP_ID_STORAGE_KEY);
      if (stored) {
        this.activeTripId = stored;
      }
      return this.activeTripId;
    } catch {
      return null;
    }
  }

  public setActiveTripId(tripId: string | null): void {
    this.activeTripId = tripId;
    if (tripId) {
      AsyncStorage.setItem(ACTIVE_TRIP_ID_STORAGE_KEY, tripId).catch(() => {});
    } else {
      AsyncStorage.removeItem(ACTIVE_TRIP_ID_STORAGE_KEY).catch(() => {});
      this.resetTrackingMetrics();
    }
  }

  public getActiveTripId(): string | null {
    return this.activeTripId;
  }

  public resetTrackingMetrics(): void {
    this.lastTrackPos = null;
    this.accumulatedDistM = 0;
  }

  public getAccumulatedDistanceM(): number {
    return this.accumulatedDistM;
  }

  public subscribe(listener: TripLocationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async processLocations(locations: Location.LocationObject[]): Promise<void> {
    const currentTripId = this.activeTripId || (await this.initActiveTripId());
    if (!currentTripId) return;

    let existingBreadcrumbs = await tripTelemetryService.getOfflineBreadcrumbs(currentTripId);
    let breadcrumbsAdded = false;

    for (const loc of locations) {
      if (!loc?.coords) continue;
      const { latitude, longitude } = loc.coords;
      const timestamp = loc.timestamp || Date.now();

      let deltaM = 0;
      if (this.lastTrackPos) {
        const d = haversineM({ latitude, longitude }, this.lastTrackPos);
        // Filtrar saltos aberrantes (> 500m)
        if (d > 0 && d < 500) {
          deltaM = d;
          this.accumulatedDistM += d;
        } else if (d >= 500) {
          console.warn('[TripLocationTask] Aberrant GPS jump rejected:', d, 'm');
          continue;
        }
      }
      this.lastTrackPos = { latitude, longitude };

      const crumb: GpsBreadcrumb = { lat: latitude, lng: longitude, timestamp };
      existingBreadcrumbs.push(crumb);
      breadcrumbsAdded = true;

      const update: TripLocationUpdate = {
        latitude,
        longitude,
        timestamp,
        distanceDeltaM: deltaM,
        totalDistanceM: this.accumulatedDistM,
      };

      this.listeners.forEach(fn => {
        try {
          fn(update);
        } catch (e) {
          console.warn('[TripLocationTask] Error in listener:', e);
        }
      });
    }

    if (breadcrumbsAdded) {
      await tripTelemetryService.saveOfflineBreadcrumbs(currentTripId, existingBreadcrumbs);
    }
  }

  public async isTrackingActive(): Promise<boolean> {
    try {
      return await Location.hasStartedLocationUpdatesAsync(TRIP_LOCATION_TASK_NAME);
    } catch {
      return false;
    }
  }

  public async startTracking(tripId: string): Promise<boolean> {
    this.setActiveTripId(tripId);
    this.resetTrackingMetrics();

    try {
      const isAlreadyRunning = await this.isTrackingActive();
      if (isAlreadyRunning) {
        return true;
      }

      await Location.startLocationUpdatesAsync(TRIP_LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 3000,
        distanceInterval: 10,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'EcoRuteando',
          notificationBody: 'Registrando tu ruta ecológica en segundo plano...',
          notificationColor: '#10b981',
        },
      });
      return true;
    } catch (error) {
      console.warn('[TripLocationTask] Failed to start background location service:', error);
      throw error;
    }
  }

  public async stopTracking(): Promise<void> {
    this.setActiveTripId(null);
    try {
      const isRunning = await this.isTrackingActive();
      if (isRunning) {
        await Location.stopLocationUpdatesAsync(TRIP_LOCATION_TASK_NAME);
      }
    } catch (error) {
      console.warn('[TripLocationTask] Failed to stop background location service:', error);
    }
  }
}

export const tripLocationTask = new TripLocationTaskManager();
