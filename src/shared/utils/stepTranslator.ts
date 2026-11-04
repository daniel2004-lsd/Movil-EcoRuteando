/**
 * Normaliza y traduce instrucciones de maniobras de navegación de inglés a español.
 * Garantiza que ante respuestas cacheadas, caídas a OSRM o variaciones de API,
 * los textos de turn-by-turn se muestren y pronuncien siempre en español.
 */
export function translateStepInstruction(instruction: string): string {
  if (!instruction) return '';
  let text = instruction.trim();

  const cardinalMap: Record<string, string> = {
    north: 'norte',
    south: 'sur',
    east: 'este',
    west: 'oeste',
    northeast: 'noreste',
    northwest: 'noroeste',
    southeast: 'sureste',
    southwest: 'suroeste',
  };

  // 1. "Head [cardinal] toward [street]"
  text = text.replace(/^Head\s+(north|south|east|west|northeast|northwest|southeast|southwest)\s+toward\s+(.+)$/i, (_, dir, target) => {
    return `Dirígete al ${cardinalMap[dir.toLowerCase()] || dir} hacia ${target}`;
  });

  // 2. "Head [cardinal] on [street]"
  text = text.replace(/^Head\s+(north|south|east|west|northeast|northwest|southeast|southwest)\s+on\s+(.+)$/i, (_, dir, target) => {
    return `Dirígete al ${cardinalMap[dir.toLowerCase()] || dir} por ${target}`;
  });

  // 3. "Head [cardinal]"
  text = text.replace(/^Head\s+(north|south|east|west|northeast|northwest|southeast|southwest)$/i, (_, dir) => {
    return `Dirígete al ${cardinalMap[dir.toLowerCase()] || dir}`;
  });

  // 4. "Turn left/right/slight/sharp onto [street]"
  text = text.replace(/^Turn\s+sharp\s+left\s+onto\s+(.+)$/i, 'Gira pronunciado a la izquierda por $1');
  text = text.replace(/^Turn\s+sharp\s+right\s+onto\s+(.+)$/i, 'Gira pronunciado a la derecha por $1');
  text = text.replace(/^Turn\s+slight\s+left\s+onto\s+(.+)$/i, 'Gira levemente a la izquierda por $1');
  text = text.replace(/^Turn\s+slight\s+right\s+onto\s+(.+)$/i, 'Gira levemente a la derecha por $1');
  text = text.replace(/^Turn\s+left\s+onto\s+(.+)$/i, 'Gira a la izquierda por $1');
  text = text.replace(/^Turn\s+right\s+onto\s+(.+)$/i, 'Gira a la derecha por $1');

  // 5. "Turn sharp/slight/left/right"
  text = text.replace(/^Turn\s+sharp\s+left$/i, 'Gira pronunciado a la izquierda');
  text = text.replace(/^Turn\s+sharp\s+right$/i, 'Gira pronunciado a la derecha');
  text = text.replace(/^Turn\s+slight\s+left$/i, 'Gira levemente a la izquierda');
  text = text.replace(/^Turn\s+slight\s+right$/i, 'Gira levemente a la derecha');
  text = text.replace(/^Turn\s+left$/i, 'Gira a la izquierda');
  text = text.replace(/^Turn\s+right$/i, 'Gira a la derecha');

  // 6. "Keep left/right"
  text = text.replace(/^Keep\s+left\s+onto\s+(.+)$/i, 'Mantente a la izquierda por $1');
  text = text.replace(/^Keep\s+right\s+onto\s+(.+)$/i, 'Mantente a la derecha por $1');
  text = text.replace(/^Keep\s+left$/i, 'Mantente a la izquierda');
  text = text.replace(/^Keep\s+right$/i, 'Mantente a la derecha');

  // 7. "Continue onto / Continue straight"
  text = text.replace(/^Continue\s+onto\s+(.+)$/i, 'Continúa por $1');
  text = text.replace(/^Continue\s+straight\s+onto\s+(.+)$/i, 'Continúa recto por $1');
  text = text.replace(/^Continue\s+straight$/i, 'Continúa recto');
  text = text.replace(/^Continue$/i, 'Continúa');

  // 8. "Merge onto"
  text = text.replace(/^Merge\s+onto\s+(.+)$/i, 'Incorpórate a $1');

  // 9. "Take the exit"
  text = text.replace(/^Take\s+the\s+exit\s+toward\s+(.+)$/i, 'Toma la salida hacia $1');
  text = text.replace(/^Take\s+the\s+exit$/i, 'Toma la salida');

  // 10. Roundabouts
  text = text.replace(/^At\s+the\s+roundabout,\s+take\s+the\s+(\d+)(?:st|nd|rd|th)?\s+exit\s+onto\s+(.+)$/i, 'En la rotonda, toma la salida $1 hacia $2');
  text = text.replace(/^At\s+the\s+roundabout,\s+take\s+the\s+(\d+)(?:st|nd|rd|th)?\s+exit$/i, 'En la rotonda, toma la salida $1');

  // 11. U-turn & Destination
  text = text.replace(/^Make\s+a\s+U-turn$/i, 'Da vuelta en U');
  text = text.replace(/^Destination\s+will\s+be\s+on\s+the\s+left$/i, 'El destino está a la izquierda');
  text = text.replace(/^Destination\s+will\s+be\s+on\s+the\s+right$/i, 'El destino está a la derecha');

  return text;
}
