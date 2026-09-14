import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { createOrderAction } from "@/lib/actions/orders";
import { customerDisplayName } from "@/lib/crm-labels";
import { OrderForm } from "../order-form";

export default async function NewOrderPage() {
  await requirePermission(MODULES.PEDIDOS, PermissionAction.CREATE);

  const [customers, salespeople, products] = await Promise.all([
    prisma.customer.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.salesperson.findMany({
      where: { active: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        internalCode: true,
        salePrice: true,
        currentStock: true,
        unit: { select: { code: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo pedido</h1>
        <p className="text-muted-foreground">
          Comece como orçamento — o status pode avançar depois sem recadastrar os itens.
        </p>
      </div>
      <OrderForm
        action={createOrderAction}
        customers={customers.map((c) => ({ id: c.id, name: customerDisplayName(c) }))}
        salespeople={salespeople.map((s) => ({ id: s.id, name: s.user.name }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          internalCode: p.internalCode,
          unitCode: p.unit.code,
          currentStock: p.currentStock.toString(),
          salePrice: p.salePrice.toString(),
        }))}
        mode="create"
      />
    </div>
  );
}
