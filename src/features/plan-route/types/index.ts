import type { PlaceSuggestion, SustainabilityEstimate, PoiCategory, NearbyPlace } from '../../../services/maps/googleMaps';
import type { NearbyReport } from '../../../services/reports';
import type { GpsBreadcrumb } from '../../../services/trips';

export type TransportMode = 'driving' | 'walking';

export interface PlacePoint {
  latitude: number;
  longitude: number;
  name: string;
}

export interface RouteFitPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
