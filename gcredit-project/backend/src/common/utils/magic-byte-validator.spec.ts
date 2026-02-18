import {
  detectMimeFromBuffer,
  validateMagicBytes,
} from './magic-byte-validator';

describe('magic-byte-validator', () => {
  describe('detectMimeFromBuffer', () => {
    it('should detect JPEG', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(detectMimeFromBuffer(buf)).toBe('image/jpeg');
    });

    it('should detect PNG', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(detectMimeFromBuffer(buf)).toBe('image/png');
    });

    it('should detect WebP', () => {
      // RIFF....WEBP
      const buf = Buffer.alloc(12);
      buf[0] = 0x52;
      buf[1] = 0x49;
      buf[2] = 0x46;
      buf[3] = 0x46;
      buf.write('WEBP', 8, 4, 'ascii');
      expect(detectMimeFromBuffer(buf)).toBe('image/webp');
    });

    it('should detect GIF', () => {
      const buf = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
      expect(detectMimeFromBuffer(buf)).toBe('image/gif');
    });

    it('should detect PDF', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
      expect(detectMimeFromBuffer(buf)).toBe('application/pdf');
    });

    it('should detect DOCX (ZIP header)', () => {
      const buf = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]);
      expect(detectMimeFromBuffer(buf)).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
    });

    it('should return null for empty buffer', () => {
      expect(detectMimeFromBuffer(Buffer.alloc(0))).toBeNull();
    });

    it('should return null for unknown signature', () => {
      const buf = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      expect(detectMimeFromBuffer(buf)).toBeNull();
    });

    it('should reject RIFF without WEBP tag', () => {
      const buf = Buffer.alloc(12);
      buf[0] = 0x52;
      buf[1] = 0x49;
      buf[2] = 0x46;
      buf[3] = 0x46;
      buf.write('AVI ', 8, 4, 'ascii');
      expect(detectMimeFromBuffer(buf)).toBeNull();
    });
  });

  describe('validateMagicBytes', () => {
    it('should validate matching JPEG', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const result = validateMagicBytes(buf, 'image/jpeg', [
        'image/jpeg',
        'image/png',
      ]);
      expect(result.isValid).toBe(true);
      expect(result.detected).toBe('image/jpeg');
    });

    it('should validate matching PNG', () => {
      const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      const result = validateMagicBytes(buf, 'image/png', [
        'image/jpeg',
        'image/png',
      ]);
      expect(result.isValid).toBe(true);
      expect(result.detected).toBe('image/png');
    });

    it('should reject spoofed file (JPEG content with PNG mime)', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const result = validateMagicBytes(buf, 'image/png', [
        'image/jpeg',
        'image/png',
      ]);
      expect(result.isValid).toBe(false);
      expect(result.detected).toBe('image/jpeg');
    });

    it('should reject plain text with JPEG mime', () => {
      const buf = Buffer.from('Hello, this is a text file');
      const result = validateMagicBytes(buf, 'image/jpeg', ['image/jpeg']);
      expect(result.isValid).toBe(false);
      expect(result.detected).toBeNull();
    });

    it('should reject empty buffer', () => {
      const result = validateMagicBytes(Buffer.alloc(0), 'image/jpeg', [
        'image/jpeg',
      ]);
      expect(result.isValid).toBe(false);
      expect(result.detected).toBeNull();
    });

    it('should validate PDF', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
      const result = validateMagicBytes(buf, 'application/pdf', [
        'application/pdf',
        'image/png',
      ]);
      expect(result.isValid).toBe(true);
      expect(result.detected).toBe('application/pdf');
    });

    it('should normalize image/jpg to image/jpeg', () => {
      const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const result = validateMagicBytes(buf, 'image/jpg', [
        'image/jpg',
        'image/png',
      ]);
      expect(result.isValid).toBe(true);
      expect(result.detected).toBe('image/jpeg');
    });

    it('should reject allowed mime but not in allowed list', () => {
      const buf = Buffer.from([0x25, 0x50, 0x44, 0x46]); // PDF
      const result = validateMagicBytes(buf, 'application/pdf', [
        'image/jpeg',
        'image/png',
      ]);
      expect(result.isValid).toBe(false);
    });
  });
});
