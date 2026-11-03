import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');

/**
 * Helper para analizar el Árbol de Sintaxis Abstracta (AST) de componentes TSX
 * y extraer elementos JSX con sus propiedades de accesibilidad reales.
 */
function parseJsxElements(relativeFilePath) {
  const fullPath = path.join(projectRoot, relativeFilePath);
  const sourceCode = fs.readFileSync(fullPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    path.basename(relativeFilePath),
    sourceCode,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const elements = [];

  function visit(node) {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tagNode = ts.isJsxElement(node) ? node.openingElement : node;
      const tagName = tagNode.tagName.getText(sourceFile);
      const attributes = {};

      for (const prop of tagNode.attributes.properties) {
        if (ts.isJsxAttribute(prop)) {
          const propName = prop.name.getText(sourceFile);
          const propValue = prop.initializer ? prop.initializer.getText(sourceFile) : 'true';
          attributes[propName] = propValue;
        }
      }

      elements.push({
        tagName,
        attributes,
        line: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return elements;
}

test('H-10 AST Login: Todos los botones interactivos declaran accessibilityRole="button" y label', () => {
  const elements = parseJsxElements('app/(auth)/login.tsx');
  const touchables = elements.filter(el => el.tagName === 'TouchableOpacity');

  assert.ok(touchables.length >= 6, `Esperados al menos 6 botones interactivos, encontrados ${touchables.length}`);

  for (const btn of touchables) {
    assert.equal(
      btn.attributes.accessibilityRole,
      '"button"',
      `TouchableOpacity en línea ${btn.line} no tiene accessibilityRole="button"`
    );
    assert.ok(
      btn.attributes.accessibilityLabel,
      `TouchableOpacity en línea ${btn.line} carece de accessibilityLabel`
    );
  }

  // Verificar botón de submit de login con accessibilityState (busy, disabled)
  const submitBtn = touchables.find(btn => btn.attributes.accessibilityState);
  assert.ok(submitBtn, 'El botón de inicio de sesión debe declarar accessibilityState');
  assert.ok(submitBtn.attributes.accessibilityState.includes('busy'), 'accessibilityState debe incluir indicador de carga busy');

  // Verificar campos de texto con rol text
  const textInputs = elements.filter(el => el.tagName === 'TextInput');
  assert.equal(textInputs.length, 2, 'Deben existir 2 campos de entrada (email y contraseña)');
  for (const input of textInputs) {
    assert.equal(input.attributes.accessibilityRole, '"text"');
    assert.ok(input.attributes.accessibilityLabel);
  }

  // Verificar alerta de error en vivo
  const alerts = elements.filter(el => el.attributes.accessibilityRole === '"alert"');
  assert.ok(alerts.length >= 1, 'Debe existir contenedor de alerta para mensajes de error de autenticación');
  assert.equal(alerts[0].attributes.accessibilityLiveRegion, '"assertive"');
});

test('H-10 AST Verify-Code: Entradas numéricas, estados de carga y roles semánticos', () => {
  const elements = parseJsxElements('app/(auth)/verify-code.tsx');

  // Verificar inputs de código numérico de 6 dígitos
  const textInputs = elements.filter(el => el.tagName === 'TextInput');
  assert.ok(textInputs.length >= 1, 'Deben existir inputs de entrada de dígitos');
  for (const input of textInputs) {
    assert.equal(input.attributes.accessibilityRole, '"text"');
    assert.ok(input.attributes.accessibilityLabel.includes('Dígito'));
  }

  // Verificar contenedor de código accesible
  const codeContainer = elements.find(el => el.attributes.accessibilityLabel && el.attributes.accessibilityLabel.includes('Código de 6 dígitos'));
  assert.ok(codeContainer, 'El contenedor del código debe declarar accessible y accessibilityLabel');
  assert.equal(codeContainer.attributes.accessible, '{true}');

  // Encabezado accesible
  const headers = elements.filter(el => el.attributes.accessibilityRole === '"header"');
  assert.ok(headers.length >= 1, 'Debe existir un encabezado semántico accessibilityRole="header"');

  // Botones de acción
  const touchables = elements.filter(el => el.tagName === 'TouchableOpacity');
  for (const btn of touchables) {
    assert.equal(btn.attributes.accessibilityRole, '"button"');
    assert.ok(btn.attributes.accessibilityLabel);
  }
});

test('H-10 AST Index / Dashboard: Módulos, métricas y acciones con roles y labels accesibles', () => {
  const elements = parseJsxElements('app/(tabs)/index.tsx');

  // Tarjetas estadísticas con accessible={true} y labels calculados
  const statContainers = elements.filter(
    el => el.attributes.accessible === '{true}' && el.attributes.accessibilityLabel
  );
  assert.ok(statContainers.length >= 3, `Se esperan al menos 3 tarjetas estadísticas accesibles, encontradas ${statContainers.length}`);

  // Botones de módulos con hint de navegación y roles button
  const touchables = elements.filter(el => el.tagName === 'TouchableOpacity');
  const moduleCards = touchables.filter(el => el.attributes.accessibilityHint && el.attributes.accessibilityHint.includes('Navegar'));
  assert.ok(moduleCards.length >= 2, 'Los módulos de navegación deben incluir accessibilityHint');

  // Encabezados
  const headers = elements.filter(el => el.attributes.accessibilityRole === '"header"');
  assert.ok(headers.length >= 2, 'Debe contener encabezados accesibles para saludo y herramientas');
});

test('H-10 AST Profile: Tablist, tabs con selected state, inputs de perfil y controles accesibles', () => {
  const elements = parseJsxElements('app/(tabs)/profile.tsx');

  // Tablist semántico
  const tablist = elements.find(el => el.attributes.accessibilityRole === '"tablist"');
  assert.ok(tablist, 'Debe existir contenedor con accessibilityRole="tablist"');

  // Pestañas segmentadas con rol tab y estado selected
  const tabs = elements.filter(el => el.attributes.accessibilityRole === '"tab"');
  assert.ok(tabs.length >= 1, 'Deben existir pestañas con accessibilityRole="tab"');
  for (const tab of tabs) {
    assert.ok(tab.attributes.accessibilityState.includes('selected'));
  }

  // Todos los TouchableOpacity interactivos con accessibilityRole="button" o "tab"
  const touchables = elements.filter(el => el.tagName === 'TouchableOpacity');
  for (const btn of touchables) {
    const role = btn.attributes.accessibilityRole;
    assert.ok(
      role === '"button"' || role === '"tab"',
      `TouchableOpacity en línea ${btn.line} carece de role accesible válido (obtenido: ${role})`
    );
    assert.ok(
      btn.attributes.accessibilityLabel,
      `TouchableOpacity en línea ${btn.line} carece de accessibilityLabel descriptivo`
    );
  }

  // Inputs con rol text y etiqueta descriptiva
  const textInputs = elements.filter(el => el.tagName === 'TextInput');
  assert.ok(textInputs.length >= 5, `Esperados al menos 5 campos de formulario, encontrados ${textInputs.length}`);
  for (const input of textInputs) {
    assert.equal(input.attributes.accessibilityRole, '"text"');
    assert.ok(input.attributes.accessibilityLabel);
  }
});
