export type FlatCategory = { id: string; name: string; parentId: string | null };

/** Achata a árvore de categorias em ordem de exibição (pai antes dos filhos), com profundidade. */
export function flattenCategoryTree(categories: FlatCategory[]) {
  const byParent = new Map<string | null, FlatCategory[]>();
  for (const category of categories) {
    const list = byParent.get(category.parentId) ?? [];
    list.push(category);
    byParent.set(category.parentId, list);
  }

  const result: { id: string; name: string; depth: number }[] = [];
  function visit(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const child of children) {
      result.push({ id: child.id, name: child.name, depth });
      visit(child.id, depth + 1);
    }
  }
  visit(null, 0);
  return result;
}
