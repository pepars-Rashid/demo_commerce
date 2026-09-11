// Pure depth computation for the fixed 3-level category tree (Level 1 → 3).
// Lives OUTSIDE any "use server" file so both server pages and client guards can
// import it freely. Depth is computed server-side (it derives from DB data);
// the resulting `depth` field is handed to client forms, where the max-depth
// guard actually runs in the browser before any server action fires.

export interface CategoryDepthRow {
  id: number;
  categoryName: string;
  parentCategoryId: number | null;
}

export interface CategoryOption {
  id: number;
  categoryName: string;
  depth: number;
}

// Max tree depth is 3, so a per-node upward walk needs at most 2 hops.
// This is a bounded walk, not a recursive traversal — safe at our fixed depth.
export function withCategoryDepth(
  rows: CategoryDepthRow[],
): CategoryOption[] {
  const parentOf = new Map<number, number>();
  for (const r of rows) {
    if (r.parentCategoryId != null) parentOf.set(r.id, r.parentCategoryId);
  }

  return rows.map((r) => {
    let depth = 1;
    let current = r.id;
    const seen = new Set<number>();

    for (let hop = 0; hop < 2; hop++) {
      if (!parentOf.has(current) || seen.has(current)) break;
      seen.add(current);
      current = parentOf.get(current)!;
      depth++;
    }

    return { id: r.id, categoryName: r.categoryName, depth };
  });
}