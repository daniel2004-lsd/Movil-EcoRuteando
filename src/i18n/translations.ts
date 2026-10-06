import es from './es';
import en from './en';
import fr from './fr';
import pt from './pt';

export const translations = {
  es,
  en,
  fr,
  pt,
};

export type LangCode = keyof typeof translations;

/** Idioma activo a nivel de módulo: permite traducir fuera de componentes
 *  (servicios, utilidades) donde no se puede usar el hook useLanguage(). */
let currentLang: LangCode = 'es';

export function setCurrentLang(code: LangCode): void {
  currentLang = code;
}

export function getCurrentLang(): LangCode {
  return currentLang;
}

function resolve(code: LangCode, path: string): string | undefined {
  let current: any = translations[code];
  for (const part of path.split('.')) {
    current = current?.[part];
    if (current == null) return undefined;
  }
  return typeof current === 'string' ? current : undefined;
}

/** Traducción sin hook: idioma activo → fallback es → la propia clave. */
export function tGlobal(path: string): string {
  return resolve(currentLang, path) ?? resolve('es', path) ?? path;
}
