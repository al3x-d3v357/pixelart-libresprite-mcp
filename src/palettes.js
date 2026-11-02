/**
 * Paletas de cores oficiais e populares para Pixel Art
 */

const PALETTES = {
  alex_corporate: {
    name: 'Alex Corporate Palette',
    description: 'Paleta oficial do Alex com Azul Royal, Dourado Âmbar, Tangerina Neon e Verde Institucional',
    colors: [
      '#00000000', // 0: Transparente
      '#0e1224',   // 1: Preto Azulado (Outlines)
      '#1e284f',   // 2: Azul Noturno (Sombra profunda)
      '#3852b4',   // 3: Azul Royal Profundo (Primária / Armaduras / Roupas)
      '#5e7ac4',   // 4: Azul Médio / Ardósia (Bordas / Luzes secundárias)
      '#8ea3db',   // 5: Azul Celeste Claro (Highlight azul)
      '#f3be7a',   // 6: Dourado / Âmbar Quente (Destaques, Cabelo, Acessórios)
      '#ffd8a8',   // 7: Ouro Claro / Brilho
      '#f08d39',   // 8: Laranja Tangerina Neon (Foco, Fogo, Detalhes vivos)
      '#43bdb0',   // 9: Verde Institucional OBO (Itens especiais, Magia, Gemas)
      '#6ce6d8',   // 10: Turquesa Claro (Highlight verde)
      '#fcead8',   // 11: Pele Clara (Base pele)
      '#e5b991',   // 12: Pele Tom Médio
      '#a8724b',   // 13: Pele Sombra / Couro
      '#54321d',   // 14: Marrom Escuro (Botas, Cinto)
      '#ffffff'    // 15: Branco Puro (Olhos, Brilho especular)
    ]
  },

  pico_8: {
    name: 'PICO-8 (16 Colors)',
    description: 'Paleta clássica retro de 16 cores do console virtual PICO-8',
    colors: [
      '#00000000',
      '#000000', // 0: Black
      '#1D2B53', // 1: Dark Blue
      '#7E2553', // 2: Dark Purple
      '#008751', // 3: Dark Green
      '#AB5236', // 4: Brown
      '#5F574F', // 5: Dark Gray
      '#C2C3C7', // 6: Light Gray
      '#FFF1E8', // 7: White
      '#FF004D', // 8: Red
      '#FFA300', // 9: Orange
      '#FFEC27', // 10: Yellow
      '#00E436', // 11: Green
      '#29ADFF', // 12: Light Blue
      '#83769C', // 13: Indigo
      '#FF77A8', // 14: Pink
      '#FFCCAA'  // 15: Peach (Skin)
    ]
  },

  gameboy: {
    name: 'GameBoy Classic (4 Shades)',
    description: 'Paleta monocromática clássica original do GameBoy',
    colors: [
      '#00000000',
      '#0f380f', // Darkest green
      '#306230', // Dark green
      '#8bac0f', // Light green
      '#9bbc0f'  // Lightest green
    ]
  },

  dawnbringer_32: {
    name: 'DawnBringer 32 (DB32)',
    description: 'Paleta lendária de 32 cores para artistas de Pixel Art',
    colors: [
      '#00000000',
      '#000000', '#222034', '#45283c', '#663931', '#8f563b',
      '#df7126', '#d9a066', '#eec39a', '#fbf236', '#99e550',
      '#6abe30', '#37946e', '#4b692f', '#524b24', '#323c39',
      '#3f3f74', '#306082', '#4497e6', '#59b8ff', '#8f563b',
      '#d95763', '#ac3232', '#692464', '#9b2226', '#d77643',
      '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731',
      '#a22633', '#ffffff'
    ]
  },

  cyberpunk_neon: {
    name: 'Cyberpunk Neon',
    description: 'Paleta futurista com contrastes altos, ciano e magenta neon',
    colors: [
      '#00000000',
      '#0a0914', '#151324', '#2a1e47', '#ff007f', '#ff54b0',
      '#00f0ff', '#70fdff', '#ffe600', '#2bfd72', '#ffffff',
      '#7b52ab', '#3b2554', '#f5c096', '#bd7f59'
    ]
  }
};

/**
 * Encontra a cor mais próxima em uma paleta para recoloring
 */
function findClosestColor(r, g, b, targetPaletteColors) {
  let closest = targetPaletteColors[1] || '#ffffff';
  let minDist = Infinity;

  for (let i = 1; i < targetPaletteColors.length; i++) {
    const hex = targetPaletteColors[i].replace('#', '');
    const pr = parseInt(hex.substring(0, 2), 16);
    const pg = parseInt(hex.substring(2, 4), 16);
    const pb = parseInt(hex.substring(4, 6), 16);

    // Distância euclidiana com ponderação perceptual humana
    const dist = (r - pr) ** 2 * 0.3 + (g - pg) ** 2 * 0.59 + (b - pb) ** 2 * 0.11;
    if (dist < minDist) {
      minDist = dist;
      closest = targetPaletteColors[i];
    }
  }

  return closest;
}

module.exports = {
  PALETTES,
  findClosestColor
};
