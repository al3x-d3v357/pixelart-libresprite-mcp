const path = require('path');
const fs = require('fs');
const { generateCharacter32, generateCharacter16 } = require('./character_generator');

const ANIMATION_PRESETS = {
  idle: {
    name: 'idle',
    frames: ['idle', 'idle_breathe', 'idle', 'idle_breathe'],
    duration: 150
  },
  walk: {
    name: 'walk',
    frames: ['idle', 'walk_1', 'idle', 'walk_2'],
    duration: 120
  },
  attack: {
    name: 'attack',
    frames: ['idle', 'attack_windup', 'attack_strike', 'idle'],
    duration: 100
  },
  jump: {
    name: 'jump',
    frames: ['idle', 'jump', 'jump', 'idle'],
    duration: 140
  },
  hurt: {
    name: 'hurt',
    frames: ['hurt', 'hurt', 'idle'],
    duration: 120
  }
};

/**
 * Gera os frames de uma animação específica e salva os PNGs
 */
function generateAnimationFrames(options = {}) {
  const {
    charClass = 'warrior',
    animType = 'walk',
    size = 32,
    outputDir,
    prefix = 'char'
  } = options;

  const preset = ANIMATION_PRESETS[animType] || ANIMATION_PRESETS.idle;
  const framePaths = [];

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const generator = (size === 16) ? generateCharacter16 : generateCharacter32;

  preset.frames.forEach((pose, index) => {
    const grid = generator({
      ...options,
      pose
    });

    const fileName = `${prefix}_${preset.name}_f${index}.png`;
    const fullPath = path.join(outputDir, fileName);
    grid.savePng(fullPath);
    framePaths.push({
      index,
      pose,
      path: fullPath,
      duration: preset.duration
    });
  });

  return {
    animType: preset.name,
    frameCount: framePaths.length,
    durationPerFrame: preset.duration,
    frames: framePaths
  };
}

module.exports = {
  ANIMATION_PRESETS,
  generateAnimationFrames
};
