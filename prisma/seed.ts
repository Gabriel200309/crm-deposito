import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, PermissionAction } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const MODULES = {
  USUARIOS: "usuarios",
  PERFIS: "perfis",
  DASHBOARD: "dashboard",
  CLIENTES: "clientes",
  LEADS: "leads",
} as const;

const CRUD = [
  PermissionAction.VIEW,
  PermissionAction.CREATE,
  PermissionAction.EDIT,
  PermissionAction.DELETE,
];

// Módulos de gestão usam CRUD completo; dashboard é só leitura.
const PERMISSION_SEED: Array<{ module: string; action: PermissionAction }> = [
  { module: MODULES.DASHBOARD, action: PermissionAction.VIEW },
  ...CRUD.map((action) => ({ module: MODULES.USUARIOS, action })),
  ...CRUD.map((action) => ({ module: MODULES.PERFIS, action })),
  ...CRUD.map((action) => ({ module: MODULES.CLIENTES, action })),
  ...CRUD.map((action) => ({ module: MODULES.LEADS, action })),
];

// Perfis padrão do sistema (seção 22 do escopo). Todo perfil recebe acesso ao
// dashboard; os módulos abaixo são concedidos conforme cada fase é
// implementada (Estoquista/Financeiro/Fiscal/Entregador ainda não têm módulo
// próprio, então ficam só com o dashboard por enquanto).
const ROLE_SEED = [
  {
    name: "Administrador",
    description: "Acesso total ao sistema.",
    allPermissions: true,
  },
  {
    name: "Gerente",
    description: "Vendas, clientes, estoque, financeiro e relatórios.",
    modules: [MODULES.CLIENTES, MODULES.LEADS],
  },
  {
    name: "Vendedor",
    description: "Clientes, leads, orçamentos, pedidos e suas vendas.",
    modules: [MODULES.CLIENTES, MODULES.LEADS],
  },
  { name: "Estoquista", description: "Estoque, separação, entrada e saída de mercadorias.", modules: [] },
  { name: "Financeiro", description: "Contas, recebimentos, pagamentos e inadimplência.", modules: [] },
  { name: "Fiscal", description: "Notas fiscais e documentos fiscais.", modules: [] },
  { name: "Entregador", description: "Entregas atribuídas ao entregador.", modules: [] },
];

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "gabriel.camiloo20211@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Deposito@123";

async function main() {
  const permissions = await Promise.all(
    PERMISSION_SEED.map((p) =>
      prisma.permission.upsert({
        where: { module_action: { module: p.module, action: p.action } },
        create: p,
        update: {},
      }),
    ),
  );
  const dashboardViewPermission = permissions.find(
    (p) => p.module === MODULES.DASHBOARD && p.action === PermissionAction.VIEW,
  )!;

  const roles = new Map<string, { id: string }>();
  for (const roleSeed of ROLE_SEED) {
    const role = await prisma.role.upsert({
      where: { name: roleSeed.name },
      create: { name: roleSeed.name, description: roleSeed.description, isSystem: true },
      update: { description: roleSeed.description },
    });
    roles.set(roleSeed.name, role);

    const grantedPermissionIds = roleSeed.allPermissions
      ? permissions.map((p) => p.id)
      : [
          dashboardViewPermission.id,
          ...permissions
            .filter((p) => (roleSeed.modules as readonly string[]).includes(p.module))
            .map((p) => p.id),
        ];

    for (const permissionId of grantedPermissionIds) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        create: { roleId: role.id, permissionId },
        update: {},
      });
    }
  }

  const adminRole = roles.get("Administrador")!;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    create: {
      name: "Administrador",
      email: ADMIN_EMAIL,
      passwordHash,
      roleId: adminRole.id,
    },
    update: {},
  });

  console.log("\nSeed concluído.");
  console.log(`Login: ${ADMIN_EMAIL}`);
  console.log(`Senha: ${ADMIN_PASSWORD} (troque após o primeiro acesso)\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
