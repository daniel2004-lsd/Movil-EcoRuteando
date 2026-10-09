/**
 * HU-22 / CU22: etiquetas para los tipos de reporte.
 * Los reportes legados guardan claves/slugs en inglés (seeds) y el
 * formulario nuevo guarda la etiqueta ya traducida tal cual.
 *
 * Se resuelve por i18n (es/en/fr/pt): con `t` del componente si se pasa,
 * o con `tGlobal` (idioma activo a nivel de módulo) si no.
 */
import { tGlobal } from '../i18n/translations';

/** Traduce el tipo de reporte a la etiqueta localizada; si no hay clave, devuelve el valor tal cual. */
export function reportTypeEs(reportType: string, t?: (path: string) => string): string {
  if (!reportType) return (t ?? tGlobal)('reportTypes.default');
  const key = reportType.trim();
  const path = `reportTypes.${key}`;
  const tr = (t ?? tGlobal)(path);
  return tr !== path ? tr : key;
}
