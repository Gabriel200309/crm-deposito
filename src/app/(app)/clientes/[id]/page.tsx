import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import {
  CLASSIFICATION_LABELS,
  CUSTOMER_TYPE_LABELS,
  LEAD_STAGE_LABELS,
  customerDisplayName,
  customerDocument,
} from "@/lib/crm-labels";
import { createActivityAction } from "@/lib/actions/activities";
import { checkCustomerCredit } from "@/lib/credit";
import { formatMoney } from "@/lib/order-labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityForm } from "@/components/activity-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { ContactForm } from "./contact-form";
import { DeleteContactButton } from "./delete-contact-button";
import { ToggleCustomerActiveButton } from "./toggle-customer-active-button";
import { CustomerType } from "@/generated/prisma/client";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requirePermission(MODULES.CLIENTES, PermissionAction.VIEW);
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      contacts: { orderBy: { createdAt: "asc" } },
      activities: { orderBy: { createdAt: "desc" }, include: { createdBy: { select: { name: true } } } },
      leads: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!customer) notFound();

  const [canEdit, canDelete, credit] = await Promise.all([
    hasPermission(actor.roleId, MODULES.CLIENTES, PermissionAction.EDIT),
    hasPermission(actor.roleId, MODULES.CLIENTES, PermissionAction.DELETE),
    checkCustomerCredit(customer.id, 0),
  ]);

  const addActivity = createActivityAction.bind(null, { customerId: customer.id }, `/clientes/${customer.id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{customerDisplayName(customer)}</h1>
            <Badge variant={customer.active ? "default" : "secondary"}>
              {customer.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {CUSTOMER_TYPE_LABELS[customer.type]}
            {customerDocument(customer) ? ` · ${customerDocument(customer)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button render={<Link href={`/clientes/${customer.id}/editar`} />} nativeButton={false} variant="outline">
              Editar
            </Button>
          )}
          {canDelete && <ToggleCustomerActiveButton customerId={customer.id} active={customer.active} />}
        </div>
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão geral</TabsTrigger>
          <TabsTrigger value="contatos">Contatos ({customer.contacts.length})</TabsTrigger>
          <TabsTrigger value="atividades">Histórico ({customer.activities.length})</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades ({customer.leads.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Telefone</p>
                <p>{customer.phone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">WhatsApp</p>
                <p>{customer.whatsapp || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">E-mail</p>
                <p>{customer.email || "—"}</p>
              </div>
              {customer.type === CustomerType.PJ && customer.responsibleName && (
                <div>
                  <p className="text-muted-foreground">Responsável</p>
                  <p>{customer.responsibleName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Endereço</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {customer.addressStreet ? (
                <p>
                  {customer.addressStreet}, {customer.addressNumber || "s/n"}
                  {customer.addressComplement ? ` — ${customer.addressComplement}` : ""}
                  <br />
                  {customer.addressNeighborhood ? `${customer.addressNeighborhood}, ` : ""}
                  {customer.addressCity}
                  {customer.addressState ? `/${customer.addressState}` : ""}
                  {customer.addressZip ? ` — ${customer.addressZip}` : ""}
                </p>
              ) : (
                <p className="text-muted-foreground">Endereço não informado.</p>
              )}
            </CardContent>
          </Card>

          {credit.limit !== null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Crédito</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-muted-foreground">Limite</p>
                  <p>{formatMoney(credit.limit)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Utilizado</p>
                  <p>{formatMoney(credit.used)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Disponível</p>
                  <p className={credit.available < 0 ? "font-medium text-destructive" : "font-medium"}>
                    {formatMoney(credit.available)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Classificação</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {customer.classifications.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma classificação atribuída.</p>
              )}
              {customer.classifications.map((c) => (
                <Badge key={c} variant="outline">
                  {CLASSIFICATION_LABELS[c]}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {customer.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent className="text-sm whitespace-pre-wrap">{customer.notes}</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="contatos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adicionar contato</CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm customerId={customer.id} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="divide-y pt-6">
              {customer.contacts.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
              )}
              {customer.contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium">
                      {contact.name}
                      {contact.role ? <span className="font-normal text-muted-foreground"> · {contact.role}</span> : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {[contact.phone, contact.whatsapp, contact.email].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <DeleteContactButton customerId={customer.id} contactId={contact.id} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atividades" className="space-y-4">
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
              <ActivityTimeline
                activities={customer.activities}
                revalidateTo={`/clientes/${customer.id}`}
                module={MODULES.CLIENTES}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="oportunidades">
          <Card>
            <CardContent className="divide-y pt-6">
              {customer.leads.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma oportunidade registrada para este cliente.</p>
              )}
              {customer.leads.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:underline"
                >
                  <span className="text-sm font-medium">{lead.title}</span>
                  <Badge variant="outline">{LEAD_STAGE_LABELS[lead.stage]}</Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
