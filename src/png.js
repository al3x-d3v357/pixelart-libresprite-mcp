const zlib = require('zlib');
const fs = require('fs');

/**
 * Tabela de CRC32 pré-calculada para desempenho máximo
 */
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
  }
  return crcTable;
}

function crc32(buf) {
  const table = getCrcTable();
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcVal = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/**
 * Cria buffer PNG válido de 32-bit RGBA com compressão deflate nativa
 */
function createPng(width, height, rgbaBuffer) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit per channel
  ihdr[9] = 6; // Color type 6: RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const stride = width * 4;
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + stride);
    row[0] = 0; // Filter type 0 (None)
    rgbaBuffer.copy(row, 1, y * stride, (y + 1) * stride);
    rawRows.push(row);
  }

  const uncompressed = Buffer.concat(rawRows);
  const idatData = zlib.deflateSync(uncompressed, { level: 6 });

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Salva buffer RGBA em arquivo PNG
 */
function savePng(filePath, width, height, rgbaBuffer) {
  const pngData = createPng(width, height, rgbaBuffer);
  fs.writeFileSync(filePath, pngData);
  return filePath;
}

/**
 * Escala buffer de pixels usando Nearest-Neighbor estrito (preserva bordas de pixel art perfeitas)
 */
function scaleNearestNeighbor(width, height, rgbaBuffer, scaleFactor) {
  const newWidth = Math.floor(width * scaleFactor);
  const newHeight = Math.floor(height * scaleFactor);
  const newBuffer = Buffer.alloc(newWidth * newHeight * 4);

  for (let y = 0; y < newHeight; y++) {
    const origY = Math.floor(y / scaleFactor);
    for (let x = 0; x < newWidth; x++) {
      const origX = Math.floor(x / scaleFactor);

      const origIdx = (origY * width + origX) * 4;
      const targetIdx = (y * newWidth + x) * 4;

      newBuffer[targetIdx + 0] = rgbaBuffer[origIdx + 0];
      newBuffer[targetIdx + 1] = rgbaBuffer[origIdx + 1];
      newBuffer[targetIdx + 2] = rgbaBuffer[origIdx + 2];
      newBuffer[targetIdx + 3] = rgbaBuffer[origIdx + 3];
    }
  }

  return {
    width: newWidth,
    height: newHeight,
    buffer: newBuffer
  };
}

/**
 * Converte cor hex (#RRGGBB ou #RRGGBBAA) para objeto {r, g, b, a}
 */
function parseHexColor(hex) {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('') + 'ff';
  } else if (clean.length === 6) {
    clean = clean + 'ff';
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 24) & 0xFF,
    g: (num >> 16) & 0xFF,
    b: (num >> 8) & 0xFF,
    a: num & 0xFF
  };
}

/**
 * Classe utilitária PixelGrid para desenho de pixel art com precisão
 */
class PixelGrid {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = Buffer.alloc(width * height * 4, 0); // Transparente por padrão
  }

  setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = (y * this.width + x) * 4;
    this.buffer[idx + 0] = r;
    this.buffer[idx + 1] = g;
    this.buffer[idx + 2] = b;
    this.buffer[idx + 3] = a;
  }

  setPixelHex(x, y, hexColor) {
    const c = parseHexColor(hexColor);
    this.setPixel(x, y, c.r, c.g, c.b, c.a);
  }

  getPixel(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return { r: 0, g: 0, b: 0, a: 0 };
    const idx = (y * this.width + x) * 4;
    return {
      r: this.buffer[idx + 0],
      g: this.buffer[idx + 1],
      b: this.buffer[idx + 2],
      a: this.buffer[idx + 3]
    };
  }

  fillRect(x, y, w, h, hexColor) {
    const c = parseHexColor(hexColor);
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        this.setPixel(px, py, c.r, c.g, c.b, c.a);
      }
    }
  }

  blendPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height || a === 0) return;
    if (a === 255) {
      this.setPixel(x, y, r, g, b, a);
      return;
    }
    const bg = this.getPixel(x, y);
    const alphaNorm = a / 255;
    const invAlpha = 1 - alphaNorm;

    const outR = Math.round(r * alphaNorm + bg.r * invAlpha);
    const outG = Math.round(g * alphaNorm + bg.g * invAlpha);
    const outB = Math.round(b * alphaNorm + bg.b * invAlpha);
    const outA = Math.min(255, bg.a + a);

    this.setPixel(x, y, outR, outG, outB, outA);
  }

  clone() {
    const copy = new PixelGrid(this.width, this.height);
    this.buffer.copy(copy.buffer);
    return copy;
  }

  toPngBuffer() {
    return createPng(this.width, this.height, this.buffer);
  }

  savePng(filePath) {
    return savePng(filePath, this.width, this.height, this.buffer);
  }

  saveScaledPng(filePath, scale = 4) {
    const scaled = scaleNearestNeighbor(this.width, this.height, this.buffer, scale);
    return savePng(filePath, scaled.width, scaled.height, scaled.buffer);
  }
}

module.exports = {
  createPng,
  savePng,
  scaleNearestNeighbor,
  parseHexColor,
  PixelGrid
};
