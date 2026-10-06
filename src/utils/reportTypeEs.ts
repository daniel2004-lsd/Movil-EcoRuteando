/**
 * HU-22 / CU22: etiquetas en español para los tipos de reporte.
 * Los reportes legados guardan claves/slugs en inglés (seeds) y el
 * formulario nuevo guarda la etiqueta en español tal cual.
 */
const REPORT_TYPE_ES: Record<string, string> = {
  traffic_light: 'Semáforo dañado',
  signage: 'Señalización',
  obstruction: 'Obstrucción en la vía',
  pothole: 'Hueco',
  sewer: 'Alcantarilla destapada',
  hole: 'Hueco',
  blocked: 'Vía bloqueada',
  flood: 'Inundación',
  works: 'Obras en la vía',
  traffic: 'Tráfico',
  lighting: 'Falta de iluminación',
  other: 'Otro obstáculo',
};

/** Traduce el tipo de reporte a español; si no hay traducción, lo devuelve tal cual. */
export function reportTypeEs(reportType: string): string {
  if (!reportType) return 'Obstáculo';
  return REPORT_TYPE_ES[reportType.trim()] ?? reportType;
}
