import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { updateSalespersonAction } from "@/lib/actions/salespeople";
import { SalespersonForm } from "../../salesperson-form";

export default async function EditSalespersonPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.VENDEDORES, PermissionAction.EDIT);
  const { id } = await params;

  const salesperson = await prisma.salesperson.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!salesperson) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar vendedor</h1>
        <p className="text-muted-foreground">{salesperson.user.name}</p>
      </div>
      <SalespersonForm
        action={updateSalespersonAction.bind(null, salesperson.id)}
        users={[]}
        mode="edit"
        defaultValues={{
          userId: salesperson.userId,
          userName: `${salesperson.user.name} (${salesperson.user.email})`,
          cpf: salesperson.cpf,
          phone: salesperson.phone,
          monthlyGoal: salesperson.monthlyGoal?.toString() ?? null,
          commissionRate: salesperson.commissionRate.toString(),
          team: salesperson.team,
        }}
      />
    </div>
  );
}
