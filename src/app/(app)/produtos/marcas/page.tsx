import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { toggleBrandActiveAction } from "@/lib/actions/brands";
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
import { GenericToggleActiveButton } from "@/components/generic-toggle-active-button";
import { ProductsSubNav } from "../products-subnav";
import { BrandForm } from "./brand-form";

export default async function BrandsPage() {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.VIEW);

  const [brands, canCreate, canDelete] = await Promise.all([
    prisma.brand.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.CREATE),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.DELETE),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marcas</h1>
        <p className="text-muted-foreground">Marcas dos produtos do catálogo.</p>
      </div>

      <ProductsSubNav />

      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova marca</CardTitle>
          </CardHeader>
          <CardContent>
            <BrandForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{brands.length} marca(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Status</TableHead>
                {canDelete && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell>{brand._count.products}</TableCell>
                  <TableCell>
                    <Badge variant={brand.active ? "default" : "secondary"}>
                      {brand.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  {canDelete && (
                    <TableCell className="text-right">
                      <GenericToggleActiveButton
                        active={brand.active}
                        action={toggleBrandActiveAction.bind(null, brand.id)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {brands.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Nenhuma marca cadastrada.
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
