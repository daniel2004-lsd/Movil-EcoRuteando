import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GpsBreadcrumb } from '../../../services/trips';

const BREADCRUMBS_KEY_PREFIX = '@trip_breadcrumbs_';

export const tripTelemetryService = {
  getStorageKey(tripId: string): string {
    return `${BREADCRUMBS_KEY_PREFIX}${tripId}`;
  },

  async saveOfflineBreadcrumbs(tripId: string, breadcrumbs: GpsBreadcrumb[]): Promise<void> {
    if (!tripId) return;
    try {
      await AsyncStorage.setItem(this.getStorageKey(tripId), JSON.stringify(breadcrumbs));
    } catch (error) {
      console.warn('[Telemetry] Error saving breadcrumbs to AsyncStorage:', error);
    }
  },

  async removeOfflineBreadcrumbs(tripId: string): Promise<void> {
    if (!tripId) return;
    try {
      await AsyncStorage.removeItem(this.getStorageKey(tripId));
    } catch (error) {
      console.warn('[Telemetry] Error removing breadcrumbs from AsyncStorage:', error);
    }
  },

  async getOfflineBreadcrumbs(tripId: string): Promise<GpsBreadcrumb[]> {
    if (!tripId) return [];
    try {
      const raw = await AsyncStorage.getItem(this.getStorageKey(tripId));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[Telemetry] Error loading breadcrumbs from AsyncStorage:', error);
      return [];
    }
  },
};
