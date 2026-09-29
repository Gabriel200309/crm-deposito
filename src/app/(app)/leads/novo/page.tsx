import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { createLeadAction } from "@/lib/actions/leads";
import { LeadForm } from "../lead-form";

export default async function NewLeadPage() {
  await requirePermission(MODULES.LEADS, PermissionAction.CREATE);

  const [customers, users] = await Promise.all([
    prisma.customer.findMany({
      where: { active: true },
      select: { id: true, type: true, fullName: true, companyName: true, tradeName: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nova oportunidade</h1>
        <p className="text-muted-foreground">Registre um novo lead no funil de vendas.</p>
      </div>
      <LeadForm action={createLeadAction} customers={customers} users={users} mode="create" />
    </div>
  );
}
