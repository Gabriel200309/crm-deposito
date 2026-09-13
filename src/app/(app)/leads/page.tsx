import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { customerDisplayName } from "@/lib/crm-labels";
import { Button } from "@/components/ui/button";
import { KanbanBoard, type LeadCardData } from "./kanban-board";

export default async function LeadsPage() {
  const actor = await requirePermission(MODULES.LEADS, PermissionAction.VIEW);

  const [leads, canCreate] = await Promise.all([
    prisma.lead.findMany({
      include: { customer: true, responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    hasPermission(actor.roleId, MODULES.LEADS, PermissionAction.CREATE),
  ]);

  const cards: LeadCardData[] = leads.map((lead) => ({
    id: lead.id,
    title: lead.title,
    stage: lead.stage,
    estimatedValue: lead.estimatedValue?.toString() ?? null,
    customerName: lead.customer ? customerDisplayName(lead.customer) : lead.contactName,
    responsibleName: lead.responsible?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funil de vendas</h1>
          <p className="text-muted-foreground">Arraste os cards para atualizar o estágio de cada oportunidade.</p>
        </div>
        {canCreate && (
          <Button render={<Link href="/leads/novo" />} nativeButton={false}>
            <Plus className="mr-2 h-4 w-4" />
            Nova oportunidade
          </Button>
        )}
      </div>

      <KanbanBoard leads={cards} />
    </div>
  );
}
