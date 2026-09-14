"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export type ActionState = { success: boolean; error?: string };

const decimalField = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== "" ? v : undefined));

const salespersonSchema = z.object({
  userId: z.string().min(1, "Selecione um usuário"),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  monthlyGoal: decimalField,
  commissionRate: z.string().min(1, "Informe o percentual de comissão"),
  team: z.string().optional(),
});

function parseSalespersonForm(formData: FormData) {
  return salespersonSchema.safeParse({
    userId: formData.get("userId"),
    cpf: formData.get("cpf") || undefined,
    phone: formData.get("phone") || undefined,
    monthlyGoal: formData.get("monthlyGoal") || undefined,
    commissionRate: formData.get("commissionRate"),
    team: formData.get("team") || undefined,
  });
}

export async function createSalespersonAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.VENDEDORES, PermissionAction.CREATE);

  const parsed = parseSalespersonForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.salesperson.findUnique({ where: { userId: parsed.data.userId } });
  if (existing) {
    return { success: false, error: "Este usuário já tem um perfil de vendedor" };
  }

  const created = await prisma.salesperson.create({
    data: {
      userId: parsed.data.userId,
      cpf: parsed.data.cpf || null,
      phone: parsed.data.phone || null,
      monthlyGoal: parsed.data.monthlyGoal ?? null,
      commissionRate: parsed.data.commissionRate,
      team: parsed.data.team || null,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "salesperson.create",
    entityType: "Salesperson",
    entityId: created.id,
  });

  revalidatePath("/vendedores");
  redirect("/vendedores");
}

export async function updateSalespersonAction(
  salespersonId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.VENDEDORES, PermissionAction.EDIT);

  const parsed = parseSalespersonForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const updated = await prisma.salesperson.update({
    where: { id: salespersonId },
    data: {
      cpf: parsed.data.cpf || null,
      phone: parsed.data.phone || null,
      monthlyGoal: parsed.data.monthlyGoal ?? null,
      commissionRate: parsed.data.commissionRate,
      team: parsed.data.team || null,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "salesperson.update",
    entityType: "Salesperson",
    entityId: updated.id,
  });

  revalidatePath("/vendedores");
  redirect("/vendedores");
}

export async function toggleSalespersonActiveAction(salespersonId: string) {
  const actor = await requirePermission(MODULES.VENDEDORES, PermissionAction.DELETE);

  const target = await prisma.salesperson.findUniqueOrThrow({ where: { id: salespersonId } });
  const updated = await prisma.salesperson.update({
    where: { id: salespersonId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "salesperson.activate" : "salesperson.deactivate",
    entityType: "Salesperson",
    entityId: salespersonId,
  });

  revalidatePath("/vendedores");
}
