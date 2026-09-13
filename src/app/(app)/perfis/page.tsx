import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function RolesPage() {
  await requirePermission(MODULES.PERFIS, PermissionAction.VIEW);

  const roles = await prisma.role.findMany({
    include: { _count: { select: { permissions: true, users: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perfis e permissões</h1>
        <p className="text-muted-foreground">
          Controle o que cada perfil de usuário pode visualizar, criar, editar e excluir em cada
          módulo do sistema.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{roles.length} perfil(is)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perfil</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">{role.description ?? "—"}</TableCell>
                  <TableCell>{role._count.users}</TableCell>
                  <TableCell>{role._count.permissions}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      render={<Link href={`/perfis/${role.id}`} />}
                      nativeButton={false}
                      variant="outline"
                      size="sm"
                    >
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
