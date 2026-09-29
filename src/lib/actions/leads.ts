"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { LeadSource, LeadStage } from "@/generated/prisma/client";
import { parseDateOnly } from "@/lib/dates";

export type ActionState = { success: boolean; error?: string };

const leadSchema = z.object({
  title: z.string().min(2, "Informe um título para o lead"),
  customerId: z.string().optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.union([z.email(), z.literal("")]).optional(),
  responsibleId: z.string().optional(),
  source: z.enum(LeadSource),
  estimatedValue: z.string().optional(),
  probability: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  notes: z.string().optional(),
});

function noneToUndefined(value: FormDataEntryValue | null) {
  return !value || value === "none" ? undefined : (value as string);
}

function parseLeadForm(formData: FormData) {
  return leadSchema.safeParse({
    title: formData.get("title"),
    customerId: noneToUndefined(formData.get("customerId")),
    contactName: formData.get("contactName") || undefined,
    contactPhone: formData.get("contactPhone") || undefined,
    contactEmail: formData.get("contactEmail") || undefined,
    responsibleId: noneToUndefined(formData.get("responsibleId")),
    source: formData.get("source"),
    estimatedValue: formData.get("estimatedValue") || undefined,
    probability: formData.get("probability") || undefined,
    expectedCloseDate: formData.get("expectedCloseDate") || undefined,
    notes: formData.get("notes") || undefined,
  });
}

function toLeadData(data: z.infer<typeof leadSchema>) {
  return {
    title: data.title,
    customerId: data.customerId || null,
    contactName: data.contactName || null,
    contactPhone: data.contactPhone || null,
    contactEmail: data.contactEmail || null,
    responsibleId: data.responsibleId || null,
    source: data.source,
    estimatedValue: data.estimatedValue ? data.estimatedValue : null,
    probability: data.probability ? Number(data.probability) : null,
    expectedCloseDate: data.expectedCloseDate ? parseDateOnly(data.expectedCloseDate) : null,
    notes: data.notes || null,
  };
}

export async function createLeadAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.LEADS, PermissionAction.CREATE);

  const parsed = parseLeadForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const created = await prisma.lead.create({ data: toLeadData(parsed.data) });

  await logAudit({
    userId: actor.id,
    action: "lead.create",
    entityType: "Lead",
    entityId: created.id,
  });

  revalidatePath("/leads");
  redirect(`/leads/${created.id}`);
}

export async function updateLeadAction(
  leadId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.LEADS, PermissionAction.EDIT);

  const parsed = parseLeadForm(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const updated = await prisma.lead.update({ where: { id: leadId }, data: toLeadData(parsed.data) });

  await logAudit({
    userId: actor.id,
    action: "lead.update",
    entityType: "Lead",
    entityId: updated.id,
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}`);
}

export async function changeLeadStageAction(leadId: string, stage: LeadStage, lostReason?: string) {
  const actor = await requirePermission(MODULES.LEADS, PermissionAction.EDIT);

  const updated = await prisma.lead.update({
    where: { id: leadId },
    data: {
      stage,
      lostReason: stage === LeadStage.PERDIDO ? lostReason || null : null,
    },
  });

  await logAudit({
    userId: actor.id,
    action: "lead.stage_change",
    entityType: "Lead",
    entityId: updated.id,
    changes: { stage, lostReason: updated.lostReason },
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${leadId}`);
}
