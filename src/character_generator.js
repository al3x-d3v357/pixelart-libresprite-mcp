const { PixelGrid } = require('./png');
const { PALETTES } = require('./palettes');

/**
 * Mapeamento e montador anatômico de Personagens Pixel Art
 */

function getPaletteColors(paletteName) {
  const pal = PALETTES[paletteName] || PALETTES.alex_corporate;
  return pal.colors;
}

/**
 * Gera um personagem em PixelGrid 32x32
 */
function generateCharacter32(options = {}) {
  const {
    charClass = 'warrior',
    paletteName = 'alex_corporate',
    pose = 'idle',
    skinColor = '#fcead8',
    skinShadow = '#e5b991',
    hairColor = '#f3be7a',
    hairShadow = '#a8724b',
    primaryColor = '#3852b4',   // Alex Royal Blue
    secondaryColor = '#5e7ac4', // Slate Blue
    accentColor = '#f08d39',    // Tangerine / Gold
    weapon = 'sword',           // 'sword', 'staff', 'dagger', 'laser', 'mace', 'none'
    hasShield = (charClass === 'warrior' || charClass === 'paladin'),
    hasHelmet = (charClass === 'warrior' || charClass === 'paladin'),
    hasCape = (charClass === 'mage' || charClass === 'paladin' || charClass === 'rogue'),
    outlineColor = '#0e1224'
  } = options;

  const grid = new PixelGrid(32, 32);

  // Offset dinâmico por pose
  let bobY = 0;
  let legOffset = 0; // -1, 0, 1
  let armOffset = 0;
  let attackPose = false;

  if (pose === 'idle') {
    bobY = 0;
  } else if (pose === 'idle_breathe') {
    bobY = -1;
  } else if (pose === 'walk_1') {
    bobY = -1;
    legOffset = 1;
    armOffset = -1;
  } else if (pose === 'walk_2') {
    bobY = 0;
    legOffset = -1;
    armOffset = 1;
  } else if (pose === 'attack_windup') {
    armOffset = -2;
  } else if (pose === 'attack_strike') {
    attackPose = true;
    bobY = 1;
  } else if (pose === 'jump') {
    bobY = -3;
    legOffset = 2;
  } else if (pose === 'hurt') {
    bobY = 1;
    legOffset = 1;
  }

  // 1. Sombra no chão (y = 29, 30)
  if (pose !== 'jump') {
    grid.fillRect(10, 29, 12, 1, '#00000044');
    grid.fillRect(12, 30, 8, 1, '#00000022');
  } else {
    // Sombra menor quando está no ar
    grid.fillRect(12, 29, 8, 1, '#00000022');
  }

  // 2. Capa (se houver, desenhada por trás do tronco)
  if (hasCape) {
    const capeY = 14 + bobY;
    grid.fillRect(11, capeY, 10, 10, '#1e284f');
    grid.fillRect(12, capeY + 1, 8, 9, accentColor);
    grid.fillRect(13, capeY + 2, 6, 8, primaryColor);
  }

  // 3. Pernas e Botas (y: 20 a 28)
  const baseY = 21 + bobY;
  const legLeftX = 12;
  const legRightX = 17;

  // Calças
  const pantsColor = (charClass === 'cyberpunk_runner') ? '#1e284f' : '#2b3a67';
  grid.fillRect(legLeftX, baseY, 3, 4, pantsColor);
  grid.fillRect(legRightX, baseY, 3, 4, pantsColor);

  // Botas / Pés
  const bootColor = '#3a2312';
  const bootHighlight = '#6a4325';
  if (legOffset === 0) {
    // Posição neutra
    grid.fillRect(legLeftX - 1, baseY + 4, 4, 3, bootColor);
    grid.fillRect(legRightX, baseY + 4, 4, 3, bootColor);
    grid.fillRect(legLeftX, baseY + 4, 2, 1, bootHighlight);
    grid.fillRect(legRightX + 1, baseY + 4, 2, 1, bootHighlight);
  } else if (legOffset > 0) {
    // Perna esquerda à frente, direita atrás
    grid.fillRect(legLeftX - 2, baseY + 4, 4, 3, bootColor);
    grid.fillRect(legRightX + 1, baseY + 3, 4, 3, '#22150a'); // Sombra na perna de trás
  } else {
    // Invertido
    grid.fillRect(legLeftX, baseY + 3, 4, 3, '#22150a');
    grid.fillRect(legRightX - 1, baseY + 4, 4, 3, bootColor);
  }

  // 4. Tronco / Armadura / Roupas (y: 12 a 20)
  const torsoY = 12 + bobY;
  // Base do tronco
  grid.fillRect(11, torsoY, 10, 8, primaryColor);
  grid.fillRect(12, torsoY, 8, 7, secondaryColor);

  // Detalhes da armadura / insígnia / peitoral
  if (charClass === 'warrior' || charClass === 'paladin') {
    // Placa de peitoral
    grid.fillRect(13, torsoY + 1, 6, 4, '#8ea3db');
    grid.fillRect(14, torsoY + 2, 4, 2, '#ffffff'); // Brilho metálico
    grid.fillRect(13, torsoY + 5, 6, 2, '#5e7ac4');
    // Cinto e fivela dourada
    grid.fillRect(11, torsoY + 7, 10, 1, '#422a1d');
    grid.fillRect(15, torsoY + 7, 2, 1, '#f3be7a');
  } else if (charClass === 'mage' || charClass === 'healer') {
    // Manto místico com divisória central
    grid.fillRect(15, torsoY, 2, 8, '#f3be7a'); // Faixa dourada sagrada
    grid.fillRect(14, torsoY + 3, 4, 2, '#43bdb0'); // Gema OBO no peito
  } else if (charClass === 'cyberpunk_runner') {
    // Jaqueta aberta e camiseta preta com detalhe neon
    grid.fillRect(14, torsoY, 4, 8, '#0e1224');
    grid.fillRect(11, torsoY + 1, 2, 6, '#f08d39'); // Zíper / Listra neon
    grid.fillRect(19, torsoY + 1, 2, 6, '#f08d39');
    grid.fillRect(15, torsoY + 3, 2, 2, '#43bdb0'); // Reator / HUD peitoral
  } else {
    // Default Rogue / Aventureiro
    grid.fillRect(11, torsoY + 6, 10, 2, '#54321d');
    grid.fillRect(15, torsoY + 6, 2, 2, '#f3be7a');
  }

  // 5. Cabeça e Rosto (y: 4 a 12, x: 11 a 20)
  const headY = 4 + bobY;
  // Pescoço
  grid.fillRect(14, headY + 7, 4, 2, skinShadow);

  // Rosto base
  grid.fillRect(12, headY, 8, 7, skinColor);
  grid.fillRect(11, headY + 1, 10, 5, skinColor);

  // Olhos expressivos
  if (pose === 'hurt') {
    // Olhos fechados em X / dor
    grid.setPixelHex(13, headY + 3, outlineColor);
    grid.setPixelHex(18, headY + 3, outlineColor);
  } else {
    // Olhos abertos com brilho
    grid.setPixelHex(13, headY + 3, outlineColor);
    grid.setPixelHex(14, headY + 3, '#ffffff');
    grid.setPixelHex(17, headY + 3, outlineColor);
    grid.setPixelHex(18, headY + 3, '#ffffff');

    // Íris com cor de destaque (ex: azul royal ou verde OBO)
    const irisColor = (charClass === 'cyberpunk_runner') ? '#43bdb0' : '#3852b4';
    grid.setPixelHex(13, headY + 4, irisColor);
    grid.setPixelHex(17, headY + 4, irisColor);
  }

  // Nariz e boca sutil
  grid.setPixelHex(15, headY + 5, skinShadow);
  grid.setPixelHex(15, headY + 6, '#d97d64');
  grid.setPixelHex(16, headY + 6, '#d97d64');

  // 6. Cabelo / Elmo / Capuz
  if (hasHelmet) {
    // Elmo com visor/viseira
    grid.fillRect(11, headY - 1, 10, 3, '#5e7ac4');
    grid.fillRect(10, headY + 1, 3, 4, '#3852b4');
    grid.fillRect(19, headY + 1, 3, 4, '#3852b4');
    // Crista / pluma dourada ou vermelha
    grid.fillRect(15, headY - 3, 2, 3, accentColor);
    grid.setPixelHex(15, headY - 4, '#ffd8a8');
  } else if (charClass === 'mage' || charClass === 'rogue') {
    // Capuz elegante
    grid.fillRect(11, headY - 1, 10, 3, primaryColor);
    grid.fillRect(10, headY + 1, 2, 6, primaryColor);
    grid.fillRect(20, headY + 1, 2, 6, primaryColor);
    grid.fillRect(12, headY - 2, 8, 2, secondaryColor);
  } else if (charClass === 'cyberpunk_runner') {
    // Cabelo espetado com mecha neon + óculos visor
    grid.fillRect(12, headY - 2, 8, 3, '#0e1224');
    grid.fillRect(14, headY - 3, 5, 2, '#f08d39'); // Mecha neon
    // Visor cibernético
    grid.fillRect(12, headY + 2, 8, 3, '#43bdb0');
    grid.fillRect(14, headY + 3, 4, 1, '#ffffff'); // Brilho do visor
  } else {
    // Cabelo estilizado
    grid.fillRect(11, headY - 1, 10, 3, hairColor);
    grid.fillRect(10, headY + 1, 2, 4, hairColor);
    grid.fillRect(20, headY + 1, 2, 4, hairShadow);
    grid.fillRect(12, headY - 2, 7, 2, '#ffd8a8'); // Luz do cabelo
  }

  // 7. Braços e Mãos (laterais)
  const armY = 12 + bobY;
  // Braço esquerdo (atrás ou com escudo)
  if (hasShield) {
    // Escudo na mão esquerda (x: 6 a 11, y: 13 a 22)
    grid.fillRect(6, armY + 1, 5, 8, '#3852b4');
    grid.fillRect(7, armY + 2, 3, 6, '#5e7ac4');
    grid.setPixelHex(8, armY + 5, '#f3be7a'); // Emblema central dourado
    grid.fillRect(6, armY + 1, 1, 8, outlineColor);
    grid.fillRect(10, armY + 1, 1, 8, outlineColor);
  } else {
    // Braço comum esquerdo
    grid.fillRect(8, armY, 3, 6, primaryColor);
    grid.fillRect(8, armY + 6, 3, 2, skinColor); // Mão
  }

  // Braço direito e Arma
  const rightArmX = 21;
  if (!attackPose) {
    // Braço direito abaixado ou segurando arma
    grid.fillRect(rightArmX, armY, 3, 6, primaryColor);
    grid.fillRect(rightArmX, armY + 6, 3, 2, skinColor); // Mão direita

    // Arma embainhada ou na mão apontando para cima/frente
    if (weapon === 'sword') {
      // Espada de pé
      grid.fillRect(rightArmX + 2, armY + 4, 2, 3, '#54321d'); // Cabo de couro
      grid.fillRect(rightArmX + 1, armY + 4, 4, 1, '#f3be7a'); // Guarda dourada
      grid.fillRect(rightArmX + 2, armY - 5, 2, 9, '#c2c3c7'); // Lâmina de aço
      grid.fillRect(rightArmX + 2, armY - 5, 1, 9, '#ffffff'); // Fio afiado
      grid.setPixelHex(rightArmX + 2, armY - 6, '#ffffff');   // Ponta
    } else if (weapon === 'staff') {
      // Cajado mágico com orbe
      grid.fillRect(rightArmX + 2, armY - 8, 2, 17, '#54321d'); // Madeira nobre
      // Orbe místico no topo
      grid.fillRect(rightArmX + 1, armY - 11, 4, 4, '#43bdb0');
      grid.setPixelHex(rightArmX + 2, armY - 10, '#ffffff'); // Brilho de energia
    } else if (weapon === 'dagger') {
      grid.fillRect(rightArmX + 2, armY + 2, 2, 5, '#c2c3c7');
      grid.fillRect(rightArmX + 1, armY + 6, 3, 1, '#f3be7a');
    } else if (weapon === 'laser') {
      grid.fillRect(rightArmX + 1, armY + 5, 5, 3, '#0e1224');
      grid.fillRect(rightArmX + 4, armY + 6, 3, 1, '#f08d39'); // Cano de laser
    }
  } else {
    // Pose de Ataque / Strike!
    // Braço estendido à frente
    grid.fillRect(rightArmX, armY - 1, 6, 3, primaryColor);
    grid.fillRect(rightArmX + 5, armY - 1, 2, 3, skinColor);

    if (weapon === 'sword') {
      // Lâmina cortando para frente horizontal com arco de slash
      grid.fillRect(rightArmX + 7, armY - 1, 8, 2, '#ffffff');
      grid.fillRect(rightArmX + 7, armY, 7, 2, '#8ea3db');
      // Efeito visual de arco de corte (Slash FX)
      grid.fillRect(rightArmX + 4, armY - 6, 8, 2, '#6ce6d844');
      grid.fillRect(rightArmX + 10, armY - 4, 4, 2, '#ffffffaa');
    } else if (weapon === 'staff') {
      // Magia disparando
      grid.fillRect(rightArmX + 7, armY - 2, 4, 4, '#43bdb0');
      grid.fillRect(rightArmX + 11, armY - 4, 6, 6, '#6ce6d8');
      grid.setPixelHex(rightArmX + 14, armY - 1, '#ffffff');
    }
  }

  // 8. Contorno externo sutil (Outline seletivo para destacar no fundo)
  addSelectiveOutline(grid, outlineColor);

  return grid;
}

