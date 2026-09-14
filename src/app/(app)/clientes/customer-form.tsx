"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerClassification, CustomerType } from "@/generated/prisma/enums";
import { CLASSIFICATION_LABELS } from "@/lib/crm-labels";
import type { ActionState } from "@/lib/actions/customers";
import { cn } from "@/lib/utils";

export type CustomerFormValues = {
  type: CustomerType;
  fullName?: string | null;
  cpf?: string | null;
  rg?: string | null;
  birthDate?: string | null;
  companyName?: string | null;
  tradeName?: string | null;
  cnpj?: string | null;
  stateTaxId?: string | null;
  municipalTaxId?: string | null;
  responsibleName?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  addressStreet?: string | null;
  addressNumber?: string | null;
  addressComplement?: string | null;
  addressNeighborhood?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressZip?: string | null;
  classifications?: CustomerClassification[];
  notes?: string | null;
  creditLimit?: string | null;
};

export function CustomerForm({
  action,
  defaultValues,
  mode,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: CustomerFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });
  const [type, setType] = useState<CustomerType>(defaultValues?.type ?? CustomerType.PF);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipo de cliente</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {(
            [
              { value: CustomerType.PF, label: "Pessoa física" },
              { value: CustomerType.PJ, label: "Pessoa jurídica" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex flex-1 cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors",
                type === option.value
                  ? "border-primary bg-primary/5"
                  : "border-input hover:bg-muted",
              )}
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                checked={type === option.value}
                onChange={() => setType(option.value)}
                className="accent-primary"
              />
              {option.label}
            </label>
          ))}
        </CardContent>
      </Card>

      {type === CustomerType.PF ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input id="fullName" name="fullName" defaultValue={defaultValues?.fullName ?? ""} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" name="cpf" defaultValue={defaultValues?.cpf ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rg">RG</Label>
              <Input id="rg" name="rg" defaultValue={defaultValues?.rg ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={defaultValues?.birthDate ?? ""}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da empresa</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Razão social</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={defaultValues?.companyName ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tradeName">Nome fantasia</Label>
              <Input id="tradeName" name="tradeName" defaultValue={defaultValues?.tradeName ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input id="cnpj" name="cnpj" defaultValue={defaultValues?.cnpj ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="responsibleName">Responsável</Label>
              <Input
                id="responsibleName"
                name="responsibleName"
                defaultValue={defaultValues?.responsibleName ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateTaxId">Inscrição estadual</Label>
              <Input id="stateTaxId" name="stateTaxId" defaultValue={defaultValues?.stateTaxId ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipalTaxId">Inscrição municipal</Label>
              <Input
                id="municipalTaxId"
                name="municipalTaxId"
                defaultValue={defaultValues?.municipalTaxId ?? ""}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" name="phone" defaultValue={defaultValues?.phone ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" name="whatsapp" defaultValue={defaultValues?.whatsapp ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="addressStreet">Logradouro</Label>
            <Input id="addressStreet" name="addressStreet" defaultValue={defaultValues?.addressStreet ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="addressNumber">Número</Label>
            <Input id="addressNumber" name="addressNumber" defaultValue={defaultValues?.addressNumber ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressComplement">Complemento</Label>
            <Input
              id="addressComplement"
              name="addressComplement"
              defaultValue={defaultValues?.addressComplement ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressNeighborhood">Bairro</Label>
            <Input
              id="addressNeighborhood"
              name="addressNeighborhood"
              defaultValue={defaultValues?.addressNeighborhood ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="addressCity">Cidade</Label>
            <Input id="addressCity" name="addressCity" defaultValue={defaultValues?.addressCity ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="addressState">UF</Label>
            <Input
              id="addressState"
              name="addressState"
              maxLength={2}
              className="uppercase"
              defaultValue={defaultValues?.addressState ?? ""}
            />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="addressZip">CEP</Label>
            <Input id="addressZip" name="addressZip" defaultValue={defaultValues?.addressZip ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.values(CustomerClassification).map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="classifications"
                value={value}
                defaultChecked={defaultValues?.classifications?.includes(value)}
                className="size-4 rounded border-input accent-primary"
              />
              {CLASSIFICATION_LABELS[value]}
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Crédito</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="creditLimit">Limite de crédito (R$)</Label>
            <Input
              id="creditLimit"
              name="creditLimit"
              type="number"
              step="0.01"
              min="0"
              placeholder="Sem limite"
              defaultValue={defaultValues?.creditLimit ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {mode === "create" ? "Criar cliente" : "Salvar alterações"}
      </Button>
    </form>
  );
}
