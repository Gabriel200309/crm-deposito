"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export type ActionState = { success: boolean; error?: string };

const contactSchema = z.object({
  name: z.string().min(2, "Informe o nome do contato"),
  role: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.union([z.email(), z.literal("")]).optional(),
  notes: z.string().optional(),
});

export async function createContactAction(
  customerId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const actor = await requirePermission(MODULES.CLIENTES, PermissionAction.EDIT);

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    role: formData.get("role") || undefined,
    phone: formData.get("phone") || undefined,
    whatsapp: formData.get("whatsapp") || undefined,
    email: formData.get("email") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const created = await prisma.customerContact.create({
    data: { customerId, ...parsed.data },
  });

  await logAudit({
    userId: actor.id,
    action: "customer.contact.create",
    entityType: "CustomerContact",
    entityId: created.id,
    changes: { customerId },
  });

  revalidatePath(`/clientes/${customerId}`);
  return { success: true };
}

export async function deleteContactAction(customerId: string, contactId: string) {
  const actor = await requirePermission(MODULES.CLIENTES, PermissionAction.EDIT);

  await prisma.customerContact.delete({ where: { id: contactId } });

  await logAudit({
    userId: actor.id,
    action: "customer.contact.delete",
    entityType: "CustomerContact",
    entityId: contactId,
    changes: { customerId },
  });

  revalidatePath(`/clientes/${customerId}`);
}
