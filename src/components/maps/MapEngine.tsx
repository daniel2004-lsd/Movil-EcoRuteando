// Resuelto por Metro como plataforma nativa (Android/iOS).
//
// - Dev build / standalone: usa react-native-maps real (Google Maps con la
//   API key del proyecto).
// - Expo Go: las teselas de Google nunca cargan porque Expo Go trae una API
//   key propia expirada e ignora la del proyecto (bug de Expo #49323), asi
//   que se muestra Google Maps embebido via WebView (mismo enfoque que la web).
import React, { useState, useEffect, forwardRef } from 'react';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { View, StyleSheet, AppState } from 'react-native';
import * as Location from 'expo-location';
import RealMapView, {
  Marker as RealMarker,
  Polyline as RealPolyline,
  UrlTile as RealUrlTile,
  Callout as RealCallout,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

const DEFAULT_REGION = { latitude: 2.9273, longitude: -75.2819, latitudeDelta: 0.05, longitudeDelta: 0.05 };

function zoomFromDelta(delta?: number): number {
  const d = delta && delta > 0 ? delta : 0.05;
  return Math.max(3, Math.min(19, Math.round(Math.log2(360 / d))));
}

function googleMapsSrc(region?: any): string {
  const r = region || DEFAULT_REGION;
  const zoom = zoomFromDelta(r.latitudeDelta);
  return `https://maps.google.com/maps?q=${r.latitude},${r.longitude}&z=${zoom}&hl=es&output=embed`;
}

type MapEngineProps = any;

const MapView = forwardRef((props: MapEngineProps, ref: any) => {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkPerm = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isMounted) {
          setHasLocationPermission(status === 'granted');
        }
      } catch {
        if (isMounted) setHasLocationPermission(false);
      }
    };

    checkPerm();

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkPerm();
      }
    });

    if (isExpoGo) {
      props.onMapReady?.();
      props.onMapLoaded?.();
    }

    return () => {
      isMounted = false;
      sub.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isExpoGo) {
    const src = googleMapsSrc(props.region || props.initialRegion);
    console.log('[MAPA] >>> RAMA WEBVIEW (Expo Go) uri =', src);
    return (
      <View style={[styles.container, props.style]}>
        <WebView
          key={src}
          source={{ uri: src }}
          style={styles.webview}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onLoad={() => console.log('[MAPA] >>> WebView onLoad - GOOGLE MAPS CARGADO')}
          onError={(e: any) => console.log('[MAPA] >>> WebView ERROR:', e?.nativeEvent?.description)}
          onMessage={(e: any) => console.log('[MAPA] >>> PAGINA REAL:', e.nativeEvent.data)}
          injectedJavaScript={`
            setTimeout(function () {
              try {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  href: location.href,
                  title: document.title,
                  text: (document.body && document.body.innerText || '').slice(0, 300)
                }));
              } catch (err) {
                window.ReactNativeWebView.postMessage('ERR ' + err.message);
              }
            }, 1200);
            true;
          `}
        />
        {props.children}
      </View>
    );
  }

  // En Android nativo:
  // 1. googleRenderer LEGACY garantiza compatibilidad con controladores Mali/OpenGL en dispositivos HONOR y previene pantallas negras de Vulkan (LATEST renderer).
  // 2. Si no hay permiso de ubicación concedido, showsUserLocation debe ser false para permitir que el mapa base cargue sin errores de permisos.
  const safeProps = {
    googleRenderer: 'LEGACY',
    ...props,
    initialRegion: props.initialRegion || props.region || DEFAULT_REGION,
    showsUserLocation: Boolean(props.showsUserLocation && hasLocationPermission),
  };

  return <RealMapView ref={ref} {...safeProps} />;
});
MapView.displayName = 'MapView';

const Marker: any = isExpoGo ? (_p: any) => null : RealMarker;
const Polyline: any = isExpoGo ? (_p: any) => null : RealPolyline;
const UrlTile: any = RealUrlTile;
const Callout: any = isExpoGo ? (_p: any) => null : RealCallout;

export { Marker, Polyline, UrlTile, Callout, PROVIDER_GOOGLE };
export default MapView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
