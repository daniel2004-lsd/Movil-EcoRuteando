// Resuelto por Metro como plataforma nativa (Android/iOS).
//
// - Dev build / standalone: usa react-native-maps real (Google Maps con la
//   API key del proyecto).
// - Expo Go: las teselas de Google nunca cargan porque Expo Go trae una API
//   key propia expirada e ignora la del proyecto (bug de Expo #49323), asi
//   que se muestra Google Maps embebido via WebView (mismo enfoque que la web).
import React from 'react';
import Constants from 'expo-constants';
import { WebView } from 'react-native-webview';
import { View, StyleSheet } from 'react-native';
import RealMapView, {
  Marker as RealMarker,
  Polyline as RealPolyline,
  UrlTile as RealUrlTile,
  Callout as RealCallout,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

const DEFAULT_REGION = { latitude: 2.9273, longitude: -75.2819, latitudeDelta: 0.05 };

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

const MapView = React.forwardRef((props: MapEngineProps, ref: any) => {
  React.useEffect(() => {
    props.onMapReady?.();
    props.onMapLoaded?.();
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

  return <RealMapView ref={ref} {...props} />;
});
MapView.displayName = 'MapView';

// En Expo Go los componentes del mapa nativo no tienen teselas que dibujar,
// asi que se sustituyen por stubs (el WebView ya muestra el mapa).
const Marker: any = isExpoGo ? (_p: any) => null : RealMarker;
const Polyline: any = isExpoGo ? (_p: any) => null : RealPolyline;
const UrlTile: any = isExpoGo ? (_p: any) => null : RealUrlTile;
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
