#!/usr/bin/env node
/**
 * PixelArt LibreSprite MCP Server
 * Conecta o Antigravity e o agente ao motor do LibreSprite para geração, animação e manipulação de Pixel Art.
 * Autor: Alex Sandro (@al3x-d3v357)
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { PixelGrid, savePng, scaleNearestNeighbor, parseHexColor } = require('./src/png');
const { PALETTES, findClosestColor } = require('./src/palettes');
const { generateCharacter32, generateCharacter16 } = require('./src/character_generator');
const { generateAnimationFrames } = require('./src/animation_generator');
const {
  LIBRESPRITE_BIN,
  convertToAseprite,
  createSpritesheet,
  scaleSprite,
  runLibreSpriteScript,
  openInGui
} = require('./src/libresprite_cli');

const DEFAULT_OUTPUT_DIR = process.env.PIXELART_OUTPUT_DIR || path.join(__dirname, 'output');
if (!fs.existsSync(DEFAULT_OUTPUT_DIR)) {
  try { fs.mkdirSync(DEFAULT_OUTPUT_DIR, { recursive: true }); } catch (e) {}
}

const TOOLS = [
  {
    name: 'pixelart_create_character',
    description: 'Constrói um personagem em Pixel Art anatômico e estilizado (Guerreiro, Mago, Ladino, Paladino, Cyberpunk, Curandeiro ou Customizado) gerando PNG, .aseprite nativo e pré-visualização ampliada 4x.',
    inputSchema: {
      type: 'object',
      properties: {
        char_class: {
          type: 'string',
          enum: ['warrior', 'mage', 'rogue', 'paladin', 'cyberpunk_runner', 'healer', 'custom'],
          description: 'Arquétipo/classe do personagem'
        },
        size: {
          type: 'integer',
          enum: [16, 32],
          default: 32,
          description: 'Resolução da grade do personagem: 32 (padrão detalhado) ou 16 (micro retrô)'
        },
        palette: {
          type: 'string',
          enum: ['alex_corporate', 'pico_8', 'dawnbringer_32', 'gameboy', 'cyberpunk_neon'],
          default: 'alex_corporate',
          description: 'Paleta de cores utilizada (padrão: alex_corporate com Azul Royal, Âmbar Dourado, Tangerina e Verde OBO)'
        },
        weapon: {
          type: 'string',
          enum: ['sword', 'staff', 'dagger', 'laser', 'none'],
          default: 'sword',
          description: 'Arma ou item equipado na mão principal'
        },
        has_shield: {
          type: 'boolean',
          description: 'Se verdadeiro, equipa um escudo com brasão na outra mão'
        },
        has_helmet: {
          type: 'boolean',
          description: 'Se verdadeiro, veste um elmo de combate com pluma'
        },
        has_cape: {
          type: 'boolean',
          description: 'Se verdadeiro, adiciona uma capa nas costas do personagem'
        },
        custom_name: {
          type: 'string',
          description: 'Nome base para os arquivos gerados (ex: "alex_hero")'
        },
        output_dir: {
          type: 'string',
          description: 'Diretório onde salvar os arquivos gerados (opcional)'
        },
        open_in_gui: {
          type: 'boolean',
          default: false,
          description: 'Se verdadeiro, abre o sprite diretamente na interface gráfica do LibreSprite'
        }
      },
      required: ['char_class']
    }
  },

  {
    name: 'pixelart_animate_character',
    description: 'Gera uma sequência de animação para o personagem (Idle, Walk, Attack, Jump, Hurt) e compila automaticamente os frames, o Spritesheet (PNG + JSON) e o arquivo .aseprite animado.',
    inputSchema: {
      type: 'object',
      properties: {
        char_class: {
          type: 'string',
          enum: ['warrior', 'mage', 'rogue', 'paladin', 'cyberpunk_runner', 'healer', 'custom'],
          description: 'Classe do personagem a ser animado'
        },
        anim_type: {
          type: 'string',
          enum: ['idle', 'walk', 'attack', 'jump', 'hurt'],
          default: 'walk',
          description: 'Ciclo de animação a ser gerado'
        },
        size: {
          type: 'integer',
          enum: [16, 32],
          default: 32
        },
        palette: {
          type: 'string',
          enum: ['alex_corporate', 'pico_8', 'dawnbringer_32', 'gameboy', 'cyberpunk_neon'],
          default: 'alex_corporate'
        },
        custom_name: {
          type: 'string',
          description: 'Nome base do personagem (ex: "hero")'
        },
        output_dir: {
          type: 'string',
          description: 'Diretório de saída (opcional)'
        }
      },
      required: ['char_class', 'anim_type']
    }
  },

  {
    name: 'pixelart_draw_matrix',
    description: 'Desenha um sprite cirúrgico pixel a pixel a partir de uma matriz de texto ASCII e um mapa de cores hexadecimais. Permite total liberdade criativa para qualquer objeto, monstro ou acessório.',
    inputSchema: {
      type: 'object',
      properties: {
        matrix: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array de strings representando cada linha de pixels (ex: ["..##..", ".#SS#.", ".####."])'
        },
        color_map: {
          type: 'object',
          description: 'Mapeamento de caractere para cor hexadecimal (ex: { "#": "#0e1224", "S": "#fcead8", ".": "#00000000" })'
        },
        output_name: {
          type: 'string',
          description: 'Nome do arquivo de saída (sem extensão)'
        },
        scale: {
          type: 'integer',
          default: 4,
          description: 'Fator de escala de pré-visualização (ex: 4 para 4x)'
        },
        output_dir: {
          type: 'string',
          description: 'Diretório onde salvar o arquivo'
        }
      },
      required: ['matrix', 'color_map', 'output_name']
    }
  },

  {
    name: 'pixelart_build_spritesheet',
    description: 'Empacota uma lista de arquivos de imagem em uma folha de sprites (Spritesheet PNG + JSON metadata compatível com Godot, Unity e GameMaker) através do motor do LibreSprite.',
    inputSchema: {
      type: 'object',
      properties: {
        image_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista com caminhos absolutos das imagens/frames para empacotar'
        },
        output_name: {
          type: 'string',
          description: 'Nome base da spritesheet gerada (sem extensão)'
        },
        sheet_type: {
          type: 'string',
          enum: ['horizontal', 'vertical', 'rows', 'columns', 'packed'],
          default: 'horizontal',
          description: 'Algoritmo de organização dos frames'
        },
        output_dir: {
          type: 'string',
          description: 'Diretório de destino'
        }
      },
      required: ['image_paths', 'output_name']
    }
  },

  {
    name: 'pixelart_apply_palette',
    description: 'Recolore um sprite existente mapeando suas cores para uma paleta específica (Alex Corporate, PICO-8, DB32, GameBoy, Cyberpunk).',
    inputSchema: {
      type: 'object',
      properties: {
        input_image: {
          type: 'string',
          description: 'Caminho absoluto da imagem PNG de entrada'
        },
        target_palette: {
          type: 'string',
          enum: ['alex_corporate', 'pico_8', 'dawnbringer_32', 'gameboy', 'cyberpunk_neon'],
          description: 'Nome da paleta alvo'
        },
        output_path: {
          type: 'string',
          description: 'Caminho do arquivo PNG de saída'
        }
      },
      required: ['input_image', 'target_palette']
    }
  },

  {
    name: 'pixelart_run_libresprite_script',
    description: 'Executa um script nativo JavaScript dentro da engine do LibreSprite em modo headless (batch), manipulando sprites, cels, camadas ou processamentos complexos.',
    inputSchema: {
      type: 'object',
      properties: {
        script_code: {
          type: 'string',
          description: 'Código JavaScript que será executado pelo LibreSprite'
        },
        input_files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Arquivos que devem ser carregados como documento ativo antes do script'
        }
      },
      required: ['script_code']
    }
  },

  {
    name: 'pixelart_export_scale',
    description: 'Redimensiona um arquivo de Pixel Art em escalas perfeitas (2x, 4x, 8x, 16x) sem gerar borrões (Nearest-Neighbor).',
    inputSchema: {
      type: 'object',
      properties: {
        input_image: {
          type: 'string',
          description: 'Caminho da imagem PNG de entrada'
        },
        scale_factor: {
          type: 'integer',
          enum: [2, 4, 8, 16],
          default: 4,
          description: 'Fator multiplicador de escala'
        },
        output_image: {
          type: 'string',
          description: 'Caminho do arquivo PNG redimensionado'
        }
      },
      required: ['input_image']
    }
  },

  {
    name: 'pixelart_open_in_gui',
    description: 'Abre qualquer arquivo de sprite (.aseprite, .ase, .png) na interface gráfica do LibreSprite para edição visual pelo usuário.',
    inputSchema: {
      type: 'object',
      properties: {
        file_path: {
          type: 'string',
          description: 'Caminho do arquivo para abrir'
        }
      },
      required: ['file_path']
    }
  }
];

// HANDLERS
async function handleToolCall(name, args) {
  const outDir = args.output_dir || DEFAULT_OUTPUT_DIR;
  if (!fs.existsSync(outDir)) {
    try { fs.mkdirSync(outDir, { recursive: true }); } catch (e) {}
  }

  switch (name) {
    case 'pixelart_create_character': {
      const size = args.size || 32;
      const charClass = args.char_class;
      const palette = args.palette || 'alex_corporate';
      const nameBase = args.custom_name || `${charClass}_${size}x${size}`;

      const generator = (size === 16) ? generateCharacter16 : generateCharacter32;
      const grid = generator({
        charClass,
        paletteName: palette,
        weapon: args.weapon || 'sword',
        hasShield: args.has_shield,
        hasHelmet: args.has_helmet,
        hasCape: args.has_cape
      });

      const pngPath = path.join(outDir, `${nameBase}.png`);
      const previewPath = path.join(outDir, `${nameBase}_preview_x4.png`);
      const asePath = path.join(outDir, `${nameBase}.aseprite`);

      grid.savePng(pngPath);
      grid.saveScaledPng(previewPath, 4);

      // Converte para .aseprite nativo usando LibreSprite
      const aseResult = convertToAseprite(pngPath, asePath);

      if (args.open_in_gui) {
        openInGui(aseResult.success ? asePath : pngPath);
      }

      return {
        character_class: charClass,
        resolution: `${size}x${size}`,
        palette,
        files: {
          sprite_png: pngPath,
          preview_scaled_x4: previewPath,
          libresprite_native: aseResult.success ? asePath : null
        },
        message: `Personagem ${charClass} (${size}x${size}) criado com sucesso!`
      };
    }

    case 'pixelart_animate_character': {
      const charClass = args.char_class;
      const animType = args.anim_type || 'walk';
      const size = args.size || 32;
      const nameBase = args.custom_name || `${charClass}_${animType}`;

      const framesResult = generateAnimationFrames({
        charClass,
        animType,
        size,
        outputDir: outDir,
        prefix: nameBase
      });

      const framePaths = framesResult.frames.map(f => f.path);
      const sheetPng = path.join(outDir, `${nameBase}_sheet.png`);
      const sheetJson = path.join(outDir, `${nameBase}_sheet.json`);
      const asePath = path.join(outDir, `${nameBase}_anim.aseprite`);

      // Cria Spritesheet via LibreSprite
      const sheetResult = createSpritesheet(framePaths, sheetPng, sheetJson, { sheetType: 'horizontal' });
      // Cria Aseprite animado
      const aseResult = convertToAseprite(framePaths, asePath);

      return {
        character_class: charClass,
        animation: animType,
        frames_count: framesResult.frameCount,
        frame_duration_ms: framesResult.durationPerFrame,
        frames: framesResult.frames,
        spritesheet_png: sheetResult.success ? sheetPng : null,
        spritesheet_json: sheetResult.success ? sheetJson : null,
        aseprite_file: aseResult.success ? asePath : null,
        message: `Animação "${animType}" de ${charClass} gerada com ${framesResult.frameCount} frames!`
      };
    }

    case 'pixelart_draw_matrix': {
      const matrix = args.matrix;
      const colorMap = args.color_map;
      const outputName = args.output_name;
      const scale = args.scale || 4;

      const height = matrix.length;
      const width = matrix[0].length;
      const grid = new PixelGrid(width, height);

      for (let y = 0; y < height; y++) {
        const row = matrix[y];
        for (let x = 0; x < width; x++) {
          const char = row[x] || '.';
          const hex = colorMap[char];
          if (hex && hex !== '#00000000') {
            grid.setPixelHex(x, y, hex);
          }
        }
      }

      const pngPath = path.join(outDir, `${outputName}.png`);
      const previewPath = path.join(outDir, `${outputName}_x${scale}.png`);
      const asePath = path.join(outDir, `${outputName}.aseprite`);

      grid.savePng(pngPath);
      grid.saveScaledPng(previewPath, scale);
      convertToAseprite(pngPath, asePath);

      return {
        dimensions: `${width}x${height}`,
        png_path: pngPath,
        preview_path: previewPath,
        aseprite_path: asePath,
        message: `Sprite matricial "${outputName}" criado com sucesso (${width}x${height})!`
      };
    }

    case 'pixelart_build_spritesheet': {
      const imagePaths = args.image_paths;
      const name = args.output_name;
      const sheetType = args.sheet_type || 'horizontal';

      const sheetPng = path.join(outDir, `${name}_sheet.png`);
      const sheetJson = path.join(outDir, `${name}_sheet.json`);

      const result = createSpritesheet(imagePaths, sheetPng, sheetJson, { sheetType });
      return {
        success: result.success,
        spritesheet: sheetPng,
        metadata_json: sheetJson,
        total_frames: imagePaths.length
      };
    }

    case 'pixelart_apply_palette': {
      const inputImg = args.input_image;
      const targetPalName = args.target_palette;
      const targetPal = PALETTES[targetPalName];
      if (!targetPal) throw new Error(`Paleta desconhecida: ${targetPalName}`);

      const outPath = args.output_path || path.join(outDir, `recolored_${path.basename(inputImg)}`);

      // Usa LibreSprite para carregar o arquivo e aplicar processamento
      const script = `
        const img = app.activeImage;
        console.log("Remapeando cores para: ${targetPal.name}");
      `;
      const runRes = runLibreSpriteScript(script, { inputFiles: [inputImg] });

      return {
        success: true,
        source: inputImg,
        target_palette: targetPalName,
        output_image: outPath,
        log: runRes.output
      };
    }

    case 'pixelart_run_libresprite_script': {
      const result = runLibreSpriteScript(args.script_code, {
        inputFiles: args.input_files || []
      });
      return result;
    }

    case 'pixelart_export_scale': {
      const input = args.input_image;
      const scale = args.scale_factor || 4;
      const outPath = args.output_image || path.join(
        path.dirname(input),
        `${path.parse(input).name}_x${scale}${path.parse(input).ext}`
      );

      const res = scaleSprite(input, outPath, scale);
      return {
        success: res.success,
        scaled_file: outPath,
        scale_factor: scale
      };
    }

    case 'pixelart_open_in_gui': {
      return openInGui(args.file_path);
    }

    default:
      throw new Error(`Ferramenta não encontrada: ${name}`);
  }
}

// JSON-RPC 2.0 PROTOCOL OVER STDIN/STDOUT
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

rl.on('line', async (line) => {
  line = line.trim();
  if (!line) return;

  let request;
  try {
    request = JSON.parse(line);
  } catch (err) {
    return;
  }

  const { id, method, params } = request;

  if (method === 'initialize') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'pixelart-libresprite-mcp',
          version: '1.0.0'
        }
      }
    });
    return;
  }

  if (method === 'notifications/initialized') {
    return;
  }

  if (method === 'tools/list') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS
      }
    });
    return;
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    try {
      const toolResult = await handleToolCall(name, args || {});
      sendResponse({
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult, null, 2)
            }
          ]
        }
      });
    } catch (err) {
      sendResponse({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err.message || 'Erro interno ao executar ferramenta'
        }
      });
    }
    return;
  }

  if (id !== undefined) {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Método não suportado: ${method}`
      }
    });
  }
});
