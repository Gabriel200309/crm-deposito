"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export type ActionState = { success: boolean; error?: string };

const driverSchema = z.object({
  userId: z.string().min(1, "Selecione um usuário"),
  phone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  vehicleModel: z.string().optional(),
});

function parseDriverForm(formData: FormData) {
  return driverSchema.safeParse({
    userId: formData.get("userId"),
    phone: formData.get("phone") || undefined,
    vehiclePlate: formData.get("vehiclePlate") || undefined,
    vehicleModel: formData.get("vehicleModel") || undefined,
  });
}

export async function createDriverAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.MOTORISTAS, PermissionAction.CREATE);

  const parsed = parseDriverForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const existing = await prisma.driver.findUnique({ where: { userId: parsed.data.userId } });
  if (existing) {
    return { success: false, error: "Este usuário já tem um perfil de motorista" };
  }

  const created = await prisma.driver.create({
    data: {
      userId: parsed.data.userId,
      phone: parsed.data.phone || null,
      vehiclePlate: parsed.data.vehiclePlate || null,
      vehicleModel: parsed.data.vehicleModel || null,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "driver.create",
    entityType: "Driver",
    entityId: created.id,
  });

  revalidatePath("/motoristas");
  redirect("/motoristas");
}

export async function updateDriverAction(
  driverId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.MOTORISTAS, PermissionAction.EDIT);

  const parsed = parseDriverForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const updated = await prisma.driver.update({
    where: { id: driverId },
    data: {
      phone: parsed.data.phone || null,
      vehiclePlate: parsed.data.vehiclePlate || null,
      vehicleModel: parsed.data.vehicleModel || null,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "driver.update",
    entityType: "Driver",
    entityId: updated.id,
  });

  revalidatePath("/motoristas");
  redirect("/motoristas");
}

export async function toggleDriverActiveAction(driverId: string) {
  const actor = await requirePermission(MODULES.MOTORISTAS, PermissionAction.DELETE);

  const target = await prisma.driver.findUniqueOrThrow({ where: { id: driverId } });
  const updated = await prisma.driver.update({
    where: { id: driverId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "driver.activate" : "driver.deactivate",
    entityType: "Driver",
    entityId: driverId,
  });

  revalidatePath("/motoristas");
}
