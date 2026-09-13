import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { createCustomerAction } from "@/lib/actions/customers";
import { CustomerForm } from "../customer-form";

export default async function NewCustomerPage() {
  await requirePermission(MODULES.CLIENTES, PermissionAction.CREATE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Novo cliente</h1>
        <p className="text-muted-foreground">Cadastre uma pessoa física ou jurídica.</p>
      </div>
      <CustomerForm action={createCustomerAction} mode="create" />
    </div>
  );
}
