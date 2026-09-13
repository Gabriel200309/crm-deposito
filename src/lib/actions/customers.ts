"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { CustomerClassification, CustomerType } from "@/generated/prisma/client";

export type ActionState = { success: boolean; error?: string };

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

const baseSchema = z.object({
  type: z.enum(CustomerType),
  fullName: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  companyName: z.string().optional(),
  tradeName: z.string().optional(),
  cnpj: z.string().optional(),
  stateTaxId: z.string().optional(),
  municipalTaxId: z.string().optional(),
  responsibleName: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  addressStreet: z.string().optional(),
  addressNumber: z.string().optional(),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressZip: z.string().optional(),
  classifications: z.array(z.enum(CustomerClassification)).optional(),
  notes: z.string().optional(),
});

const customerSchema = baseSchema.superRefine((data, ctx) => {
  if (data.type === CustomerType.PF) {
    if (!data.fullName || data.fullName.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["fullName"], message: "Informe o nome completo" });
    }
    if (data.cpf && onlyDigits(data.cpf).length !== 11) {
      ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF deve ter 11 dígitos" });
    }
  } else {
    if (!data.companyName || data.companyName.trim().length < 2) {
      ctx.addIssue({ code: "custom", path: ["companyName"], message: "Informe a razão social" });
    }
    if (data.cnpj && onlyDigits(data.cnpj).length !== 14) {
      ctx.addIssue({ code: "custom", path: ["cnpj"], message: "CNPJ deve ter 14 dígitos" });
    }
  }
});

function parseCustomerForm(formData: FormData) {
  return customerSchema.safeParse({
    type: formData.get("type"),
    fullName: formData.get("fullName") || undefined,
    cpf: formData.get("cpf") || undefined,
    rg: formData.get("rg") || undefined,
    birthDate: formData.get("birthDate") || undefined,
    companyName: formData.get("companyName") || undefined,
    tradeName: formData.get("tradeName") || undefined,
    cnpj: formData.get("cnpj") || undefined,
    stateTaxId: formData.get("stateTaxId") || undefined,
    municipalTaxId: formData.get("municipalTaxId") || undefined,
    responsibleName: formData.get("responsibleName") || undefined,
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    addressStreet: formData.get("addressStreet") || undefined,
    addressNumber: formData.get("addressNumber") || undefined,
    addressComplement: formData.get("addressComplement") || undefined,
    addressNeighborhood: formData.get("addressNeighborhood") || undefined,
    addressCity: formData.get("addressCity") || undefined,
    addressState: formData.get("addressState") || undefined,
    addressZip: formData.get("addressZip") || undefined,
    classifications: formData.getAll("classifications"),
    notes: formData.get("notes") || undefined,
  });
}

function toCustomerData(data: z.infer<typeof customerSchema>) {
  return {
    type: data.type,
    fullName: data.type === CustomerType.PF ? data.fullName : null,
    cpf: data.type === CustomerType.PF && data.cpf ? onlyDigits(data.cpf) : null,
    rg: data.type === CustomerType.PF ? data.rg || null : null,
    birthDate: data.type === CustomerType.PF && data.birthDate ? new Date(data.birthDate) : null,
    companyName: data.type === CustomerType.PJ ? data.companyName : null,
    tradeName: data.type === CustomerType.PJ ? data.tradeName || null : null,
    cnpj: data.type === CustomerType.PJ && data.cnpj ? onlyDigits(data.cnpj) : null,
    stateTaxId: data.type === CustomerType.PJ ? data.stateTaxId || null : null,
    municipalTaxId: data.type === CustomerType.PJ ? data.municipalTaxId || null : null,
    responsibleName: data.type === CustomerType.PJ ? data.responsibleName || null : null,
    phone: data.phone || null,
    whatsapp: data.whatsapp || null,
    email: data.email || null,
    addressStreet: data.addressStreet || null,
    addressNumber: data.addressNumber || null,
    addressComplement: data.addressComplement || null,
    addressNeighborhood: data.addressNeighborhood || null,
    addressCity: data.addressCity || null,
    addressState: data.addressState || null,
    addressZip: data.addressZip || null,
    classifications: data.classifications ?? [],
    notes: data.notes || null,
  };
}

export async function createCustomerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.CLIENTES, PermissionAction.CREATE);

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = toCustomerData(parsed.data);

  if (data.cpf) {
    const existing = await prisma.customer.findUnique({ where: { cpf: data.cpf } });
    if (existing) return { success: false, error: "Já existe um cliente com este CPF" };
  }
  if (data.cnpj) {
    const existing = await prisma.customer.findUnique({ where: { cnpj: data.cnpj } });
    if (existing) return { success: false, error: "Já existe um cliente com este CNPJ" };
  }

  const created = await prisma.customer.create({ data });

  await logAudit({
    userId: actor.id,
    action: "customer.create",
    entityType: "Customer",
    entityId: created.id,
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${created.id}`);
}

export async function updateCustomerAction(
  customerId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.CLIENTES, PermissionAction.EDIT);

  const parsed = parseCustomerForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const data = toCustomerData(parsed.data);

  if (data.cpf) {
    const existing = await prisma.customer.findUnique({ where: { cpf: data.cpf } });
    if (existing && existing.id !== customerId) {
      return { success: false, error: "Já existe um cliente com este CPF" };
    }
  }
  if (data.cnpj) {
    const existing = await prisma.customer.findUnique({ where: { cnpj: data.cnpj } });
    if (existing && existing.id !== customerId) {
      return { success: false, error: "Já existe um cliente com este CNPJ" };
    }
  }

  const updated = await prisma.customer.update({ where: { id: customerId }, data });

  await logAudit({
    userId: actor.id,
    action: "customer.update",
    entityType: "Customer",
    entityId: updated.id,
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${customerId}`);
  redirect(`/clientes/${customerId}`);
}

export async function toggleCustomerActiveAction(customerId: string) {
  const actor = await requirePermission(MODULES.CLIENTES, PermissionAction.DELETE);

  const target = await prisma.customer.findUniqueOrThrow({ where: { id: customerId } });
  const updated = await prisma.customer.update({
    where: { id: customerId },
    data: { active: !target.active },
  });

  await logAudit({
    userId: actor.id,
    action: updated.active ? "customer.activate" : "customer.deactivate",
    entityType: "Customer",
    entityId: updated.id,
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${customerId}`);
}
