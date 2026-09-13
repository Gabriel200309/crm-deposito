import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { createProductAction } from "@/lib/actions/products";
import { flattenCategoryTree } from "@/lib/category-tree";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requirePermission(MODULES.PRODUTOS, PermissionAction.CREATE);

  const [categories, brands, units] = await Promise.all([
    prisma.category.findMany({ where: { active: true }, select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.unit.findMany({ where: { active: true }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo produto</h1>
        <p className="text-muted-foreground">Cadastre um produto do catálogo.</p>
      </div>
      <ProductForm
        action={createProductAction}
        categories={flattenCategoryTree(categories)}
        brands={brands}
        units={units}
        mode="create"
      />
    </div>
  );
}
