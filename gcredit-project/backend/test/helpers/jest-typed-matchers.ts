/**
 * Typed wrappers for Jest asymmetric matchers.
 *
 * Jest's `expect.any()`, `expect.objectContaining()`, and `expect.stringContaining()`
 * all return `any` in @types/jest, which triggers `@typescript-eslint/no-unsafe-assignment`
 * whenever they appear inside object literals. These helpers narrow the return type
 * so the rest of the codebase stays eslint-clean without per-line disables.
 */

/* eslint-disable @typescript-eslint/no-unsafe-return */

/** expect.any(Date) → typed as Date */
export function anyDate(): Date {
  return expect.any(Date);
}

/** expect.any(String) → typed as string */
export function anyString(): string {
  return expect.any(String);
}

/** expect.any(Number) → typed as number */
export function anyNumber(): number {
  return expect.any(Number);
}

/** expect.any(Object) → typed as Record<string, unknown> */
export function anyObject(): Record<string, unknown> {
  return expect.any(Object);
}

/** expect.objectContaining({...}) → typed as T */
export function containing<T extends Record<string, unknown>>(obj: T): T {
  return expect.objectContaining(obj);
}

/** expect.arrayContaining([...]) → typed as T[] */
export function arrayContaining<T>(arr: T[]): T[] {
  return expect.arrayContaining(arr);
}

/** expect.stringContaining(s) → typed as string */
export function strContaining(s: string): string {
  return expect.stringContaining(s);
}

/* eslint-enable @typescript-eslint/no-unsafe-return */
