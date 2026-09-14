"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { CommissionStatus } from "@/generated/prisma/enums";

export async function markCommissionPaidAction(commissionId: string) {
  const actor = await requirePermission(MODULES.COMISSOES, PermissionAction.EDIT);

  const updated = await prisma.commission.update({
    where: { id: commissionId },
    data: { status: CommissionStatus.PAGA, paidAt: new Date() },
  });

  await logAudit({
    userId: actor.id,
    action: "commission.mark_paid",
    entityType: "Commission",
    entityId: updated.id,
  });

  revalidatePath("/comissoes");
}
