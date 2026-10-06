// Resuelto por Metro solo en plataforma web.
// react-native-maps no soporta react-native-web, asi que aqui se embebe
// Google Maps via iframe (output=embed no requiere API key) y los demas
// componentes son stubs que no hacen nada (marcadores/polilineas en web).
import React, { forwardRef } from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

type MapEngineProps = ViewProps & {
  style?: any;
  children?: React.ReactNode;
  initialRegion?: any;
  region?: any;
  provider?: any;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  rotateEnabled?: boolean;
  pitchEnabled?: boolean;
  onRegionChangeComplete?: (region: any) => void;
  onMapReady?: () => void;
  onMapLoaded?: () => void;
};

const DEFAULT_REGION = { latitude: 2.9273, longitude: -75.2819, latitudeDelta: 0.05 };

function zoomFromDelta(delta?: number): number {
  const d = delta && delta > 0 ? delta : 0.05;
  return Math.max(3, Math.min(19, Math.round(Math.log2(360 / d))));
}

const MapView = forwardRef<View, MapEngineProps>((props, ref) => {
  const r = props.region || props.initialRegion || DEFAULT_REGION;
  const zoom = zoomFromDelta(r.latitudeDelta);
  const src = `https://maps.google.com/maps?q=${r.latitude},${r.longitude}&z=${zoom}&hl=es&output=embed`;

  React.useEffect(() => {
    props.onMapReady?.();
    props.onMapLoaded?.();
  }, []);

  return (
    <View ref={ref} style={[styles.map, props.style]}>
      <iframe
        title="EcoRuteando Map"
        src={src}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
      {props.children}
    </View>
  );
});
MapView.displayName = 'MapView';

const Marker = (_props: any) => null;
const Polyline = (_props: any) => null;
const UrlTile = (_props: any) => null;
const Callout = (_props: any) => null;
const PROVIDER_GOOGLE = 'google';

export { Marker, Polyline, UrlTile, Callout, PROVIDER_GOOGLE };
export default MapView;

const styles = StyleSheet.create({
  map: {
    flex: 1,
    overflow: 'hidden',
  },
});
