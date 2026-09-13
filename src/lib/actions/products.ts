"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { ProductOrigin } from "@/generated/prisma/enums";

export type ActionState = { success: boolean; error?: string };

const decimalField = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v : undefined));

const productSchema = z.object({
  internalCode: z.string().min(1, "Informe o código interno"),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  name: z.string().min(2, "Informe o nome do produto"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  brandId: z.string().optional(),
  unitId: z.string().min(1, "Selecione uma unidade"),
  weight: decimalField,
  lengthCm: decimalField,
  widthCm: decimalField,
  heightCm: decimalField,
  costPrice: decimalField,
  salePrice: z.string().min(1, "Informe o preço de venda"),
  promoPrice: decimalField,
  minStock: decimalField,
  maxStock: decimalField,
  warehouseLocation: z.string().optional(),
  supplierName: z.string().optional(),
  ncm: z.string().optional(),
  cest: z.string().optional(),
  cfop: z.string().optional(),
  cstCsosn: z.string().optional(),
  origin: z.enum(ProductOrigin),
  icmsRate: decimalField,
});

function parseProductForm(formData: FormData) {
  return productSchema.safeParse({
    internalCode: formData.get("internalCode"),
    sku: formData.get("sku") || undefined,
    barcode: formData.get("barcode") || undefined,
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    brandId: (formData.get("brandId") as string | null) || undefined,
    unitId: formData.get("unitId"),
    weight: formData.get("weight") || undefined,
    lengthCm: formData.get("lengthCm") || undefined,
    widthCm: formData.get("widthCm") || undefined,
    heightCm: formData.get("heightCm") || undefined,
    costPrice: formData.get("costPrice") || undefined,
    salePrice: formData.get("salePrice"),
    promoPrice: formData.get("promoPrice") || undefined,
    minStock: formData.get("minStock") || undefined,
    maxStock: formData.get("maxStock") || undefined,
    warehouseLocation: formData.get("warehouseLocation") || undefined,
    supplierName: formData.get("supplierName") || undefined,
    ncm: formData.get("ncm") || undefined,
    cest: formData.get("cest") || undefined,
    cfop: formData.get("cfop") || undefined,
    cstCsosn: formData.get("cstCsosn") || undefined,
    origin: formData.get("origin"),
    icmsRate: formData.get("icmsRate") || undefined,
  });
}

function toProductData(data: z.infer<typeof productSchema>) {
  const brandId = data.brandId === "none" ? undefined : data.brandId;
  return {
    internalCode: data.internalCode,
    sku: data.sku || null,
    barcode: data.barcode || null,
    name: data.name,
    description: data.description || null,
    categoryId: data.categoryId,
    brandId: brandId || null,
    unitId: data.unitId,
    weight: data.weight ?? null,
    lengthCm: data.lengthCm ?? null,
    widthCm: data.widthCm ?? null,
    heightCm: data.heightCm ?? null,
    costPrice: data.costPrice ?? "0",
    salePrice: data.salePrice,
    promoPrice: data.promoPrice ?? null,
    minStock: data.minStock ?? null,
    maxStock: data.maxStock ?? null,
    warehouseLocation: data.warehouseLocation || null,
    supplierName: data.supplierName || null,
    ncm: data.ncm || null,
    cest: data.cest || null,
    cfop: data.cfop || null,
    cstCsosn: data.cstCsosn || null,
    origin: data.origin,
    icmsRate: data.icmsRate ?? null,
  };
}

async function checkUniqueFields(
  data: ReturnType<typeof toProductData>,
  excludeId?: string,
) {
  if (data.internalCode) {
    const existing = await prisma.product.findUnique({ where: { internalCode: data.internalCode } });
    if (existing && existing.id !== excludeId) return "Já existe um produto com esse código interno";
  }
  if (data.sku) {
    const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existing && existing.id !== excludeId) return "Já existe um produto com esse SKU";
  }
  if (data.barcode) {
    const existing = await prisma.product.findUnique({ where: { barcode: data.barcode } });
    if (existing && existing.id !== excludeId) return "Já existe um produto com esse código de barras";
  }
  return null;
}

export async function createProductAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.CREATE);

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = toProductData(parsed.data);
  const uniqueError = await checkUniqueFields(data);
  if (uniqueError) return { success: false, error: uniqueError };

  const created = await prisma.product.create({ data });

  await logAudit({
    userId: actor.id,
    action: "product.create",
    entityType: "Product",
    entityId: created.id,
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function updateProductAction(
  productId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.EDIT);

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = toProductData(parsed.data);
  const uniqueError = await checkUniqueFields(data, productId);
  if (uniqueError) return { success: false, error: uniqueError };

  const updated = await prisma.product.update({ where: { id: productId }, data });

  await logAudit({
    userId: actor.id,
    action: "product.update",
    entityType: "Product",
    entityId: updated.id,
  });

  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function toggleProductActiveAction(productId: string) {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.DELETE);

  const target = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "product.activate" : "product.deactivate",
    entityType: "Product",
    entityId: productId,
  });

  revalidatePath("/produtos");
}
