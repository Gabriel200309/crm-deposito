"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission, getDriverScope } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { DeliveryStatus, OrderStatus } from "@/generated/prisma/enums";

export type ActionState = { success: boolean; error?: string };

const OPEN_STATUSES: DeliveryStatus[] = [DeliveryStatus.AGENDADA, DeliveryStatus.EM_ROTA, DeliveryStatus.FALHOU];

/** Confere se o ator pode operar esta entrega: despachante vê/mexe em tudo, motorista só na sua própria. */
async function assertDriverAccess(deliveryId: string, actor: { roleId: string; id: string }) {
  const scope = await getDriverScope(actor.roleId, actor.id);
  if (scope.type === "none") {
    return { ok: false as const, error: "Você não tem um perfil de motorista associado." };
  }
  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return { ok: false as const, error: "Entrega não encontrada." };
  if (scope.type === "own" && delivery.driverId !== scope.driverId) {
    return { ok: false as const, error: "Esta entrega não está atribuída a você." };
  }
  return { ok: true as const, delivery, scope };
}

const scheduleSchema = z.object({
  driverId: z.string().optional(),
  scheduledDate: z.string().optional(),
});

/** Agenda/reagenda: define motorista e data. Só o despachante (quem pode cancelar entregas) pode usar. */
export async function scheduleDeliveryAction(
  deliveryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.ENTREGAS, PermissionAction.EDIT);
  const scope = await getDriverScope(actor.roleId, actor.id);
  if (scope.type !== "all") {
    return { success: false, error: "Apenas quem despacha entregas pode atribuir motorista e data." };
  }

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return { success: false, error: "Entrega não encontrada" };
  if (!OPEN_STATUSES.includes(delivery.status)) {
    return { success: false, error: "Esta entrega já foi concluída ou cancelada" };
  }

  const parsed = scheduleSchema.safeParse({
    driverId: formData.get("driverId") || undefined,
    scheduledDate: formData.get("scheduledDate") || undefined,
  });
  if (!parsed.success) return { success: false, error: "Dados inválidos" };

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: {
      driverId: parsed.data.driverId && parsed.data.driverId !== "none" ? parsed.data.driverId : null,
      scheduledDate: parsed.data.scheduledDate ? new Date(parsed.data.scheduledDate) : null,
      // Reagendar uma entrega que tinha falhado a reabre para uma nova tentativa.
      status: delivery.status === DeliveryStatus.FALHOU ? DeliveryStatus.AGENDADA : delivery.status,
      failureReason: delivery.status === DeliveryStatus.FALHOU ? null : delivery.failureReason,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "delivery.schedule",
    entityType: "Delivery",
    entityId: deliveryId,
    changes: { driverId: parsed.data.driverId, scheduledDate: parsed.data.scheduledDate },
  });

  revalidatePath("/entregas");
  return { success: true };
}

export async function startRouteAction(deliveryId: string): Promise<ActionState> {
  const actor = await requirePermission(MODULES.ENTREGAS, PermissionAction.EDIT);
  const access = await assertDriverAccess(deliveryId, actor);
  if (!access.ok) return { success: false, error: access.error };
  if (access.delivery.status !== DeliveryStatus.AGENDADA) {
    return { success: false, error: "Só é possível iniciar rota de uma entrega agendada" };
  }

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: DeliveryStatus.EM_ROTA, startedAt: new Date() },
    }),
    prisma.order.update({
      where: { id: access.delivery.orderId },
      data: { status: OrderStatus.EM_TRANSPORTE },
    }),
  ]);

  await logAudit({
    userId: actor.id,
    action: "delivery.start_route",
    entityType: "Delivery",
    entityId: deliveryId,
  });

  revalidatePath("/entregas");
  revalidatePath(`/pedidos/${access.delivery.orderId}`);
  return { success: true };
}

const completeSchema = z.object({
  recipientName: z.string().optional(),
  notes: z.string().optional(),
});

export async function completeDeliveryAction(
  deliveryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.ENTREGAS, PermissionAction.EDIT);
  const access = await assertDriverAccess(deliveryId, actor);
  if (!access.ok) return { success: false, error: access.error };
  if (access.delivery.status !== DeliveryStatus.AGENDADA && access.delivery.status !== DeliveryStatus.EM_ROTA) {
    return { success: false, error: "Esta entrega não pode ser concluída neste estágio" };
  }

  const parsed = completeSchema.safeParse({
    recipientName: formData.get("recipientName") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { success: false, error: "Dados inválidos" };

  await prisma.$transaction([
    prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        status: DeliveryStatus.ENTREGUE,
        deliveredAt: new Date(),
        recipientName: parsed.data.recipientName || null,
        notes: parsed.data.notes || null,
      },
    }),
    prisma.order.update({
      where: { id: access.delivery.orderId },
      data: { status: OrderStatus.ENTREGUE },
    }),
  ]);

  await logAudit({
    userId: actor.id,
    action: "delivery.complete",
    entityType: "Delivery",
    entityId: deliveryId,
  });

  revalidatePath("/entregas");
  revalidatePath(`/pedidos/${access.delivery.orderId}`);
  return { success: true };
}

const failSchema = z.object({
  reason: z.string().min(1, "Descreva o motivo da falha"),
});

export async function failDeliveryAction(
  deliveryId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.ENTREGAS, PermissionAction.EDIT);
  const access = await assertDriverAccess(deliveryId, actor);
  if (!access.ok) return { success: false, error: access.error };
  if (access.delivery.status !== DeliveryStatus.AGENDADA && access.delivery.status !== DeliveryStatus.EM_ROTA) {
    return { success: false, error: "Esta entrega não pode ser marcada como falha neste estágio" };
  }

  const parsed = failSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Informe o motivo" };
  }

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: DeliveryStatus.FALHOU, failureReason: parsed.data.reason },
  });

  await logAudit({
    userId: actor.id,
    action: "delivery.fail",
    entityType: "Delivery",
    entityId: deliveryId,
    changes: { reason: parsed.data.reason },
  });

  revalidatePath("/entregas");
  return { success: true };
}

export async function cancelDeliveryAction(deliveryId: string, reason?: string): Promise<ActionState> {
  const actor = await requirePermission(MODULES.ENTREGAS, PermissionAction.DELETE);

  const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) return { success: false, error: "Entrega não encontrada" };
  if (delivery.status === DeliveryStatus.ENTREGUE || delivery.status === DeliveryStatus.CANCELADA) {
    return { success: false, error: "Esta entrega já está em um estágio final" };
  }

  await prisma.delivery.update({
    where: { id: deliveryId },
    data: { status: DeliveryStatus.CANCELADA, notes: reason || delivery.notes },
  });

  await logAudit({
    userId: actor.id,
    action: "delivery.cancel",
    entityType: "Delivery",
    entityId: deliveryId,
    changes: { reason },
  });

  revalidatePath("/entregas");
  return { success: true };
}
