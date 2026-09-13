"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export type ActionState = { success: boolean; error?: string };

const categorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria"),
  parentId: z.string().optional(),
  description: z.string().optional(),
});

export async function createCategoryAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.CREATE);

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    parentId: formData.get("parentId") || undefined,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const parentId = parsed.data.parentId === "none" ? null : (parsed.data.parentId ?? null);

  const existing = await prisma.category.findFirst({
    where: { parentId, name: parsed.data.name },
  });
  if (existing) {
    return { success: false, error: "Já existe uma categoria com esse nome nesse nível" };
  }

  const created = await prisma.category.create({
    data: { name: parsed.data.name, parentId, description: parsed.data.description || null },
  });

  await logAudit({
    userId: actor.id,
    action: "category.create",
    entityType: "Category",
    entityId: created.id,
  });

  revalidatePath("/produtos/categorias");
  return { success: true };
}

export async function toggleCategoryActiveAction(categoryId: string) {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.DELETE);

  const target = await prisma.category.findUniqueOrThrow({ where: { id: categoryId } });
  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "category.activate" : "category.deactivate",
    entityType: "Category",
    entityId: categoryId,
  });

  revalidatePath("/produtos/categorias");
}
