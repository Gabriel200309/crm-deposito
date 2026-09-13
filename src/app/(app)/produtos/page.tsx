import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ProductsSubNav } from "./products-subnav";
import { ToggleProductActiveButton } from "./toggle-product-active-button";

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.VIEW);
  const { q } = await searchParams;

  const where: Prisma.ProductWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { internalCode: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { barcode: { contains: q } },
        ],
      }
    : {};

  const [products, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true, unit: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.CREATE),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.EDIT),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.DELETE),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Catálogo de produtos do depósito.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/produtos/novo" />} nativeButton={false}>
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Button>
        )}
      </div>

      <ProductsSubNav />

      <form className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, código, SKU..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{products.length} produto(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Preço de venda</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono text-xs">{product.internalCode}</TableCell>
                  <TableCell className="font-medium">
                    {product.name}
                    {product.brand && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {product.brand.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{product.category.name}</TableCell>
                  <TableCell>{product.unit.code}</TableCell>
                  <TableCell>{formatCurrency(product.salePrice)}</TableCell>
                  <TableCell>{product.currentStock.toString()}</TableCell>
                  <TableCell>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {canEdit && (
                      <Button
                        render={<Link href={`/produtos/${product.id}/editar`} />}
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                    )}
                    {canDelete && (
                      <ToggleProductActiveButton productId={product.id} active={product.active} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhum produto encontrado.
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
