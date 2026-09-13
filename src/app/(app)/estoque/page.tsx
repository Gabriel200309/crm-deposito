import Link from "next/link";
import { AlertTriangle, PackageX, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { STOCK_MOVEMENT_TYPE_LABELS, movementIncreasesStock } from "@/lib/stock-labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Prisma } from "@/generated/prisma/client";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ produto?: string }>;
}) {
  await requirePermission(MODULES.ESTOQUE, PermissionAction.VIEW);
  const { produto } = await searchParams;

  const where: Prisma.StockMovementWhereInput = produto
    ? { product: { name: { contains: produto, mode: "insensitive" } } }
    : {};

  const [movements, outOfStock, lowStockCandidates] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: { product: { select: { name: true, internalCode: true, unit: { select: { code: true } } } }, createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.product.count({ where: { active: true, currentStock: { lte: 0 } } }),
    // Prisma não compara duas colunas entre si diretamente; filtra em memória
    // (catálogo de um único depósito, volume baixo o suficiente para isso).
    prisma.product.findMany({
      where: { active: true, currentStock: { gt: 0 }, minStock: { not: null } },
      select: { currentStock: true, minStock: true },
    }),
  ]);
  const lowStock = lowStockCandidates.filter(
    (p) => Number(p.currentStock) <= Number(p.minStock),
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Estoque</h1>
          <p className="text-muted-foreground">Movimentações de entrada, saída e ajustes.</p>
        </div>
        <Button render={<Link href="/estoque/nova" />} nativeButton={false}>
          <Plus className="mr-2 h-4 w-4" />
          Nova movimentação
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos sem estoque</CardTitle>
            <PackageX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtos com estoque baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{movements.length} movimentação(ões) recente(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatDateTime(movement.createdAt)}
                  </TableCell>
                  <TableCell>
                    {movement.product.name}
                    <span className="block text-xs text-muted-foreground">{movement.product.internalCode}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={movementIncreasesStock(movement.type) ? "default" : "secondary"}>
                      {STOCK_MOVEMENT_TYPE_LABELS[movement.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {movementIncreasesStock(movement.type) ? "+" : "-"}
                    {movement.quantity.toString()} {movement.product.unit.code}
                  </TableCell>
                  <TableCell>{movement.document || "—"}</TableCell>
                  <TableCell>{movement.createdBy?.name ?? "—"}</TableCell>
                </TableRow>
              ))}
              {movements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Nenhuma movimentação registrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
