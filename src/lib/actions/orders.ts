"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { DeliveryType, OrderStatus, PaymentMethod, StockMovementType } from "@/generated/prisma/enums";
import { ORDER_FINAL_STATUSES, ORDER_LOCKED_STATUSES, isOrderEditable } from "@/lib/order-labels";
import { calculateOrderSubtotal, calculateOrderTotal } from "@/lib/order-totals";
import { splitInstallments } from "@/lib/finance-labels";
import { checkCustomerCredit } from "@/lib/credit";
import { hasPermission } from "@/lib/rbac";

export type ActionState = { success: boolean; error?: string };

const itemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
});

const orderSchema = z.object({
  customerId: z.string().min(1, "Selecione um cliente"),
  salespersonId: z.string().optional(),
  validUntil: z.string().optional(),
  paymentMethod: z.enum(PaymentMethod),
  paymentTerms: z.string().optional(),
  deliveryType: z.enum(DeliveryType),
  deliveryAddressStreet: z.string().optional(),
  deliveryAddressNumber: z.string().optional(),
  deliveryAddressCity: z.string().optional(),
  deliveryAddressState: z.string().optional(),
  deliveryAddressZip: z.string().optional(),
  discount: z.string().optional(),
  freight: z.string().optional(),
  installments: z.string().optional(),
  firstDueDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.string().min(1, "Adicione ao menos um item"),
});

function parseOrderForm(formData: FormData) {
  const parsed = orderSchema.safeParse({
    customerId: formData.get("customerId"),
    salespersonId: (formData.get("salespersonId") as string | null) || undefined,
    validUntil: formData.get("validUntil") || undefined,
    paymentMethod: formData.get("paymentMethod"),
    paymentTerms: formData.get("paymentTerms") || undefined,
    deliveryType: formData.get("deliveryType"),
    deliveryAddressStreet: formData.get("deliveryAddressStreet") || undefined,
    deliveryAddressNumber: formData.get("deliveryAddressNumber") || undefined,
    deliveryAddressCity: formData.get("deliveryAddressCity") || undefined,
    deliveryAddressState: formData.get("deliveryAddressState") || undefined,
    deliveryAddressZip: formData.get("deliveryAddressZip") || undefined,
    discount: formData.get("discount") || undefined,
    freight: formData.get("freight") || undefined,
    installments: formData.get("installments") || undefined,
    firstDueDate: formData.get("firstDueDate") || undefined,
    notes: formData.get("notes") || undefined,
    items: formData.get("items"),
  });
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  let items: z.infer<typeof itemSchema>[];
  try {
    const raw = JSON.parse(parsed.data.items);
    items = z.array(itemSchema).min(1, "Adicione ao menos um item").parse(raw);
  } catch {
    return { success: false as const, error: "Adicione ao menos um item válido ao pedido" };
  }

  return { success: true as const, data: parsed.data, items };
}

function toOrderData(data: z.infer<typeof orderSchema>) {
  const salespersonId = data.salespersonId === "none" ? undefined : data.salespersonId;
  return {
    customerId: data.customerId,
    salespersonId: salespersonId || null,
    validUntil: data.validUntil ? new Date(data.validUntil) : null,
    paymentMethod: data.paymentMethod,
    paymentTerms: data.paymentTerms || null,
    deliveryType: data.deliveryType,
    deliveryAddressStreet: data.deliveryType === DeliveryType.ENTREGA ? data.deliveryAddressStreet || null : null,
    deliveryAddressNumber: data.deliveryType === DeliveryType.ENTREGA ? data.deliveryAddressNumber || null : null,
    deliveryAddressCity: data.deliveryType === DeliveryType.ENTREGA ? data.deliveryAddressCity || null : null,
    deliveryAddressState: data.deliveryType === DeliveryType.ENTREGA ? data.deliveryAddressState || null : null,
    deliveryAddressZip: data.deliveryType === DeliveryType.ENTREGA ? data.deliveryAddressZip || null : null,
    discount: data.discount || "0",
    freight: data.freight || "0",
    installments: data.installments ? Math.max(1, parseInt(data.installments, 10) || 1) : 1,
    firstDueDate: data.firstDueDate ? new Date(data.firstDueDate) : null,
    notes: data.notes || null,
  };
}

export async function createOrderAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.PEDIDOS, PermissionAction.CREATE);

  const parsed = parseOrderForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error };

  const created = await prisma.order.create({
    data: {
      ...toOrderData(parsed.data),
      items: {
        create: parsed.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
        })),
      },
    },
  });

  await logAudit({
    userId: actor.id,
    action: "order.create",
    entityType: "Order",
    entityId: created.id,
  });

  revalidatePath("/pedidos");
  redirect(`/pedidos/${created.id}`);
}

