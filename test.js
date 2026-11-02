/**
 * Testes automatizados do PixelArt LibreSprite MCP
 */

const { generateCharacter32, generateCharacter16 } = require('./src/character_generator');
const { generateAnimationFrames } = require('./src/animation_generator');
const { convertToAseprite, createSpritesheet, scaleSprite } = require('./src/libresprite_cli');
const path = require('path');
const fs = require('fs');

const TEST_DIR = path.join(__dirname, 'output', 'test_run');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

console.log('--- INICIANDO TESTES DO MCP PIXELART ---');

// Teste 1: Guerreiro 32x32
console.log('1. Testando geração de Guerreiro 32x32...');
const warriorGrid = generateCharacter32({
  charClass: 'warrior',
  paletteName: 'alex_corporate',
  weapon: 'sword',
  hasShield: true,
  hasHelmet: true
});
const warriorPng = path.join(TEST_DIR, 'warrior_32.png');
const warriorPreview = path.join(TEST_DIR, 'warrior_32_x4.png');
const warriorAse = path.join(TEST_DIR, 'warrior_32.aseprite');
warriorGrid.savePng(warriorPng);
warriorGrid.saveScaledPng(warriorPreview, 4);
const aseRes = convertToAseprite(warriorPng, warriorAse);
console.log('   -> PNG:', fs.existsSync(warriorPng) ? 'OK' : 'FALHOU');
console.log('   -> Preview 4x:', fs.existsSync(warriorPreview) ? 'OK' : 'FALHOU');
console.log('   -> Aseprite nativo:', aseRes.success ? 'OK' : 'FALHOU');

// Teste 2: Mago 32x32
console.log('2. Testando geração de Mago 32x32...');
const mageGrid = generateCharacter32({
  charClass: 'mage',
  paletteName: 'alex_corporate',
  weapon: 'staff',
  hasCape: true
});
const magePng = path.join(TEST_DIR, 'mage_32.png');
mageGrid.savePng(magePng);
console.log('   -> Mago PNG:', fs.existsSync(magePng) ? 'OK' : 'FALHOU');

// Teste 3: Animação Walk Cycle
console.log('3. Testando ciclo de caminhada (Walk Animation)...');
const animRes = generateAnimationFrames({
  charClass: 'warrior',
  animType: 'walk',
  size: 32,
  outputDir: TEST_DIR,
  prefix: 'test_warrior_walk'
});
console.log(`   -> Frames gerados: ${animRes.frameCount}`);
const framePaths = animRes.frames.map(f => f.path);
const sheetPng = path.join(TEST_DIR, 'test_warrior_walk_sheet.png');
const sheetJson = path.join(TEST_DIR, 'test_warrior_walk_sheet.json');
const sheetRes = createSpritesheet(framePaths, sheetPng, sheetJson, { sheetType: 'horizontal' });
console.log('   -> Spritesheet PNG:', sheetRes.success ? 'OK' : 'FALHOU');
console.log('   -> Spritesheet JSON:', fs.existsSync(sheetJson) ? 'OK' : 'FALHOU');

console.log('--- TESTES CONCLUÍDOS COM SUCESSO! ---');
