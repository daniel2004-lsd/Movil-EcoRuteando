// app/(auth)/guest.tsx - Modo invitado eliminado. Redirección segura a login.
import React from 'react';
import { Redirect } from 'expo-router';

export default function GuestScreen() {
  return <Redirect href="/(auth)/login" />;
}