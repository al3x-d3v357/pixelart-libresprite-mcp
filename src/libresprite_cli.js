const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const LIBRESPRITE_BIN = process.env.LIBRESPRITE_BIN || (
  fs.existsSync('/media/alex/alex/bin/libresprite')
    ? '/media/alex/alex/bin/libresprite'
    : (fs.existsSync('/media/alex/alex/softwares/libresprite-v1.3-linux-x86_64.AppImage')
      ? '/media/alex/alex/softwares/libresprite-v1.3-linux-x86_64.AppImage'
      : 'libresprite')
);

/**
 * Converte um ou mais PNGs para um arquivo nativo .aseprite
 */
function convertToAseprite(inputPaths, outputPath) {
  const inputs = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
  const args = ['-b', ...inputs, '--save-as', outputPath];

  try {
    const result = execSync(`${LIBRESPRITE_BIN} ${args.map(a => `"${a}"`).join(' ')}`, {
      encoding: 'utf8',
      timeout: 15000
    });
    return {
      success: fs.existsSync(outputPath),
      outputPath,
      output: result
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      stderr: err.stderr ? err.stderr.toString() : null
    };
  }
}

/**
 * Cria um spritesheet PNG + JSON metadata usando o LibreSprite
 */
function createSpritesheet(framePaths, outputSheetPath, outputJsonPath, options = {}) {
  const {
    sheetType = 'horizontal', // horizontal, vertical, rows, columns, packed
    borderPadding = 0,
    shapePadding = 0
  } = options;

  const args = [
    '-b',
    ...framePaths,
    '--sheet', outputSheetPath,
    '--data', outputJsonPath,
    '--format', 'json-array',
    '--sheet-type', sheetType
  ];

  if (borderPadding > 0) {
    args.push('--border-padding', String(borderPadding));
  }
  if (shapePadding > 0) {
    args.push('--shape-padding', String(shapePadding));
  }

  try {
    const result = execSync(`${LIBRESPRITE_BIN} ${args.map(a => `"${a}"`).join(' ')}`, {
      encoding: 'utf8',
      timeout: 20000
    });

    return {
      success: fs.existsSync(outputSheetPath),
      sheetPath: outputSheetPath,
      jsonPath: outputJsonPath,
      metadata: fs.existsSync(outputJsonPath) ? JSON.parse(fs.readFileSync(outputJsonPath, 'utf8')) : null
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Redimensiona um sprite via LibreSprite mantendo interpolação de pixel art
 */
function scaleSprite(inputPath, outputPath, scaleFactor = 4) {
  const args = ['-b', inputPath, '--scale', String(scaleFactor), '--save-as', outputPath];
  try {
    execSync(`${LIBRESPRITE_BIN} ${args.map(a => `"${a}"`).join(' ')}`, {
      encoding: 'utf8',
      timeout: 10000
    });
    return {
      success: fs.existsSync(outputPath),
      outputPath
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Executa um script JS arbitrário no LibreSprite
 */
function runLibreSpriteScript(scriptContent, options = {}) {
  const { inputFiles = [] } = options;
  const tempScriptPath = path.join('/tmp', `libresprite_script_${Date.now()}.js`);
  fs.writeFileSync(tempScriptPath, scriptContent);

  const args = ['-b', ...inputFiles, '--script', tempScriptPath];

  try {
    const output = execSync(`${LIBRESPRITE_BIN} ${args.map(a => `"${a}"`).join(' ')}`, {
      encoding: 'utf8',
      timeout: 25000
    });

    try { fs.unlinkSync(tempScriptPath); } catch (e) {}

    return {
      success: true,
      output
    };
  } catch (err) {
    try { fs.unlinkSync(tempScriptPath); } catch (e) {}
    return {
      success: false,
      error: err.message,
      stderr: err.stderr ? err.stderr.toString() : null
    };
  }
}

/**
 * Abre o arquivo na interface visual do LibreSprite (GUI)
 */
function openInGui(filePath) {
  try {
    const child = spawn(LIBRESPRITE_BIN, [filePath], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    return {
      success: true,
      message: `Arquivo ${filePath} aberto na GUI do LibreSprite.`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  LIBRESPRITE_BIN,
  convertToAseprite,
  createSpritesheet,
  scaleSprite,
  runLibreSpriteScript,
  openInGui
};