export async function updateOrderAction(
  orderId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.PEDIDOS, PermissionAction.EDIT);

  const existing = await prisma.order.findUnique({ where: { id: orderId } });
  if (!existing) return { success: false, error: "Pedido não encontrado" };
  if (!isOrderEditable(existing.status)) {
    return { success: false, error: "Este pedido não pode mais ser editado nesse estágio" };
  }

  const parsed = parseOrderForm(formData);
  if (!parsed.success) return { success: false, error: parsed.error };

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId } }),
    prisma.order.update({
      where: { id: orderId },
      data: {
        ...toOrderData(parsed.data),
        items: {
          create: parsed.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
          })),
        },
      },
    }),
  ]);

  await logAudit({
    userId: actor.id,
    action: "order.update",
    entityType: "Order",
    entityId: orderId,
  });

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  redirect(`/pedidos/${orderId}`);
}

export async function changeOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  reason?: string,
): Promise<ActionState> {
  const isFinal = ORDER_FINAL_STATUSES.includes(status);
  const actor = await requirePermission(MODULES.PEDIDOS, isFinal ? PermissionAction.DELETE : PermissionAction.EDIT);

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { success: false, error: "Pedido não encontrado" };

  if (ORDER_FINAL_STATUSES.includes(order.status) || order.status === OrderStatus.ENTREGUE) {
    return { success: false, error: "Este pedido já está em um estágio final" };
  }

  if (isFinal && ORDER_LOCKED_STATUSES.includes(order.status)) {
    return {
      success: false,
      error: "Pedidos já faturados não podem ser cancelados/perdidos diretamente (requer devolução)",
    };
  }

  if (status === OrderStatus.FATURADO) {
    // Confere estoque suficiente para todos os itens antes de baixar.
    const products = await prisma.product.findMany({
      where: { id: { in: order.items.map((item) => item.productId) } },
    });
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) continue;
      if (Number(product.currentStock) < Number(item.quantity)) {
        return {
          success: false,
          error: `Estoque insuficiente para ${product.name}: disponível ${product.currentStock.toString()}, necessário ${item.quantity.toString()}`,
        };
      }
    }

    const itemsForCalc = order.items.map((item) => ({
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      discount: item.discount.toString(),
    }));
    const subtotal = calculateOrderSubtotal(itemsForCalc);
    const total = calculateOrderTotal(itemsForCalc, order.discount.toString(), order.freight.toString());

    if (order.paymentMethod === PaymentMethod.CREDIARIO) {
      const credit = await checkCustomerCredit(order.customerId, total);
      if (!credit.withinLimit) {
        const canApprove = await hasPermission(actor.roleId, MODULES.FINANCEIRO, PermissionAction.APPROVE);
        if (!canApprove) {
          return {
            success: false,
            error: `Limite de crédito insuficiente: disponível ${credit.available?.toFixed(2)}, necessário ${total.toFixed(2)}. Requer aprovação do Financeiro.`,
          };
        }
        await logAudit({
          userId: actor.id,
          action: "order.credit_limit_override",
          entityType: "Order",
          entityId: orderId,
          changes: { limit: credit.limit, used: credit.used, orderTotal: total },
        });
      }
    }

    const dueDates = Array.from({ length: order.installments }, (_, i) => {
      const base = order.firstDueDate ?? order.createdAt;
      const date = new Date(base);
      date.setDate(date.getDate() + i * 30);
      return date;
    });
    const installmentAmounts = splitInstallments(total, order.installments);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: orderId }, data: { status } });

      for (const item of order.items) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: StockMovementType.VENDA,
            quantity: item.quantity,
            document: `Pedido #${order.number}`,
            reason: "Venda",
            createdById: actor.id,
          },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });
      }

      if (order.salespersonId) {
        const salesperson = await tx.salesperson.findUnique({ where: { id: order.salespersonId } });
        if (salesperson) {
          const rate = Number(salesperson.commissionRate);
          await tx.commission.upsert({
            where: { orderId },
            create: {
              orderId,
              salespersonId: order.salespersonId,
              baseAmount: subtotal.toFixed(2),
              rate: salesperson.commissionRate,
              amount: ((subtotal * rate) / 100).toFixed(2),
            },
            update: {},
          });
        }
      }

      for (let i = 0; i < order.installments; i++) {
        await tx.accountsReceivable.create({
          data: {
            orderId,
            customerId: order.customerId,
            installmentNumber: i + 1,
            installmentsTotal: order.installments,
            dueDate: dueDates[i],
            amount: installmentAmounts[i].toFixed(2),
            paymentMethod: order.paymentMethod,
          },
        });
      }
    });
  } else {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        lostReason: status === OrderStatus.PERDIDO ? reason || null : order.lostReason,
        cancelReason: status === OrderStatus.CANCELADO ? reason || null : order.cancelReason,
      },
    });
  }

  await logAudit({
    userId: actor.id,
    action: "order.status_change",
    entityType: "Order",
    entityId: orderId,
    changes: { from: order.status, to: status, reason },
  });

  revalidatePath("/pedidos");
  revalidatePath(`/pedidos/${orderId}`);
  revalidatePath("/estoque");
  revalidatePath("/produtos");
  revalidatePath("/comissoes");
  revalidatePath("/financeiro/receber");
  return { success: true };
}
