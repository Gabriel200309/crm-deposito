import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { toggleCategoryActiveAction } from "@/lib/actions/categories";
import { flattenCategoryTree } from "@/lib/category-tree";
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
import { CategoryForm } from "./category-form";

export default async function CategoriesPage() {
  const actor = await requirePermission(MODULES.PRODUTOS, PermissionAction.VIEW);

  const [categories, canCreate, canDelete] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, parentId: true, active: true, _count: { select: { products: true } } },
    }),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.CREATE),
    hasPermission(actor.roleId, MODULES.PRODUTOS, PermissionAction.DELETE),
  ]);

  const flat = flattenCategoryTree(categories);
  const byId = new Map(categories.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Categorias</h1>
        <p className="text-muted-foreground">Organize os produtos em categorias e subcategorias.</p>
      </div>

      <ProductsSubNav />

      {canCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nova categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm categories={flat.filter((c) => c.depth === 0)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{categories.length} categoria(s)</CardTitle>
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
              {flat.map((category) => {
                const full = byId.get(category.id)!;
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      <span className="text-muted-foreground">{"— ".repeat(category.depth)}</span>
                      {category.name}
                    </TableCell>
                    <TableCell>{full._count.products}</TableCell>
                    <TableCell>
                      <Badge variant={full.active ? "default" : "secondary"}>
                        {full.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    {canDelete && (
                      <TableCell className="text-right">
                        <GenericToggleActiveButton
                          active={full.active}
                          action={toggleCategoryActiveAction.bind(null, category.id)}
                        />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
