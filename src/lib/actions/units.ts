"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export type ActionState = { success: boolean; error?: string };

const unitSchema = z.object({
  code: z.string().min(1, "Informe o código").max(10, "Máximo de 10 caracteres"),
  label: z.string().min(2, "Informe o nome da unidade"),
});

export async function createUnitAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.CREATE);

  const parsed = unitSchema.safeParse({
    code: (formData.get("code") as string | null)?.toUpperCase(),
    label: formData.get("label"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.unit.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return { success: false, error: "Já existe uma unidade com esse código" };
  }

  const created = await prisma.unit.create({ data: parsed.data });

  await logAudit({ userId: actor.id, action: "unit.create", entityType: "Unit", entityId: created.id });

  revalidatePath("/produtos/unidades");
  return { success: true };
}

export async function toggleUnitActiveAction(unitId: string) {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.DELETE);

  const target = await prisma.unit.findUniqueOrThrow({ where: { id: unitId } });
  const updated = await prisma.unit.update({
    where: { id: unitId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "unit.activate" : "unit.deactivate",
    entityType: "Unit",
    entityId: unitId,
  });

  revalidatePath("/produtos/unidades");
}
