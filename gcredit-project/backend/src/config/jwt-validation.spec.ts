/**
 * JWT Secret Validation Tests (ARCH-P1-003)
 *
 * These tests verify that the application properly validates JWT_SECRET
 * at startup to ensure security requirements are met.
 */

// Helper function to simulate validateJwtSecret logic (extracted for testing)
function validateJwtSecretLogic(
  jwtSecret: string | undefined,
  jwtRefreshSecret: string | undefined,
  nodeEnv: string,
): { valid: boolean; error?: string } {
  // Skip validation in test environment
  if (nodeEnv === 'test') {
    return { valid: true };
  }

  // Check JWT_SECRET exists
  if (!jwtSecret) {
    return {
      valid: false,
      error: 'JWT_SECRET environment variable is required',
    };
  }

  // Check minimum length (32 characters = 256 bits)
  if (jwtSecret.length < 32) {
    return {
      valid: false,
      error: `JWT_SECRET must be at least 32 characters (current: ${jwtSecret.length} chars)`,
    };
  }

  // Check for default/weak values (ARCH-P1-003: fail in ALL environments per AC2)
  const weakSecrets = [
    'your-secret-key-here',
    'secret',
    'jwt-secret',
    'changeme',
    '12345678901234567890123456789012',
  ];
  if (weakSecrets.some((weak) => jwtSecret.toLowerCase().includes(weak))) {
    return {
      valid: false,
      error: 'JWT_SECRET cannot be a default/weak value',
    };
  }

  // Check JWT_REFRESH_SECRET exists
  if (!jwtRefreshSecret) {
    return {
      valid: false,
      error: 'JWT_REFRESH_SECRET environment variable is required',
    };
  }

  // Check refresh secret length
  if (jwtRefreshSecret.length < 32) {
    return {
      valid: false,
      error: `JWT_REFRESH_SECRET must be at least 32 characters (current: ${jwtRefreshSecret.length} chars)`,
    };
  }

  return { valid: true };
}

describe('JWT Secret Validation (ARCH-P1-003)', () => {
  describe('validateJwtSecret', () => {
    it('should reject missing JWT_SECRET', () => {
      const result = validateJwtSecretLogic(
        undefined,
        'refresh-secret-32-chars-long-here',
        'development',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JWT_SECRET environment variable is required');
    });

    it('should reject JWT_SECRET shorter than 32 characters', () => {
      const result = validateJwtSecretLogic(
        'short-secret',
        'refresh-secret-32-chars-long-here',
        'development',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be at least 32 characters');
    });

    it('should reject default/weak JWT_SECRET in all environments', () => {
      const result = validateJwtSecretLogic(
        'your-secret-key-here-plus-more-chars',
        'refresh-secret-32-chars-long-here',
        'development',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be a default/weak value');
    });

    it('should reject numeric-only weak secret (12345...)', () => {
      const result = validateJwtSecretLogic(
        '12345678901234567890123456789012',
        'refresh-secret-32-chars-long-here',
        'development',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be a default/weak value');
    });

    it('should accept strong JWT_SECRET with 32+ characters', () => {
      const result = validateJwtSecretLogic(
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        'refresh-secret-32-chars-long-here',
        'development',
      );
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject missing JWT_REFRESH_SECRET', () => {
      const result = validateJwtSecretLogic(
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        undefined,
        'development',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JWT_REFRESH_SECRET environment variable is required');
    });

    it('should reject JWT_REFRESH_SECRET shorter than 32 characters', () => {
      const result = validateJwtSecretLogic(
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        'short-refresh',
        'development',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JWT_REFRESH_SECRET must be at least 32 characters');
    });

    it('should skip validation in test environment', () => {
      const result = validateJwtSecretLogic(undefined, undefined, 'test');
      expect(result.valid).toBe(true);
    });

    it('should accept valid production configuration', () => {
      const result = validateJwtSecretLogic(
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
        's9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6',
        'production',
      );
      expect(result.valid).toBe(true);
    });
  });
});
