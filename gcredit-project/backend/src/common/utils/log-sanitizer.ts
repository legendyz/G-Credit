/**
 * Mask email for logging: john.doe@company.com → j***@company.com
 * Preserves first character + full domain for debugging
 */
export function maskEmailForLog(email: string): string {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local[0]}***@${domain}`;
}

/**
 * Mask user identifier for logging
 * Prefer user ID (UUID), fallback to masked email
 */
export function safeUserRef(user: {
  id?: string;
  email?: string;
}): string {
  if (user.id) return `user:${user.id}`;
  if (user.email) return maskEmailForLog(user.email);
  return 'unknown-user';
}
