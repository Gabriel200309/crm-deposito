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
  PRODUTOS: "produtos",
  ESTOQUE: "estoque",
  PEDIDOS: "pedidos",
  VENDEDORES: "vendedores",
  COMISSOES: "comissoes",
} as const;

const CRUD = [
  PermissionAction.VIEW,
  PermissionAction.CREATE,
  PermissionAction.EDIT,
  PermissionAction.DELETE,
];

// Módulos de gestão usam CRUD completo; dashboard é só leitura. Estoque só
// tem visualizar/criar — movimentações são registros imutáveis, não se
// editam nem se excluem (corrige-se com uma nova movimentação). Em pedidos,
// "excluir" é usado como a permissão de cancelar/perder um pedido — mais
// restrita que apenas editar/avançar o status. Comissões só tem
// visualizar/editar (editar = marcar como paga).
const PERMISSION_SEED: Array<{ module: string; action: PermissionAction }> = [
  { module: MODULES.DASHBOARD, action: PermissionAction.VIEW },
  ...CRUD.map((action) => ({ module: MODULES.USUARIOS, action })),
  ...CRUD.map((action) => ({ module: MODULES.PERFIS, action })),
  ...CRUD.map((action) => ({ module: MODULES.CLIENTES, action })),
  ...CRUD.map((action) => ({ module: MODULES.LEADS, action })),
  ...CRUD.map((action) => ({ module: MODULES.PRODUTOS, action })),
  { module: MODULES.ESTOQUE, action: PermissionAction.VIEW },
  { module: MODULES.ESTOQUE, action: PermissionAction.CREATE },
  ...CRUD.map((action) => ({ module: MODULES.PEDIDOS, action })),
  ...CRUD.map((action) => ({ module: MODULES.VENDEDORES, action })),
  { module: MODULES.COMISSOES, action: PermissionAction.VIEW },
  { module: MODULES.COMISSOES, action: PermissionAction.EDIT },
];

// Perfis padrão do sistema (seção 22 do escopo). Todo perfil recebe acesso ao
// dashboard; os módulos abaixo são concedidos conforme cada fase é
// implementada (Financeiro/Fiscal/Entregador ainda não têm módulo próprio,
// então ficam só com o dashboard por enquanto). `viewOnlyModules` concede
// apenas a permissão de visualizar (ex: vendedor/estoquista consultando o
// catálogo sem poder alterar preços ou cadastro).
const ROLE_SEED = [
  {
    name: "Administrador",
    description: "Acesso total ao sistema.",
    allPermissions: true,
  },
  {
    name: "Gerente",
    description: "Vendas, clientes, estoque, financeiro e relatórios.",
    modules: [
      MODULES.CLIENTES,
      MODULES.LEADS,
      MODULES.PRODUTOS,
      MODULES.ESTOQUE,
      MODULES.PEDIDOS,
      MODULES.VENDEDORES,
      MODULES.COMISSOES,
    ],
  },
  {
    name: "Vendedor",
    description: "Clientes, leads, orçamentos, pedidos e suas vendas.",
    modules: [MODULES.CLIENTES, MODULES.LEADS],
    viewOnlyModules: [MODULES.PRODUTOS],
    // Vendedor cria e avança seus pedidos, mas não pode cancelar/marcar como
    // perdido sozinho (ação de "excluir" em pedidos) — isso fica com o Gerente.
    partialModules: [
      { module: MODULES.PEDIDOS, actions: [PermissionAction.VIEW, PermissionAction.CREATE, PermissionAction.EDIT] },
      { module: MODULES.COMISSOES, actions: [PermissionAction.VIEW] },
    ],
  },
  {
    name: "Estoquista",
    description: "Estoque, separação, entrada e saída de mercadorias.",
    modules: [MODULES.ESTOQUE],
    viewOnlyModules: [MODULES.PRODUTOS],
  },
  { name: "Financeiro", description: "Contas, recebimentos, pagamentos e inadimplência.", modules: [] },
  { name: "Fiscal", description: "Notas fiscais e documentos fiscais.", modules: [] },
  { name: "Entregador", description: "Entregas atribuídas ao entregador.", modules: [] },
];

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "gabriel.camiloo20211@gmail.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Deposito@123";

// Unidades de medida padrão (seção 6 do escopo).
const UNIT_SEED = [
  { code: "UN", label: "Unidade" },
  { code: "KG", label: "Quilograma" },
  { code: "M", label: "Metro" },
  { code: "M2", label: "Metro quadrado" },
  { code: "M3", label: "Metro cúbico" },
  { code: "LT", label: "Litro" },
  { code: "CX", label: "Caixa" },
  { code: "SC", label: "Saco" },
  { code: "PC", label: "Peça" },
  { code: "ROLO", label: "Rolo" },
  { code: "BARRA", label: "Barra" },
  { code: "FARDO", label: "Fardo" },
];

// Categorias e subcategorias padrão (seção 7 do escopo) — ponto de partida
// configurável pelo administrador, não uma lista fechada.
const CATEGORY_SEED: Array<{ name: string; children: string[] }> = [
  { name: "Materiais básicos", children: ["Cimento", "Areia", "Brita", "Argamassa", "Cal"] },
  { name: "Elétrica", children: ["Fios", "Cabos", "Tomadas", "Interruptores", "Disjuntores", "Conduítes"] },
  { name: "Hidráulica", children: ["Tubos", "Conexões", "Registros", "Torneiras", "Caixas d'água"] },
  { name: "Ferramentas", children: ["Furadeiras", "Serras", "Martelos", "Ferramentas manuais"] },
  { name: "Pintura", children: ["Tintas", "Massas", "Rolos", "Pincéis", "Solventes"] },
  { name: "Acabamento", children: ["Pisos", "Revestimentos", "Rejuntes", "Louças", "Metais"] },
];

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

    const viewOnlyModules = (roleSeed as { viewOnlyModules?: readonly string[] }).viewOnlyModules ?? [];
    const partialModules =
      (roleSeed as { partialModules?: readonly { module: string; actions: readonly PermissionAction[] }[] })
        .partialModules ?? [];
    const grantedPermissionIds = roleSeed.allPermissions
      ? permissions.map((p) => p.id)
      : [
          dashboardViewPermission.id,
          ...permissions
            .filter((p) => (roleSeed.modules as readonly string[]).includes(p.module))
            .map((p) => p.id),
          ...permissions
            .filter((p) => viewOnlyModules.includes(p.module) && p.action === PermissionAction.VIEW)
            .map((p) => p.id),
          ...permissions
            .filter((p) =>
              partialModules.some((pm) => pm.module === p.module && pm.actions.includes(p.action)),
            )
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

  for (const unit of UNIT_SEED) {
    await prisma.unit.upsert({
      where: { code: unit.code },
      create: unit,
      update: { label: unit.label },
    });
  }

  for (const category of CATEGORY_SEED) {
    const parent =
      (await prisma.category.findFirst({ where: { parentId: null, name: category.name } })) ??
      (await prisma.category.create({ data: { name: category.name } }));
    for (const childName of category.children) {
      await prisma.category.upsert({
        where: { parentId_name: { parentId: parent.id, name: childName } },
        create: { name: childName, parentId: parent.id },
        update: {},
      });
    }
  }

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
