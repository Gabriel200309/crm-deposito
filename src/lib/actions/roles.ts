"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { MODULES, PermissionAction } from "@/lib/permissions";

export async function setRolePermissionAction(
  roleId: string,
  permissionId: string,
  granted: boolean,
) {
  const actor = await requirePermission(MODULES.PERFIS, PermissionAction.EDIT);

  if (granted) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      create: { roleId, permissionId },
      update: {},
    });
  } else {
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }

  await logAudit({
    userId: actor.id,
    action: granted ? "role.permission.grant" : "role.permission.revoke",
    entityType: "Role",
    entityId: roleId,
    changes: { permissionId, granted },
  });

  revalidatePath(`/perfis/${roleId}`);
}
