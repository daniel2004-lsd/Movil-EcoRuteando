// app/_layout.tsx
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider } from '../src/shared/store/ThemeContext';
import { LanguageProvider } from '../src/shared/store/LanguageContext';
import { AuthProvider } from '../src/shared/store/AuthContext';
import { setupPushNotifications } from '../src/shared/services/pushNotificationService';

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
            <Stack screenOptions={{ headerShown: false }} />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
