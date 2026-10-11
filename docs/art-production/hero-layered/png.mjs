// PNG 읽기·쓰기 (Node 전용, 의존성 없음). 결과는 언제나 RGBA8.
import zlib from 'node:zlib';

const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CHANNELS = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

const CRC = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function readPngInfo(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('PNG 서명이 아닙니다');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bitDepth: buf[24], colorType: buf[25], interlace: buf[28] };
}

export function decodePng(buf) {
  const info = readPngInfo(buf);
  const { width, height, bitDepth, colorType, interlace } = info;
  if (interlace) throw new Error('인터레이스 PNG는 지원하지 않습니다');
  if (!(colorType in CHANNELS)) throw new Error(`알 수 없는 색 형식 ${colorType}`);
  if (bitDepth !== 8 && bitDepth !== 16 && !(colorType === 3 || colorType === 0)) throw new Error(`비트 깊이 ${bitDepth} 미지원`);
  const idat = [];
  let palette = null, trns = null, crcErrors = 0;
  for (let p = 8; p < buf.length;) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (crc32(buf.subarray(p + 4, p + 8 + len)) !== buf.readUInt32BE(p + 8 + len)) crcErrors++;
    if (type === 'IDAT') idat.push(data);
    else if (type === 'PLTE') palette = data;
    else if (type === 'tRNS') trns = data;
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = CHANNELS[colorType];
  const bitsPerPixel = ch * bitDepth;
  const stride = Math.ceil((width * bitsPerPixel) / 8);
  const bpp = Math.max(1, bitsPerPixel >> 3);
  const lines = Buffer.alloc(stride * height);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = lines.subarray(y * stride, (y + 1) * stride);
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      if (f === 1) v += a;
      else if (f === 2) v += b;
      else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      else if (f !== 0) throw new Error(`알 수 없는 필터 ${f}`);
      out[i] = v & 255;
    }
    prev = out;
  }
  const data = new Uint8Array(width * height * 4);
  const sample = (line, x, k) => {
    if (bitDepth === 8) return line[x * ch + k];
    if (bitDepth === 16) return line[(x * ch + k) * 2];
    const per = 8 / bitDepth, byte = line[(x / per) | 0], shift = (per - 1 - (x % per)) * bitDepth;
    return (byte >> shift) & ((1 << bitDepth) - 1);
  };
  const scale = colorType === 0 && bitDepth < 8 ? 255 / ((1 << bitDepth) - 1) : 1;
  for (let y = 0; y < height; y++) {
    const line = lines.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (colorType === 6) { for (let k = 0; k < 4; k++) data[o + k] = sample(line, x, k); }
      else if (colorType === 2) {
        for (let k = 0; k < 3; k++) data[o + k] = sample(line, x, k);
        data[o + 3] = trns && trns.length >= 6 && data[o] === trns[1] && data[o + 1] === trns[3] && data[o + 2] === trns[5] ? 0 : 255;
      } else if (colorType === 3) {
        const i = sample(line, x, 0);
        data[o] = palette[i * 3]; data[o + 1] = palette[i * 3 + 1]; data[o + 2] = palette[i * 3 + 2];
        data[o + 3] = trns && i < trns.length ? trns[i] : 255;
      } else if (colorType === 4) {
        const g = sample(line, x, 0);
        data[o] = data[o + 1] = data[o + 2] = g; data[o + 3] = sample(line, x, 1);
      } else {
        const g = Math.round(sample(line, x, 0) * scale);
        data[o] = data[o + 1] = data[o + 2] = g; data[o + 3] = 255;
      }
    }
  }
  return { width, height, data, info: { ...info, crcErrors } };
}

export function encodePng({ width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) Buffer.from(data.buffer, data.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  const chunk = (type, body) => {
    const head = Buffer.alloc(8); head.writeUInt32BE(body.length, 0); head.write(type, 4, 'latin1');
    const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0);
    return Buffer.concat([head, body, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([SIG, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
