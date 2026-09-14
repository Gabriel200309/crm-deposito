import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { updateCustomerAction } from "@/lib/actions/customers";
import { CustomerForm } from "../../customer-form";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.CLIENTES, PermissionAction.EDIT);
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar cliente</h1>
      </div>
      <CustomerForm
        action={updateCustomerAction.bind(null, customer.id)}
        mode="edit"
        defaultValues={{
          ...customer,
          birthDate: customer.birthDate ? customer.birthDate.toISOString().slice(0, 10) : null,
          creditLimit: customer.creditLimit ? customer.creditLimit.toString() : null,
        }}
      />
    </div>
  );
}
