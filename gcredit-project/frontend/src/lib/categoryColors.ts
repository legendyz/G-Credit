/**
 * Category Color System — Story 12.2
 *
 * Maps Tailwind color names to CSS classes for skill tag pills.
 * Colors are assigned to SkillCategory (not individual skills).
 */

export const CATEGORY_COLORS = [
  'slate',
  'blue',
  'emerald',
  'amber',
  'rose',
  'violet',
  'cyan',
  'orange',
  'pink',
  'lime',
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/**
 * Tailwind class map for each color: { bg, text, border }
 * Uses Tailwind v4 classes (no JIT safelist needed — classes are statically defined here).
 */
export const COLOR_MAP: Record<CategoryColor, { bg: string; text: string; border: string }> = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-300' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  lime: { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-300' },
};

/** Default fallback when category has no color */
export const DEFAULT_COLOR: CategoryColor = 'slate';

/**
 * Get Tailwind classes for a category color.
 * Safely falls back to slate for null/unknown values.
 */
export function getCategoryColorClasses(color?: string | null) {
  return COLOR_MAP[(color as CategoryColor) ?? DEFAULT_COLOR] ?? COLOR_MAP[DEFAULT_COLOR];
}
