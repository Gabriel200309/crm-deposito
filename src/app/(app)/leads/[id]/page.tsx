import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { LEAD_SOURCE_LABELS, customerDisplayName } from "@/lib/crm-labels";
import { createActivityAction } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityForm } from "@/components/activity-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { StageChanger } from "./stage-changer";
import { LeadStage } from "@/generated/prisma/client";

function formatCurrency(value: unknown) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission(MODULES.LEADS, PermissionAction.VIEW);
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      customer: true,
      responsible: { select: { name: true } },
      activities: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
    },
  });
  if (!lead) notFound();

  const canEdit = await hasPermission(actor.roleId, MODULES.LEADS, PermissionAction.EDIT);
  const addActivity = createActivityAction.bind(null, { leadId: lead.id }, `/leads/${lead.id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{lead.title}</h1>
            {lead.stage === LeadStage.PERDIDO && <Badge variant="secondary">Perdido</Badge>}
            {lead.stage === LeadStage.VENDA_REALIZADA && <Badge>Venda realizada</Badge>}
          </div>
          {lead.customer ? (
            <Link href={`/clientes/${lead.customer.id}`} className="text-muted-foreground hover:underline">
              {customerDisplayName(lead.customer)}
            </Link>
          ) : (
            <p className="text-muted-foreground">{lead.contactName || "Sem cliente vinculado"}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && <StageChanger leadId={lead.id} stage={lead.stage} />}
          {canEdit && (
            <Button render={<Link href={`/leads/${lead.id}/editar`} />} nativeButton={false} variant="outline">
              Editar
            </Button>
          )}
        </div>
      </div>

      {lead.stage === LeadStage.PERDIDO && lead.lostReason && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-base">Motivo da perda</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{lead.lostReason}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Origem</p>
            <p>{LEAD_SOURCE_LABELS[lead.source]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Responsável</p>
            <p>{lead.responsible?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Valor estimado</p>
            <p>{formatCurrency(lead.estimatedValue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Probabilidade</p>
            <p>{lead.probability !== null ? `${lead.probability}%` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Previsão de fechamento</p>
            <p>
              {lead.expectedCloseDate
                ? new Intl.DateTimeFormat("pt-BR").format(lead.expectedCloseDate)
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Contato</p>
            <p>{[lead.contactName, lead.contactPhone, lead.contactEmail].filter(Boolean).join(" · ") || "—"}</p>
          </div>
        </CardContent>
        {lead.notes && (
          <CardContent className="border-t pt-4 text-sm whitespace-pre-wrap">{lead.notes}</CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registrar atividade</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityForm action={addActivity} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <ActivityTimeline activities={lead.activities} revalidateTo={`/leads/${lead.id}`} module={MODULES.LEADS} />
        </CardContent>
      </Card>
    </div>
  );
}
