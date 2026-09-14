"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { PayableStatus, PaymentMethod } from "@/generated/prisma/enums";

export type ActionState = { success: boolean; error?: string };

const payableSchema = z.object({
  description: z.string().min(2, "Descreva a conta a pagar"),
  supplierName: z.string().optional(),
  dueDate: z.string().min(1, "Informe o vencimento"),
  amount: z.string().min(1, "Informe o valor"),
  paymentMethod: z.enum(PaymentMethod),
  notes: z.string().optional(),
});

export async function createPayableAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.FINANCEIRO, PermissionAction.CREATE);

  const parsed = payableSchema.safeParse({
    description: formData.get("description"),
    supplierName: formData.get("supplierName") || undefined,
    dueDate: formData.get("dueDate"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const created = await prisma.accountsPayable.create({
    data: {
      description: parsed.data.description,
      supplierName: parsed.data.supplierName || null,
      dueDate: new Date(parsed.data.dueDate),
      amount: parsed.data.amount,
      paymentMethod: parsed.data.paymentMethod,
      notes: parsed.data.notes || null,
      createdById: actor.id,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "payable.create",
    entityType: "AccountsPayable",
    entityId: created.id,
  });

  revalidatePath("/financeiro/pagar");
  return { success: true };
}

export async function markPayablePaidAction(payableId: string) {
  const actor = await requirePermission(MODULES.FINANCEIRO, PermissionAction.EDIT);

  const updated = await prisma.accountsPayable.update({
    where: { id: payableId },
    data: { status: PayableStatus.PAGO, paidAt: new Date() },
  });

  await logAudit({
    userId: actor.id,
    action: "payable.mark_paid",
    entityType: "AccountsPayable",
    entityId: updated.id,
  });

  revalidatePath("/financeiro/pagar");
}

export async function cancelPayableAction(payableId: string) {
  const actor = await requirePermission(MODULES.FINANCEIRO, PermissionAction.DELETE);

  const updated = await prisma.accountsPayable.update({
    where: { id: payableId },
    data: { status: PayableStatus.CANCELADO },
  });

  await logAudit({
    userId: actor.id,
    action: "payable.cancel",
    entityType: "AccountsPayable",
    entityId: updated.id,
  });

  revalidatePath("/financeiro/pagar");
}
