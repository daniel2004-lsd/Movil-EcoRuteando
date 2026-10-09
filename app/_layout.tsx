// app/_layout.tsx
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from '../src/shared/store/ThemeContext';
import { LanguageProvider } from '../src/shared/store/LanguageContext';
import { AuthProvider } from '../src/shared/store/AuthContext';
import { DialogProvider } from '../src/shared/components/ui/AppDialog';
import { setupPushNotifications } from '../src/shared/services/pushNotificationService';
import { ClimateWatcher } from '../src/shared/components/ClimateWatcher';

export default function RootLayout() {
  useEffect(() => {
    setupPushNotifications((notification: any) => {
      const data = notification.request.content.data;
      if (data?.actionUrl) {
        // Navegación a la URL de la notificación
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            {/* Diálogos/alertas con el estilo de la app (reemplazan a Alert.alert) */}
            <DialogProvider>
              {/* Alertas climáticas: vigila la ubicación y avisa al entrar a una zona */}
              <ClimateWatcher />
              <Stack screenOptions={{ headerShown: false }} />
            </DialogProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
