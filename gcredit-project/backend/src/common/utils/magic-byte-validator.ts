export interface MagicByteResult {
  detected: string | null;
  isValid: boolean;
}

const SIGNATURES: { mime: string; bytes: number[]; offset?: number }[] = [
  {
    mime: 'image/png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 }, // RIFF
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    bytes: [0x50, 0x4b, 0x03, 0x04], // PK (ZIP-based)
  },
];

export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0;
    if (buffer.length < offset + sig.bytes.length) continue;
    const match = sig.bytes.every((b, i) => buffer[offset + i] === b);
    if (match) {
      // WebP needs additional RIFF+WEBP check
      if (sig.mime === 'image/webp') {
        if (buffer.length < 12) continue;
        const webpTag = buffer.slice(8, 12).toString('ascii');
        if (webpTag !== 'WEBP') continue;
      }
      return sig.mime;
    }
  }
  return null;
}

export function validateMagicBytes(
  buffer: Buffer,
  declaredMime: string,
  allowedMimes: string[],
): MagicByteResult {
  const detected = detectMimeFromBuffer(buffer);

  const normalize = (m: string) => m.replace('image/jpg', 'image/jpeg');
  const normalizedDeclared = normalize(declaredMime);
  const normalizedDetected = detected ? normalize(detected) : null;

  const isValid =
    normalizedDetected !== null &&
    normalizedDetected === normalizedDeclared &&
    allowedMimes.map(normalize).includes(normalizedDetected);

  return { detected: normalizedDetected, isValid };
}
