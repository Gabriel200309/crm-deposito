import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { MovementForm } from "../movement-form";

export default async function NewStockMovementPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  await requirePermission(MODULES.ESTOQUE, PermissionAction.CREATE);
  const { productId } = await searchParams;

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { id: true, name: true, internalCode: true, currentStock: true, unit: { select: { code: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova movimentação</h1>
        <p className="text-muted-foreground">Registre entrada, saída ou ajuste de estoque de um produto.</p>
      </div>
      <MovementForm
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          internalCode: p.internalCode,
          unitCode: p.unit.code,
          currentStock: p.currentStock.toString(),
        }))}
        defaultProductId={productId}
      />
    </div>
  );
}
