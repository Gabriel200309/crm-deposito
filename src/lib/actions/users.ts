"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export type ActionState = { success: boolean; error?: string };

const createUserSchema = z.object({
  name: z.string().min(2, "Informe o nome completo"),
  email: z.email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter ao menos 8 caracteres"),
  roleId: z.string().min(1, "Selecione um perfil"),
});

const updateUserSchema = z.object({
  name: z.string().min(2, "Informe o nome completo"),
  email: z.email("E-mail inválido"),
  roleId: z.string().min(1, "Selecione um perfil"),
});

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.USUARIOS, PermissionAction.CREATE);

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { success: false, error: "Já existe um usuário com este e-mail" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const created = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      roleId: parsed.data.roleId,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "user.create",
    entityType: "User",
    entityId: created.id,
    changes: { name: created.name, email: created.email, roleId: created.roleId },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function updateUserAction(
  userId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.USUARIOS, PermissionAction.EDIT);

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing && existing.id !== userId) {
    return { success: false, error: "Já existe um usuário com este e-mail" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      roleId: parsed.data.roleId,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "user.update",
    entityType: "User",
    entityId: updated.id,
    changes: { name: updated.name, email: updated.email, roleId: updated.roleId },
  });

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function toggleUserActiveAction(userId: string) {
  const actor = await requirePermission(MODULES.USUARIOS, PermissionAction.DELETE);

  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "user.activate" : "user.deactivate",
    entityType: "User",
    entityId: updated.id,
  });

  revalidatePath("/usuarios");
}
