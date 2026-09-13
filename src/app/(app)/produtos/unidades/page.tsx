import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { toggleUnitActiveAction } from "@/lib/actions/units";
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
import { UnitForm } from "./unit-form";

export default async function UnitsPage() {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.VIEW);

  const [units, canCreate, canDelete] = await Promise.all([
    prisma.unit.findMany({
      orderBy: { code: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.CREATE),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.DELETE),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Unidades de medida</h1>
        <p className="text-muted-foreground">Unidades disponíveis para cadastro de produtos.</p>
      </div>

      <ProductsSubNav />

      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova unidade</CardTitle>
          </CardHeader>
          <CardContent>
            <UnitForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{units.length} unidade(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Status</TableHead>
                {canDelete && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell className="font-mono text-xs">{unit.code}</TableCell>
                  <TableCell className="font-medium">{unit.label}</TableCell>
                  <TableCell>{unit._count.products}</TableCell>
                  <TableCell>
                    <Badge variant={unit.active ? "default" : "secondary"}>
                      {unit.active ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  {canDelete && (
                    <TableCell className="text-right">
                      <GenericToggleActiveButton
                        active={unit.active}
                        action={toggleUnitActiveAction.bind(null, unit.id)}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
