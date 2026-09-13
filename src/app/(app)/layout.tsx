import { requireUser, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { AppShell, type NavItem } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [canViewUsers, canViewRoles] = await Promise.all([
    hasPermission(user.roleId, MODULES.USUARIOS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.PERFIS, PermissionAction.VIEW),
  ]);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    ...(canViewUsers ? [{ href: "/usuarios", label: "Usuários" }] : []),
    ...(canViewRoles ? [{ href: "/perfis", label: "Perfis e permissões" }] : []),
  ];

  return (
    <AppShell
      user={{ name: user.name ?? user.email ?? "Usuário", email: user.email ?? "", roleName: user.roleName }}
      navItems={navItems}
    >
      {children}
    </AppShell>
  );
}
