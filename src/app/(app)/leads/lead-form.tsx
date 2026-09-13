"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadSource } from "@/generated/prisma/enums";
import { LEAD_SOURCE_LABELS } from "@/lib/crm-labels";
import { customerDisplayName } from "@/lib/crm-labels";
import type { ActionState } from "@/lib/actions/leads";
import type { Customer } from "@/generated/prisma/client";

type UserOption = { id: string; name: string };

export function LeadForm({
  action,
  customers,
  users,
  defaultValues,
  mode,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  customers: Customer[];
  users: UserOption[];
  defaultValues?: {
    title: string;
    customerId?: string | null;
    contactName?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    responsibleId?: string | null;
    source: LeadSource;
    estimatedValue?: string | null;
    probability?: number | null;
    expectedCloseDate?: string | null;
    notes?: string | null;
  };
  mode: "create" | "edit";
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });
  const [customerId, setCustomerId] = useState(defaultValues?.customerId || "none");

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Oportunidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              name="title"
              placeholder="Ex: João - Reforma de cozinha"
              defaultValue={defaultValues?.title}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerId">Cliente vinculado (opcional)</Label>
            <Select name="customerId" value={customerId} onValueChange={(value) => setCustomerId(value ?? "none")}>
              <SelectTrigger id="customerId" className="w-full">
                <SelectValue placeholder="Nenhum cliente vinculado">
                  {(value: string | null) =>
                    customers.find((c) => c.id === value)
                      ? customerDisplayName(customers.find((c) => c.id === value)!)
                      : "Nenhum cliente vinculado"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customerDisplayName(customer)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {customerId === "none" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome do contato</Label>
                <Input id="contactName" name="contactName" defaultValue={defaultValues?.contactName ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Telefone</Label>
                <Input id="contactPhone" name="contactPhone" defaultValue={defaultValues?.contactPhone ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail">E-mail</Label>
                <Input
                  id="contactEmail"
                  name="contactEmail"
                  type="email"
                  defaultValue={defaultValues?.contactEmail ?? ""}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="source">Origem</Label>
              <Select name="source" defaultValue={defaultValues?.source ?? LeadSource.OUTROS}>
                <SelectTrigger id="source" className="w-full">
                  <SelectValue>
                    {(value: string | null) =>
                      value ? LEAD_SOURCE_LABELS[value as LeadSource] : "Selecione"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(LeadSource).map((value) => (
                    <SelectItem key={value} value={value}>
                      {LEAD_SOURCE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsibleId">Responsável</Label>
              <Select name="responsibleId" defaultValue={defaultValues?.responsibleId || "none"}>
                <SelectTrigger id="responsibleId" className="w-full">
                  <SelectValue placeholder="Sem responsável">
                    {(value: string | null) => users.find((u) => u.id === value)?.name ?? "Sem responsável"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem responsável</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Valor estimado (R$)</Label>
              <Input
                id="estimatedValue"
                name="estimatedValue"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultValues?.estimatedValue ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidade (%)</Label>
              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue={defaultValues?.probability ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedCloseDate">Previsão de fechamento</Label>
              <Input
                id="expectedCloseDate"
                name="expectedCloseDate"
                type="date"
                defaultValue={defaultValues?.expectedCloseDate ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {mode === "create" ? "Criar oportunidade" : "Salvar alterações"}
      </Button>
    </form>
  );
}
