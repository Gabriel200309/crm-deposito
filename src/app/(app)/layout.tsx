import { requireUser, hasPermission } from "@/lib/rbac";
import { MODULES, PermissionAction } from "@/lib/permissions";
import { AppShell, type NavItem } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const [
    canViewUsers,
    canViewRoles,
    canViewCustomers,
    canViewLeads,
    canViewProducts,
    canViewStock,
    canViewOrders,
    canViewSalespeople,
    canViewCommissions,
    canViewFinance,
    canViewDrivers,
    canViewDeliveries,
  ] = await Promise.all([
    hasPermission(user.roleId, MODULES.USUARIOS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.PERFIS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.CLIENTES, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.LEADS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.PRODUTOS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.ESTOQUE, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.PEDIDOS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.VENDEDORES, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.COMISSOES, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.FINANCEIRO, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.MOTORISTAS, PermissionAction.VIEW),
    hasPermission(user.roleId, MODULES.ENTREGAS, PermissionAction.VIEW),
  ]);

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Dashboard" },
    ...(canViewCustomers ? [{ href: "/clientes", label: "Clientes" }] : []),
    ...(canViewLeads ? [{ href: "/leads", label: "Funil de vendas" }] : []),
    ...(canViewOrders ? [{ href: "/pedidos", label: "Orçamentos e pedidos" }] : []),
    ...(canViewProducts ? [{ href: "/produtos", label: "Produtos" }] : []),
    ...(canViewStock ? [{ href: "/estoque", label: "Estoque" }] : []),
    ...(canViewSalespeople ? [{ href: "/vendedores", label: "Vendedores" }] : []),
    ...(canViewCommissions ? [{ href: "/comissoes", label: "Comissões" }] : []),
    ...(canViewFinance ? [{ href: "/financeiro/receber", label: "Financeiro" }] : []),
    ...(canViewDeliveries ? [{ href: "/entregas", label: "Entregas" }] : []),
    ...(canViewDrivers ? [{ href: "/motoristas", label: "Motoristas" }] : []),
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
