#!/usr/bin/env bash
# Script unico para la demo: detecta la IP de la red, actualiza la config
# y arranca Expo con el QR correcto. No requiere configuracion manual.
set -e
cd "$(dirname "$0")/.."

IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src"){print $(i+1); exit}}')
if [ -z "$IP" ]; then
  IP=$(hostname -I 2>/dev/null | awk '{print $1}')
fi

echo ""
echo "  IP detectada: $IP"
echo "  Backend:      http://$IP:5124"
echo "  Web:          http://$IP:3007"
echo ""

# URL del backend para la app movil (bundle time)
sed -i "s|^EXPO_PUBLIC_API_URL=.*|EXPO_PUBLIC_API_URL=http://$IP:5124|" .env

# Host del packager para que el QR siempre apunte a la IP correcta
echo "REACT_NATIVE_PACKAGER_HOSTNAME=$IP" > .env.local

exec npx expo start --clear
