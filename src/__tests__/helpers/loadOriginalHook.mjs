import babel from '@babel/core';
import React from 'react';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

/**
 * Loads and transpiles an original TypeScript hook from src/features/plan-route/hooks/
 * in memory, linking React and providing minimal mocked boundaries for native subsystems.
 */
export function loadTsModule(targetPath, customMocks = {}) {
  const filePath = path.isAbsolute(targetPath) ? targetPath : path.resolve(targetPath);

  const transpiled = babel.transformFileSync(filePath, {
    presets: ['babel-preset-expo'],
    plugins: ['@babel/plugin-transform-modules-commonjs'],
  });

  const defaultMockReactNative = {
    Platform: { OS: 'android', select: (obj) => obj.android || obj.default },
    ToastAndroid: { show: () => {}, SHORT: 0, LONG: 1 },
    Share: { share: async () => ({ action: 'sharedAction' }) },
  };

  const defaultMockDialog = {
    Dialog: {
      alert: () => {},
      confirm: async () => true,
    },
  };

  const defaultMockGeo = {
    haversineM: (p1, p2) => {
      const R = 6371000;
      const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
      const dLng = ((p2.longitude - p1.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.latitude * Math.PI) / 180) *
          Math.cos((p2.latitude * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    },
    formatMeters: (m) => `${m} m`,
  };

  const customRequire = (moduleName) => {
    // 1. Runtime helpers
    if (moduleName.startsWith('@babel/runtime')) {
      return require(moduleName);
    }
    // 2. React
    if (moduleName === 'react') {
      return React;
    }
    // 3. Native React Native & Expo modules
    if (moduleName === 'react-native') {
      return { ...defaultMockReactNative, ...(customMocks['react-native'] || {}) };
    }
    if (moduleName.includes('async-storage')) {
      const storage = customMocks['async-storage-map'] || globalThis.__mockAsyncStorage || (globalThis.__mockAsyncStorage = new Map());
      const mockObj = {
        getItem: async (k) => (storage.has(k) ? storage.get(k) : null),
        setItem: async (k, v) => storage.set(k, String(v)),
        removeItem: async (k) => storage.delete(k),
        clear: async () => storage.clear(),
      };
      return {
        __esModule: true,
        default: mockObj,
        ...mockObj,
        ...(customMocks['@react-native-async-storage/async-storage'] || {}),
      };
    }
    if (moduleName === 'expo-speech') {
      return { stop: async () => {}, speak: () => {}, ...(customMocks['expo-speech'] || {}) };
    }
    if (moduleName === 'expo-location') {
      return {
        hasServicesEnabledAsync: async () => true,
        getForegroundPermissionsAsync: async () => ({ status: 'granted' }),
        requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
        getCurrentPositionAsync: async () => ({ coords: { latitude: 2.9273, longitude: -75.2819 } }),
        getLastKnownPositionAsync: async () => null,
        watchPositionAsync: async () => ({ remove: () => {} }),
        Accuracy: { Balanced: 3, High: 4 },
        ...(customMocks['expo-location'] || {}),
      };
    }
    // 4. Project utils and components
    if (moduleName.includes('geo')) {
      return { ...defaultMockGeo, ...(customMocks.geo || {}) };
    }
    if (moduleName.includes('AppDialog')) {
      return { ...defaultMockDialog, ...(customMocks.AppDialog || {}) };
    }
    if (moduleName.includes('tripPayloadBuilder')) {
      return {
        buildSavePayload: () => ({ name: 'Test Route' }),
        apiErrorMessage: (e) => e?.message || 'Error',
        ...(customMocks.tripPayloadBuilder || {}),
      };
    }
    if (moduleName === 'expo-task-manager') {
      return {
        defineTask: () => {},
        isTaskDefined: () => false,
        isTaskRegisteredAsync: async () => false,
        ...(customMocks['expo-task-manager'] || {}),
      };
    }
    if (moduleName.includes('tripLocationTask')) {
      return {
        tripLocationTask: {
          startTracking: async () => true,
          stopTracking: async () => {},
          isTrackingActive: async () => false,
          subscribe: () => () => {},
          resetTrackingMetrics: () => {},
          getAccumulatedDistanceM: () => 0,
        },
        ...(customMocks.tripLocationTask || {}),
      };
    }
    if (moduleName.includes('tripTelemetryService')) {
      return {
        tripTelemetryService: {
          saveOfflineBreadcrumbs: () => {},
          getOfflineBreadcrumbs: async () => [],
          clearOfflineBreadcrumbs: async () => {},
        },
        ...(customMocks.tripTelemetryService || {}),
      };
    }
    if (moduleName.includes('googleMaps')) {
      return {
        searchPlaces: async () => [],
        getPlaceDetails: async () => null,
        getDirections: async () => null,
        getSustainabilityEstimate: async () => null,
        decodePolyline: () => [],
        encodePolyline: () => '',
        getNearbyPlaces: async () => [],
        ...(customMocks.googleMaps || {}),
      };
    }
    if (moduleName.includes('trips')) {
      return {
        saveRoute: async () => 'route-id-1',
        startTrip: async () => ({ tripId: 'trip-1' }),
        completeTrip: async () => ({}),
        findRouteIdByName: async () => null,
        syncOfflineTrips: async () => 0,
        ...(customMocks.trips || {}),
      };
    }
    if (moduleName.includes('reports')) {
      return {
        getNearbyReports: async () => [],
        voteReport: async () => ({ confidenceScore: 80 }),
        ...(customMocks.reports || {}),
      };
    }
    if (moduleName.includes('ExploreSheet')) {
      return {
        HUILA_POPULAR_PLACES: [],
        ...(customMocks.ExploreSheet || {}),
      };
    }
    if (moduleName.includes('apiClient')) {
      return {
        __esModule: true,
        default: { get: async () => ({ data: [] }), post: async () => ({ data: {} }) },
        ...(customMocks.apiClient || {}),
      };
    }

    return {};
  };

  const moduleObj = { exports: {} };
  const runner = new Function('require', 'module', 'exports', transpiled.code);
  runner(customRequire, moduleObj, moduleObj.exports);

  return moduleObj.exports;
}

export function loadOriginalHook(hookFileName, customMocks = {}) {
  const filePath = path.resolve('src/features/plan-route/hooks', hookFileName);
  return loadTsModule(filePath, customMocks);
}
