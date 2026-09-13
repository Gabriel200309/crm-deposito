"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { StockMovementType } from "@/generated/prisma/enums";
import { movementIncreasesStock, MANUAL_STOCK_MOVEMENT_TYPES } from "@/lib/stock-labels";

export type ActionState = { success: boolean; error?: string };

const movementSchema = z.object({
  productId: z.string().min(1, "Selecione um produto"),
  type: z.enum(StockMovementType),
  quantity: z.string().min(1, "Informe a quantidade"),
  reason: z.string().optional(),
  document: z.string().optional(),
});

export async function createStockMovementAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.ESTOQUE, PermissionAction.CREATE);

  const parsed = movementSchema.safeParse({
    productId: formData.get("productId"),
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    reason: formData.get("reason") || undefined,
    document: formData.get("document") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  if (!MANUAL_STOCK_MOVEMENT_TYPES.includes(parsed.data.type)) {
    return { success: false, error: "Tipo de movimentação inválido" };
  }

  const quantity = Number(parsed.data.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { success: false, error: "Quantidade deve ser maior que zero" };
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return { success: false, error: "Produto não encontrado" };

  const increases = movementIncreasesStock(parsed.data.type);
  if (!increases && Number(product.currentStock) < quantity) {
    return {
      success: false,
      error: `Estoque insuficiente: disponível ${product.currentStock.toString()}, solicitado ${quantity}`,
    };
  }

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        productId: parsed.data.productId,
        type: parsed.data.type,
        quantity: parsed.data.quantity,
        reason: parsed.data.reason || null,
        document: parsed.data.document || null,
        createdById: actor.id,
      },
    }),
    prisma.product.update({
      where: { id: parsed.data.productId },
      data: {
        currentStock: increases
          ? { increment: parsed.data.quantity }
          : { decrement: parsed.data.quantity },
      },
    }),
  ]);

  await logAudit({
    userId: actor.id,
    action: "stock.movement.create",
    entityType: "StockMovement",
    entityId: movement.id,
    changes: {
      productId: parsed.data.productId,
      type: parsed.data.type,
      quantity: parsed.data.quantity,
    },
  });

  revalidatePath("/estoque");
  revalidatePath("/produtos");
  return { success: true };
}
