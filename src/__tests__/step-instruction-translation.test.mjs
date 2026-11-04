import test from 'node:test';
import assert from 'node:assert/strict';

// Import pure translation logic to verify step instructions
function translateStepInstruction(instruction) {
  if (!instruction) return '';
  let text = instruction.trim();

  const cardinalMap = {
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

test('SUITE: translateStepInstruction', async (t) => {
  await t.test('translates screenshot case: Head south toward Cl. 68', () => {
    const result = translateStepInstruction('Head south toward Cl. 68');
    assert.equal(result, 'Dirígete al sur hacia Cl. 68');
  });

  await t.test('translates various cardinal directions toward destination', () => {
    assert.equal(translateStepInstruction('Head north toward Av. Circunvalar'), 'Dirígete al norte hacia Av. Circunvalar');
    assert.equal(translateStepInstruction('Head east toward Cra. 5'), 'Dirígete al este hacia Cra. 5');
    assert.equal(translateStepInstruction('Head west toward Cl. 21'), 'Dirígete al oeste hacia Cl. 21');
    assert.equal(translateStepInstruction('Head northeast toward Autopista Sur'), 'Dirígete al noreste hacia Autopista Sur');
    assert.equal(translateStepInstruction('Head southwest toward Cl. 8'), 'Dirígete al suroeste hacia Cl. 8');
  });

  await t.test('translates turns onto streets', () => {
    assert.equal(translateStepInstruction('Turn left onto Cra. 7'), 'Gira a la izquierda por Cra. 7');
    assert.equal(translateStepInstruction('Turn right onto Cl. 26'), 'Gira a la derecha por Cl. 26');
    assert.equal(translateStepInstruction('Turn slight left onto Av. Primera'), 'Gira levemente a la izquierda por Av. Primera');
    assert.equal(translateStepInstruction('Turn sharp right onto Callejon 3'), 'Gira pronunciado a la derecha por Callejon 3');
  });

  await t.test('translates continuation and merge maneuvers', () => {
    assert.equal(translateStepInstruction('Continue onto Cra. 15'), 'Continúa por Cra. 15');
    assert.equal(translateStepInstruction('Continue straight'), 'Continúa recto');
    assert.equal(translateStepInstruction('Merge onto Autopista Norte'), 'Incorpórate a Autopista Norte');
    assert.equal(translateStepInstruction('Take the exit toward Centro'), 'Toma la salida hacia Centro');
    assert.equal(translateStepInstruction('Destination will be on the right'), 'El destino está a la derecha');
  });

  await t.test('leaves already-Spanish instructions unchanged', () => {
    const spanish = 'Gira a la derecha en Cra. 5';
    assert.equal(translateStepInstruction(spanish), spanish);
  });

  await t.test('preserves street names, numbers and references without corrupting them', () => {
    // Exact screenshot case:
    assert.equal(translateStepInstruction('Head south toward Cl. 68'), 'Dirígete al sur hacia Cl. 68');
    // Street names containing cardinal words inside the name:
    assert.equal(translateStepInstruction('Head south toward South Avenue'), 'Dirígete al sur hacia South Avenue');
    assert.equal(translateStepInstruction('Turn right onto West Park Street'), 'Gira a la derecha por West Park Street');
    // Typical Colombian alphanumeric nomenclatures:
    assert.equal(translateStepInstruction('Turn left onto Cra. 7 # 12-34'), 'Gira a la izquierda por Cra. 7 # 12-34');
    assert.equal(translateStepInstruction('Continue onto Diagonal 45 Sur'), 'Continúa por Diagonal 45 Sur');
    assert.equal(translateStepInstruction('Head north toward Transversal 1A'), 'Dirígete al norte hacia Transversal 1A');
  });
});
