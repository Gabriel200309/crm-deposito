import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { updateLeadAction } from "@/lib/actions/leads";
import { LeadForm } from "../../lead-form";

export default async function EditLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission(MODULES.LEADS, PermissionAction.EDIT);
  const { id } = await params;

  const [lead, customers, users] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
    prisma.customer.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Editar oportunidade</h1>
      </div>
      <LeadForm
        action={updateLeadAction.bind(null, lead.id)}
        customers={customers}
        users={users}
        mode="edit"
        defaultValues={{
          title: lead.title,
          customerId: lead.customerId,
          contactName: lead.contactName,
          contactPhone: lead.contactPhone,
          contactEmail: lead.contactEmail,
          responsibleId: lead.responsibleId,
          source: lead.source,
          estimatedValue: lead.estimatedValue?.toString() ?? null,
          probability: lead.probability,
          expectedCloseDate: lead.expectedCloseDate ? lead.expectedCloseDate.toISOString().slice(0, 10) : null,
          notes: lead.notes,
        }}
      />
    </div>
  );
}
