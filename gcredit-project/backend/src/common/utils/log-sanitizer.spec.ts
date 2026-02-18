import { maskEmailForLog, safeUserRef } from './log-sanitizer';

describe('log-sanitizer', () => {
  describe('maskEmailForLog', () => {
    it('should mask normal email', () => {
      expect(maskEmailForLog('john@example.com')).toBe('j***@example.com');
    });

    it('should mask single-char local part', () => {
      expect(maskEmailForLog('a@b.com')).toBe('a***@b.com');
    });

    it('should handle empty string', () => {
      expect(maskEmailForLog('')).toBe('***');
    });

    it('should handle null/undefined', () => {
      expect(maskEmailForLog(null as unknown as string)).toBe('***');
      expect(maskEmailForLog(undefined as unknown as string)).toBe('***');
    });

    it('should handle string without @', () => {
      expect(maskEmailForLog('notanemail')).toBe('***');
    });

    it('should mask complex email', () => {
      expect(maskEmailForLog('user.name+tag@company.co.uk')).toBe(
        'u***@company.co.uk',
      );
    });
  });

  describe('safeUserRef', () => {
    it('should prefer user ID when available', () => {
      expect(safeUserRef({ id: 'uuid-123', email: 'x@y.com' })).toBe(
        'user:uuid-123',
      );
    });

    it('should fallback to masked email when no ID', () => {
      expect(safeUserRef({ email: 'x@y.com' })).toBe('x***@y.com');
    });

    it('should return unknown-user when no ID or email', () => {
      expect(safeUserRef({})).toBe('unknown-user');
    });
  });
});
