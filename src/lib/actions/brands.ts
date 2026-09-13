"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export type ActionState = { success: boolean; error?: string };

const brandSchema = z.object({
  name: z.string().min(2, "Informe o nome da marca"),
});

export async function createBrandAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.CREATE);

  const parsed = brandSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.brand.findUnique({ where: { name: parsed.data.name } });
  if (existing) {
    return { success: false, error: "Já existe uma marca com esse nome" };
  }

  const created = await prisma.brand.create({ data: { name: parsed.data.name } });

  await logAudit({ userId: actor.id, action: "brand.create", entityType: "Brand", entityId: created.id });

  revalidatePath("/produtos/marcas");
  return { success: true };
}

export async function toggleBrandActiveAction(brandId: string) {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.DELETE);

  const target = await prisma.brand.findUniqueOrThrow({ where: { id: brandId } });
  const updated = await prisma.brand.update({
    where: { id: brandId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "brand.activate" : "brand.deactivate",
    entityType: "Brand",
    entityId: brandId,
  });

  revalidatePath("/produtos/marcas");
}
