import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { CUSTOMER_TYPE_LABELS, customerDisplayName, customerDocument } from "@/lib/crm-labels";
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

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const actor = await requirePermission(MODULES.CLIENTES, PermissionAction.VIEW);
  const { q } = await searchParams;

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { fullName: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
          { tradeName: { contains: q, mode: "insensitive" } },
          { cpf: { contains: q.replace(/\D/g, "") } },
          { cnpj: { contains: q.replace(/\D/g, "") } },
          { phone: { contains: q } },
          { whatsapp: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [customers, canCreate] = await Promise.all([
    prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    hasPermission(actor.roleId, MODULES.CLIENTES, PermissionAction.CREATE),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Cadastro de pessoas físicas e jurídicas.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/clientes/novo" />} nativeButton={false}>
            <Plus className="mr-2 h-4 w-4" />
            Novo cliente
          </Button>
        )}
      </div>

      <form className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, documento, telefone..."
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{customers.length} cliente(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/clientes/${customer.id}`} className="hover:underline">
                      {customerDisplayName(customer) || "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{CUSTOMER_TYPE_LABELS[customer.type]}</TableCell>
                  <TableCell>{customerDocument(customer) || "—"}</TableCell>
                  <TableCell>{customer.phone || customer.whatsapp || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={customer.active ? "default" : "secondary"}>
                      {customer.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum cliente encontrado.
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
