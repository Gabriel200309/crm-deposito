import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { updateDriverAction } from "@/lib/actions/drivers";
import { DriverForm } from "../../driver-form";

export default async function EditDriverPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.MOTORISTAS, PermissionAction.EDIT);
  const { id } = await params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!driver) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar motorista</h1>
        <p className="text-muted-foreground">{driver.user.name}</p>
      </div>
      <DriverForm
        action={updateDriverAction.bind(null, driver.id)}
        users={[]}
        mode="edit"
        defaultValues={{
          userId: driver.userId,
          userName: `${driver.user.name} (${driver.user.email})`,
          phone: driver.phone,
          vehiclePlate: driver.vehiclePlate,
          vehicleModel: driver.vehicleModel,
        }}
      />
    </div>
  );
}
