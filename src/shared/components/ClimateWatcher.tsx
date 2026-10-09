// src/shared/components/ClimateWatcher.tsx
// Vigila la ubicación del usuario (con la app abierta) y le avisa cuando entra
// a una zona con alerta climática activa. Se monta una vez en _layout.
import { useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import {
  startClimateAlertWatcher,
  stopClimateAlertWatcher,
} from '../services/climateAlerts';

export function ClimateWatcher() {
  const { auth } = useAuth();
  const active = !!auth.userId && !auth.guest;

  useEffect(() => {
    if (!active) {
      stopClimateAlertWatcher();
      return;
    }
    startClimateAlertWatcher().catch(() => {});
  }, [active]);

  return null;
}
