import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(d.length);
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([len, t, d, crcBuf]);
}

// ── Draw helpers ────────────────────────────────────────────────────────────
function circle(px, size, cx, cy, r, color) {
  for (let y = Math.max(0, cy - r - 1); y <= Math.min(size - 1, cy + r + 1); y++) {
    for (let x = Math.max(0, cx - r - 1); x <= Math.min(size - 1, cx + r + 1); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
        px[y * size + x] = color;
      }
    }
  }
}

function thickLine(px, size, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.ceil(Math.hypot(dx, dy) * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    circle(px, size, Math.round(x1 + t * dx), Math.round(y1 + t * dy), thickness, color);
  }
}

// ── Icon generator ──────────────────────────────────────────────────────────
function makeIcon(size) {
  const BG = [34, 197, 94];   // #22c55e green
  const FG = [255, 255, 255]; // white

  // Pixel buffer: each entry is [r, g, b]
  const px = new Array(size * size).fill(BG);

  // Draw a white checkmark ✓
  const s = size;
  const thick = Math.round(s * 0.065);

  // Left stroke: (22%, 50%) → (42%, 70%)
  thickLine(px, s,
    Math.round(s * 0.22), Math.round(s * 0.50),
    Math.round(s * 0.42), Math.round(s * 0.70),
    thick, FG);

  // Right stroke: (42%, 70%) → (80%, 28%)
  thickLine(px, s,
    Math.round(s * 0.42), Math.round(s * 0.70),
    Math.round(s * 0.80), Math.round(s * 0.28),
    thick, FG);

  // ── Encode as PNG (RGB, 8-bit) ───────────────────────────────────────────
  const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(s, 0); ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rowLen = 1 + s * 3;
  const raw = Buffer.allocUnsafe(s * rowLen);
  for (let y = 0; y < s; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < s; x++) {
      const [r, g, b] = px[y * s + x];
      const o = y * rowLen + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }

  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('public', { recursive: true });
writeFileSync('public/icon-192.png',        makeIcon(192));
writeFileSync('public/icon-512.png',        makeIcon(512));
writeFileSync('public/apple-touch-icon.png', makeIcon(180));
console.log('✓ Icons generated: icon-192.png, icon-512.png, apple-touch-icon.png');
