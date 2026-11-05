import React, { useMemo } from "react";

/**
 * Standards-Compliant Compact Pure JavaScript QR Code Matrix Generator
 * Supports Byte mode (UTF-8), Error Correction Level M, and dynamic versioning.
 * No external dependencies.
 */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
let v = 1;
for (let i = 0; i < 255; i++) {
  EXP[i] = v;
  EXP[i + 255] = v;
  LOG[v] = i;
  v = (v << 1) ^ (v & 128 ? 0x11d : 0);
}

function gmul(a, b) {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]];
}

function getPoly(ec) {
  let p = [1];
  for (let i = 0; i < ec; i++) {
    const next = new Array(p.length + 1).fill(0);
    for (let j = 0; j < p.length; j++) {
      next[j] ^= gmul(p[j], EXP[i]);
      next[j + 1] ^= p[j];
    }
    p = next;
  }
  return p;
}

const RS_BLOCKS_M = {
  1: [[1, 26, 16]],
  2: [[1, 44, 28]],
  3: [[1, 70, 44]],
  4: [[2, 50, 32]],
  5: [[2, 67, 43]],
  6: [[4, 43, 27]],
  7: [[4, 49, 31]],
  8: [[2, 60, 38], [2, 61, 39]],
  9: [[3, 58, 36], [2, 59, 37]],
  10: [[4, 69, 43], [1, 70, 44]],
};

const ALIGN_TABLE = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
  7: [6, 22, 38],
  8: [6, 24, 42],
  9: [6, 26, 46],
  10: [6, 28, 50],
};

const CAPACITIES_M = [0, 14, 26, 42, 62, 84, 106, 122, 152, 180, 213];

// BCH format bits for EC M (mask 0 to 7)
const FORMAT_BITS_M = [
  0x5412, 0x5125, 0x5e7c, 0x5b4b, 0x45f9, 0x40ce, 0x4f97, 0x4aa0,
];

function BitBuffer() {
  this.buffer = [];
  this.length = 0;
}
BitBuffer.prototype = {
  get: function (i) {
    return ((this.buffer[Math.floor(i / 8)] >>> (7 - (i % 8))) & 1) === 1;
  },
  put: function (num, len) {
    for (let i = 0; i < len; i++) {
      this.putBit(((num >>> (len - i - 1)) & 1) === 1);
    }
  },
  putBit: function (bit) {
    if (this.length === this.buffer.length * 8) this.buffer.push(0);
    if (bit) this.buffer[Math.floor(this.length / 8)] |= 0x80 >>> (this.length % 8);
    this.length++;
  },
};

