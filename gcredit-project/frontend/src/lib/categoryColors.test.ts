import { describe, it, expect } from 'vitest';
import {
  getCategoryColorClasses,
  COLOR_MAP,
  DEFAULT_COLOR,
  CATEGORY_COLORS,
} from './categoryColors';

describe('categoryColors', () => {
  it('should return correct classes for each defined color', () => {
    for (const color of CATEGORY_COLORS) {
      const result = getCategoryColorClasses(color);
      expect(result).toEqual(COLOR_MAP[color]);
      expect(result.bg).toContain(`bg-${color}-`);
      expect(result.text).toContain(`text-${color}-`);
      expect(result.border).toContain(`border-${color}-`);
    }
  });

  it('should return default (slate) classes for null', () => {
    const result = getCategoryColorClasses(null);
    expect(result).toEqual(COLOR_MAP[DEFAULT_COLOR]);
  });

  it('should return default (slate) classes for undefined', () => {
    const result = getCategoryColorClasses(undefined);
    expect(result).toEqual(COLOR_MAP[DEFAULT_COLOR]);
  });

  it('should return default (slate) classes for unknown color string', () => {
    const result = getCategoryColorClasses('nonexistent');
    expect(result).toEqual(COLOR_MAP[DEFAULT_COLOR]);
  });

  it('should have 10 colors in the palette', () => {
    expect(CATEGORY_COLORS).toHaveLength(10);
  });

  it('should have COLOR_MAP entries for all CATEGORY_COLORS', () => {
    for (const color of CATEGORY_COLORS) {
      expect(COLOR_MAP[color]).toBeDefined();
    }
  });
});
