"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { ActivityType } from "@/generated/prisma/client";

export type ActionState = { success: boolean; error?: string };

const activitySchema = z.object({
  type: z.enum(ActivityType),
  description: z.string().min(2, "Descreva a atividade"),
  dueDate: z.string().optional(),
});

export async function createActivityAction(
  scope: { customerId: string } | { leadId: string },
  revalidateTo: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const moduleName = "customerId" in scope ? MODULES.CLIENTES : MODULES.LEADS;
  const actor = await requirePermission(moduleName, PermissionAction.EDIT);

  const parsed = activitySchema.safeParse({
    type: formData.get("type"),
    description: formData.get("description"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const created = await prisma.activity.create({
    data: {
      ...scope,
      type: parsed.data.type,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      createdById: actor.id,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "activity.create",
    entityType: "Activity",
    entityId: created.id,
    changes: scope,
  });

  revalidatePath(revalidateTo);
  return { success: true };
}

export async function toggleActivityDoneAction(
  activityId: string,
  revalidateTo: string,
  module: (typeof MODULES)[keyof typeof MODULES],
) {
  const actor = await requirePermission(module, PermissionAction.EDIT);

  const activity = await prisma.activity.findUniqueOrThrow({ where: { id: activityId } });
  const updated = await prisma.activity.update({
    where: { id: activityId },
    data: { completedAt: activity.completedAt ? null : new Date() },
  });

  await logAudit({
    userId: actor.id,
    action: updated.completedAt ? "activity.complete" : "activity.reopen",
    entityType: "Activity",
    entityId: activityId,
  });

  revalidatePath(revalidateTo);
}