export function generateQRCodeMatrix(text) {
  // UTF-8 bytes
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 128) bytes.push(c);
    else if (c < 2048) {
      bytes.push((c >> 6) | 192);
      bytes.push((c & 63) | 128);
    } else {
      bytes.push((c >> 12) | 224);
      bytes.push(((c >> 6) & 63) | 128);
      bytes.push((c & 63) | 128);
    }
  }

  let ver = 1;
  while (ver <= 10 && bytes.length > CAPACITIES_M[ver]) ver++;
  if (ver > 10) ver = 10;

  const size = ver * 4 + 17;
  const grid = Array.from({ length: size }, () => Array(size).fill(null));
  const isFunc = Array.from({ length: size }, () => Array(size).fill(false));

  function setFunc(r, c, val) {
    grid[r][c] = val;
    isFunc[r][c] = true;
  }

  // 1. Finder patterns + separators
  function addFinder(startR, startC) {
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        const r = startR + y,
          c = startC + x;
        if (r >= 0 && r < size && c >= 0 && c < size) {
          if (y >= 0 && y <= 6 && x >= 0 && x <= 6) {
            const isDark =
              y === 0 ||
              y === 6 ||
              x === 0 ||
              x === 6 ||
              (y >= 2 && y <= 4 && x >= 2 && x <= 4);
            setFunc(r, c, isDark);
          } else {
            setFunc(r, c, false);
          }
        }
      }
    }
  }
  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  // 2. Alignment patterns
  const aligns = ALIGN_TABLE[ver];
  for (let i = 0; i < aligns.length; i++) {
    for (let j = 0; j < aligns.length; j++) {
      const ar = aligns[i],
        ac = aligns[j];
      if (grid[ar][ac] !== null) continue;
      for (let y = -2; y <= 2; y++) {
        for (let x = -2; x <= 2; x++) {
          const isDark =
            Math.abs(y) === 2 || Math.abs(x) === 2 || (x === 0 && y === 0);
          setFunc(ar + y, ac + x, isDark);
        }
      }
    }
  }

  // 3. Timing patterns
  for (let i = 8; i < size - 8; i++) {
    if (grid[6][i] === null) setFunc(6, i, i % 2 === 0);
    if (grid[i][6] === null) setFunc(i, 6, i % 2 === 0);
  }

  // 4. Dark module
  setFunc(size - 8, 8, true);

  // 5. Reserve format info
  for (let i = 0; i < 9; i++) {
    if (grid[8][i] === null) setFunc(8, i, false);
    if (grid[i][8] === null) setFunc(i, 8, false);
  }
  for (let i = 0; i < 8; i++) {
    if (grid[8][size - 1 - i] === null) setFunc(8, size - 1 - i, false);
    if (grid[size - 1 - i][8] === null) setFunc(size - 1 - i, 8, false);
  }

  // 6. Encode Data (Byte Mode 0100)
  const rawBlocks = RS_BLOCKS_M[ver];
  const rsBlocks = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    const [cnt, tot, dat] = rawBlocks[i];
    for (let j = 0; j < cnt; j++) {
      rsBlocks.push({ totalCount: tot, dataCount: dat });
    }
  }

  let totalDataCount = 0;
  for (let i = 0; i < rsBlocks.length; i++) totalDataCount += rsBlocks[i].dataCount;

  const buffer = new BitBuffer();
  buffer.put(4, 4); // Byte mode
  buffer.put(bytes.length, ver < 10 ? 8 : 16);
  for (let i = 0; i < bytes.length; i++) buffer.put(bytes[i], 8);

  if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.length % 8 !== 0) buffer.putBit(false);

  const PAD0 = 0xec,
    PAD1 = 0x11;
  while (buffer.length < totalDataCount * 8) {
    buffer.put(PAD0, 8);
    if (buffer.length < totalDataCount * 8) buffer.put(PAD1, 8);
  }

  // Reed-Solomon Error Correction Interleave
  let offset = 0;
  const dataBlocks = [];
  const ecBlocks = [];

  for (let i = 0; i < rsBlocks.length; i++) {
    const dc = rsBlocks[i].dataCount;
    const ec = rsBlocks[i].totalCount - dc;
    const blockData = new Uint8Array(dc);
    for (let j = 0; j < dc; j++) blockData[j] = buffer.buffer[offset + j];
    offset += dc;
    dataBlocks.push(blockData);

    const poly = getPoly(ec);
    const res = new Uint8Array(dc + ec);
    res.set(blockData);
    for (let j = 0; j < dc; j++) {
      const coef = res[j];
      if (coef !== 0) {
        for (let k = 0; k < poly.length; k++) res[j + k] ^= gmul(poly[k], coef);
      }
    }
    ecBlocks.push(res.slice(dc));
  }

  const finalData = [];
  let maxData = 0;
  for (let i = 0; i < rsBlocks.length; i++) {
    if (rsBlocks[i].dataCount > maxData) maxData = rsBlocks[i].dataCount;
  }
  for (let j = 0; j < maxData; j++) {
    for (let i = 0; i < rsBlocks.length; i++) {
      if (j < dataBlocks[i].length) finalData.push(dataBlocks[i][j]);
    }
  }
  const maxEc = ecBlocks[0].length;
  for (let j = 0; j < maxEc; j++) {
    for (let i = 0; i < rsBlocks.length; i++) {
      if (j < ecBlocks[i].length) finalData.push(ecBlocks[i][j]);
    }
  }

  // Convert to bit stream
  const dataBits = new BitBuffer();
  for (let i = 0; i < finalData.length; i++) {
    dataBits.put(finalData[i], 8);
  }

  // 7. Place data bits in matrix with standard Mask Pattern 0: (row + col) % 2 === 0
  const maskPattern = 0;
  let bitIdx = 0;
  let dir = -1;
  let row = size - 1;
  let col = size - 1;

  while (col > 0) {
    if (col === 6) col--; // Skip vertical timing column
    for (let i = 0; i < size; i++) {
      const r = row + (dir === -1 ? -i : i);
      for (let cOffset = 0; cOffset < 2; cOffset++) {
        const c = col - cOffset;
        if (!isFunc[r][c]) {
          let bit = false;
          if (bitIdx < dataBits.length) {
            bit = dataBits.get(bitIdx);
            bitIdx++;
          }
          const mask = (r + c) % 2 === 0;
          grid[r][c] = bit ? !mask : mask;
        }
      }
    }
    row = dir === -1 ? 0 : size - 1;
    dir = -dir;
    col -= 2;
  }

  // 8. Place format info (EC M, mask 0)
  const formatBits = FORMAT_BITS_M[maskPattern];
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >>> i) & 1) === 1;
    // Top-left finder
    if (i < 6) grid[i][8] = bit;
    else if (i < 8) grid[i + 1][8] = bit;
    else grid[8][15 - i] = bit;

    // Bottom-left / Top-right finder
    if (i < 8) grid[8][size - i] = bit;
    else grid[size - 15 + i][8] = bit;
  }

  return grid.map((r) => r.map((c) => Boolean(c)));
}

/**
 * High-definition Pure Vector SVG QR Code Component
 */
export function QRCodeSVG({
  value,
  size = 180,
  fgColor = "#0f172a",
  bgColor = "#ffffff",
  className = "",
  style = {},
}) {
  const matrix = useMemo(() => {
    try {
      return generateQRCodeMatrix(value || "upi://pay?pa=aibus@icici");
    } catch (err) {
      console.warn("QR code generation fallback:", err);
      return Array.from({ length: 25 }, () => Array(25).fill(false));
    }
  }, [value]);

  const moduleCount = matrix.length;
  const cellSize = size / moduleCount;

  return (
    <div
      className={`qr-code-svg-container ${className}`}
      style={{
        display: "inline-block",
        background: bgColor,
        padding: "8px",
        borderRadius: "12px",
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: "block" }}
        shapeRendering="crispEdges"
      >
        <rect width={size} height={size} fill={bgColor} rx="8" />
        {matrix.map((row, r) =>
          row.map((isDark, c) =>
            isDark ? (
              <rect
                key={`${r}-${c}`}
                x={c * cellSize}
                y={r * cellSize}
                width={cellSize + 0.15}
                height={cellSize + 0.15}
                fill={fgColor}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
}

export default QRCodeSVG;

