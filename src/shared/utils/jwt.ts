// Decodifica el payload de un JWT (base64url) sin dependencias.
// React Native no trae `atob` garantizado, así que lo hacemos a mano.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function b64Value(ch: string | undefined): number {
  if (ch === undefined) return -1; // fin de cadena
  if (ch === '=') return -1;       // padding (o padding ausente)
  return B64.indexOf(ch);
}

export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;

    // base64url -> base64 (los tokens de Google vienen SIN padding)
    const s = part.replace(/-/g, '+').replace(/_/g, '/');
    let out = '';
    for (let i = 0; i < s.length; i += 4) {
      const c1 = b64Value(s[i]);
      const c2 = b64Value(s[i + 1]);
      const c3 = b64Value(s[i + 2]);
      const c4 = b64Value(s[i + 3]);
      if (c1 < 0 || c2 < 0) break;

      out += String.fromCharCode((c1 << 2) | (c2 >> 4));
      if (c3 >= 0) out += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
      if (c4 >= 0) out += String.fromCharCode(((c3 & 3) << 6) | c4);
    }

    // UTF-8 -> string (nombres con acentos)
    const utf8 = out
      .split('')
      .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('');
    return JSON.parse(decodeURIComponent(utf8));
  } catch {
    return null;
  }
}
