import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { updateProductAction } from "@/lib/actions/products";
import { flattenCategoryTree } from "@/lib/category-tree";
import { ProductForm } from "../../product-form";

function decimalToInput(value: { toString(): string } | null | undefined) {
  if (value === null || value === undefined) return null;
  const str = value.toString();
  return str === "0" ? null : str;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.PRODUTOS, PermissionAction.EDIT);
  const { id } = await params;

  const [product, categories, brands, units] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.unit.findMany({ orderBy: { code: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar produto</h1>
      </div>
      <ProductForm
        action={updateProductAction.bind(null, product.id)}
        categories={flattenCategoryTree(categories)}
        brands={brands}
        units={units}
        mode="edit"
        defaultValues={{
          internalCode: product.internalCode,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          brandId: product.brandId,
          unitId: product.unitId,
          weight: decimalToInput(product.weight),
          lengthCm: decimalToInput(product.lengthCm),
          widthCm: decimalToInput(product.widthCm),
          heightCm: decimalToInput(product.heightCm),
          costPrice: decimalToInput(product.costPrice),
          salePrice: product.salePrice.toString(),
          promoPrice: decimalToInput(product.promoPrice),
          currentStock: product.currentStock.toString(),
          minStock: decimalToInput(product.minStock),
          maxStock: decimalToInput(product.maxStock),
          warehouseLocation: product.warehouseLocation,
          supplierName: product.supplierName,
          ncm: product.ncm,
          cest: product.cest,
          cfop: product.cfop,
          cstCsosn: product.cstCsosn,
          origin: product.origin,
          icmsRate: decimalToInput(product.icmsRate),
        }}
      />
    </div>
  );
}
