"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { PaymentMethod } from "@/generated/prisma/enums";

export type ActionState = { success: boolean; error?: string };

const paymentSchema = z.object({
  amount: z.string().min(1, "Informe o valor"),
  paymentMethod: z.enum(PaymentMethod),
  notes: z.string().optional(),
});

export async function registerReceivablePaymentAction(
  receivableId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.FINANCEIRO, PermissionAction.EDIT);

  const parsed = paymentSchema.safeParse({
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const amount = Number(parsed.data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Valor deve ser maior que zero" };
  }

  const receivable = await prisma.accountsReceivable.findUnique({
    where: { id: receivableId },
    include: { payments: true },
  });
  if (!receivable) return { success: false, error: "Conta a receber não encontrada" };
  if (receivable.cancelled) return { success: false, error: "Esta conta está cancelada" };

  const alreadyPaid = receivable.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(receivable.amount) - alreadyPaid;
  if (amount > remaining + 0.01) {
    return { success: false, error: `Valor maior que o saldo em aberto (${remaining.toFixed(2)})` };
  }

  await prisma.receivablePayment.create({
    data: {
      receivableId,
      amount: parsed.data.amount,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes || null,
      createdById: actor.id,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "receivable.payment",
    entityType: "AccountsReceivable",
    entityId: receivableId,
    changes: { amount: parsed.data.amount, paymentMethod: parsed.data.paymentMethod },
  });

  revalidatePath("/financeiro/receber");
  revalidatePath("/financeiro/fluxo-caixa");
  revalidatePath(`/pedidos/${receivable.orderId}`);
  return { success: true };
}

export async function cancelReceivableAction(receivableId: string, reason?: string) {
  const actor = await requirePermission(MODULES.FINANCEIRO, PermissionAction.DELETE);

  const updated = await prisma.accountsReceivable.update({
    where: { id: receivableId },
    data: { cancelled: true, cancelReason: reason || null },
  });

  await logAudit({
    userId: actor.id,
    action: "receivable.cancel",
    entityType: "AccountsReceivable",
    entityId: receivableId,
    changes: { reason },
  });

  revalidatePath("/financeiro/receber");
  revalidatePath(`/pedidos/${updated.orderId}`);
}