/**
 * Adiciona outline seletivo nos pixels de borda
 */
function addSelectiveOutline(grid, outlineColor) {
  const w = grid.width;
  const h = grid.height;
  const temp = grid.clone();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const current = temp.getPixel(x, y);
      if (current.a > 0) continue; // Só preenche onde era transparente

      // Checa se é vizinho imediato de pixel opaco
      let hasOpaqueNeighbor = false;
      const neighbors = [
        [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
      ];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          if (temp.getPixel(nx, ny).a > 100) {
            hasOpaqueNeighbor = true;
            break;
          }
        }
      }

      if (hasOpaqueNeighbor) {
        // Outline escuro com leve transparência nas extremidades
        grid.setPixelHex(x, y, outlineColor);
      }
    }
  }
}

/**
 * Gera um personagem em 16x16 (Micro retro)
 */
function generateCharacter16(options = {}) {
  const {
    charClass = 'warrior',
    skinColor = '#fcead8',
    primaryColor = '#3852b4',
    hairColor = '#f3be7a',
    outlineColor = '#0e1224'
  } = options;

  const grid = new PixelGrid(16, 16);

  // Sombra (y: 15)
  grid.fillRect(4, 15, 8, 1, '#00000033');

  // Pernas/Pés (y: 12..14)
  grid.fillRect(5, 12, 2, 3, '#1e284f');
  grid.fillRect(9, 12, 2, 3, '#1e284f');
  grid.fillRect(4, 14, 3, 1, '#3a2312');
  grid.fillRect(9, 14, 3, 1, '#3a2312');

  // Tronco (y: 7..11)
  grid.fillRect(5, 7, 6, 5, primaryColor);
  grid.fillRect(6, 8, 4, 3, '#5e7ac4');

  // Cabeça (y: 2..6)
  grid.fillRect(5, 2, 6, 5, skinColor);
  // Cabelo ou Elmo
  grid.fillRect(5, 1, 6, 2, hairColor);
  grid.fillRect(4, 2, 2, 3, hairColor);

  // Olhos (y: 4)
  grid.setPixelHex(6, 4, outlineColor);
  grid.setPixelHex(9, 4, outlineColor);

  // Braços / Arma
  grid.fillRect(3, 8, 2, 3, primaryColor);
  grid.fillRect(11, 8, 2, 3, primaryColor);
  // Espada
  grid.fillRect(13, 5, 1, 6, '#ffffff');
  grid.setPixelHex(12, 9, '#f3be7a');

  addSelectiveOutline(grid, outlineColor);
  return grid;
}

module.exports = {
  generateCharacter32,
  generateCharacter16
};
