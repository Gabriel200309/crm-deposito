import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleActiveButton } from "./toggle-active-button";

export default async function UsersPage() {
  const actor = await requirePermission(MODULES.USUARIOS, PermissionAction.VIEW);

  const [users, canCreate, canEdit, canDelete] = await Promise.all([
    prisma.user.findMany({
      include: { role: true },
      orderBy: { name: "asc" },
    }),
    hasPermission(actor.roleId, MODULES.USUARIOS, PermissionAction.CREATE),
    hasPermission(actor.roleId, MODULES.USUARIOS, PermissionAction.EDIT),
    hasPermission(actor.roleId, MODULES.USUARIOS, PermissionAction.DELETE),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários com acesso ao sistema.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/usuarios/novo" />} nativeButton={false}>
            <Plus className="mr-2 h-4 w-4" />
            Novo usuário
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{users.length} usuário(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role.name}</TableCell>
                  <TableCell>
                    <Badge variant={user.active ? "default" : "secondary"}>
                      {user.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-end gap-2">
                    {canEdit && (
                      <Button
                        render={<Link href={`/usuarios/${user.id}`} />}
                        nativeButton={false}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                    )}
                    {canDelete && (
                      <ToggleActiveButton userId={user.id} active={user.active} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum usuário cadastrado.
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
