/**
 * Sort a flat list of categories into tree-walk order (parent → children → grandchildren).
 * Supports up to 3 levels of nesting.
 */
export interface TreeSortableCategory {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  displayOrder: number;
}

/**
 * Sort flat categories into depth-first tree-walk order.
 * Returns categories ordered as: L1 parent → L2 children → L3 grandchildren → next L1 parent...
 */
export function sortCategoriesTreeWalk<T extends TreeSortableCategory>(categories: T[]): T[] {
  const byOrder = (a: T, b: T) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0);

  const roots = categories.filter((c) => c.level === 1).sort(byOrder);
  const childrenByParent = new Map<string, T[]>();

  for (const c of categories) {
    if (c.parentId) {
      const arr = childrenByParent.get(c.parentId) || [];
      arr.push(c);
      childrenByParent.set(c.parentId, arr);
    }
  }

  const result: T[] = [];
  for (const root of roots) {
    result.push(root);
    const l2Children = (childrenByParent.get(root.id) || []).sort(byOrder);
    for (const l2 of l2Children) {
      result.push(l2);
      const l3Children = (childrenByParent.get(l2.id) || []).sort(byOrder);
      result.push(...l3Children.sort(byOrder));
    }
  }

  return result;
}
