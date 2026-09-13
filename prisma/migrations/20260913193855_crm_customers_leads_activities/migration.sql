-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('PF', 'PJ');

-- CreateEnum
CREATE TYPE "CustomerClassification" AS ENUM ('CONSUMIDOR_FINAL', 'PROFISSIONAL_CONSTRUCAO', 'PEDREIRO', 'ELETRICISTA', 'ENCANADOR', 'PINTOR', 'EMPREITEIRO', 'CONSTRUTORA', 'CONDOMINIO', 'EMPRESA', 'REVENDEDOR', 'CLIENTE_RECORRENTE', 'CLIENTE_VIP');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('LIGACAO', 'WHATSAPP', 'EMAIL', 'VISITA', 'REUNIAO', 'NOTA');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TELEFONE', 'SITE', 'INDICACAO', 'LOJA_FISICA', 'VENDEDOR', 'CAMPANHA', 'OUTROS');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NOVO_LEAD', 'PRIMEIRO_CONTATO', 'QUALIFICACAO', 'ORCAMENTO_SOLICITADO', 'ORCAMENTO_ENVIADO', 'NEGOCIACAO', 'AGUARDANDO_PAGAMENTO', 'PEDIDO_CRIADO', 'VENDA_REALIZADA', 'PERDIDO');

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "type" "CustomerType" NOT NULL,
    "fullName" TEXT,
    "cpf" TEXT,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3),
    "companyName" TEXT,
    "tradeName" TEXT,
    "cnpj" TEXT,
    "stateTaxId" TEXT,
    "municipalTaxId" TEXT,
    "responsibleName" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "addressNeighborhood" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "classifications" "CustomerClassification"[],
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_contacts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "leadId" TEXT,
    "type" "ActivityType" NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerId" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "responsibleId" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'OUTROS',
    "stage" "LeadStage" NOT NULL DEFAULT 'NOVO_LEAD',
    "estimatedValue" DECIMAL(12,2),
    "probability" INTEGER,
    "expectedCloseDate" TIMESTAMP(3),
    "notes" TEXT,
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customers_fullName_idx" ON "customers"("fullName");

-- CreateIndex
CREATE INDEX "customers_companyName_idx" ON "customers"("companyName");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cpf_key" ON "customers"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "customers_cnpj_key" ON "customers"("cnpj");

-- CreateIndex
CREATE INDEX "customer_contacts_customerId_idx" ON "customer_contacts"("customerId");

-- CreateIndex
CREATE INDEX "activities_customerId_idx" ON "activities"("customerId");

-- CreateIndex
CREATE INDEX "activities_leadId_idx" ON "activities"("leadId");

-- CreateIndex
CREATE INDEX "leads_customerId_idx" ON "leads"("customerId");

-- CreateIndex
CREATE INDEX "leads_responsibleId_idx" ON "leads"("responsibleId");

-- CreateIndex
CREATE INDEX "leads_stage_idx" ON "leads"("stage");

-- AddForeignKey
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
