import {
  ActivityType,
  CustomerClassification,
  CustomerType,
  LeadSource,
  LeadStage,
} from "@/generated/prisma/enums";

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  [CustomerType.PF]: "Pessoa física",
  [CustomerType.PJ]: "Pessoa jurídica",
};

export const CLASSIFICATION_LABELS: Record<CustomerClassification, string> = {
  [CustomerClassification.CONSUMIDOR_FINAL]: "Consumidor final",
  [CustomerClassification.PROFISSIONAL_CONSTRUCAO]: "Profissional da construção",
  [CustomerClassification.PEDREIRO]: "Pedreiro",
  [CustomerClassification.ELETRICISTA]: "Eletricista",
  [CustomerClassification.ENCANADOR]: "Encanador",
  [CustomerClassification.PINTOR]: "Pintor",
  [CustomerClassification.EMPREITEIRO]: "Empreiteiro",
  [CustomerClassification.CONSTRUTORA]: "Construtora",
  [CustomerClassification.CONDOMINIO]: "Condomínio",
  [CustomerClassification.EMPRESA]: "Empresa",
  [CustomerClassification.REVENDEDOR]: "Revendedor",
  [CustomerClassification.CLIENTE_RECORRENTE]: "Cliente recorrente",
  [CustomerClassification.CLIENTE_VIP]: "Cliente VIP",
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.LIGACAO]: "Ligação",
  [ActivityType.WHATSAPP]: "WhatsApp",
  [ActivityType.EMAIL]: "E-mail",
  [ActivityType.VISITA]: "Visita",
  [ActivityType.REUNIAO]: "Reunião",
  [ActivityType.NOTA]: "Nota",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  [LeadSource.WHATSAPP]: "WhatsApp",
  [LeadSource.INSTAGRAM]: "Instagram",
  [LeadSource.FACEBOOK]: "Facebook",
  [LeadSource.TELEFONE]: "Telefone",
  [LeadSource.SITE]: "Site",
  [LeadSource.INDICACAO]: "Indicação",
  [LeadSource.LOJA_FISICA]: "Loja física",
  [LeadSource.VENDEDOR]: "Vendedor",
  [LeadSource.CAMPANHA]: "Campanha",
  [LeadSource.OUTROS]: "Outros",
};

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  [LeadStage.NOVO_LEAD]: "Novo lead",
  [LeadStage.PRIMEIRO_CONTATO]: "Primeiro contato",
  [LeadStage.QUALIFICACAO]: "Qualificação",
  [LeadStage.ORCAMENTO_SOLICITADO]: "Orçamento solicitado",
  [LeadStage.ORCAMENTO_ENVIADO]: "Orçamento enviado",
  [LeadStage.NEGOCIACAO]: "Negociação",
  [LeadStage.AGUARDANDO_PAGAMENTO]: "Aguardando pagamento",
  [LeadStage.PEDIDO_CRIADO]: "Pedido criado",
  [LeadStage.VENDA_REALIZADA]: "Venda realizada",
  [LeadStage.PERDIDO]: "Perdido",
};

export const LEAD_STAGES_ORDER: LeadStage[] = [
  LeadStage.NOVO_LEAD,
  LeadStage.PRIMEIRO_CONTATO,
  LeadStage.QUALIFICACAO,
  LeadStage.ORCAMENTO_SOLICITADO,
  LeadStage.ORCAMENTO_ENVIADO,
  LeadStage.NEGOCIACAO,
  LeadStage.AGUARDANDO_PAGAMENTO,
  LeadStage.PEDIDO_CRIADO,
  LeadStage.VENDA_REALIZADA,
  LeadStage.PERDIDO,
];

export function customerDisplayName(customer: {
  type: CustomerType;
  fullName: string | null;
  companyName: string | null;
  tradeName: string | null;
}) {
  if (customer.type === CustomerType.PF) return customer.fullName ?? "";
  return customer.tradeName || customer.companyName || "";
}

export function customerDocument(customer: { type: CustomerType; cpf: string | null; cnpj: string | null }) {
  return customer.type === CustomerType.PF ? customer.cpf : customer.cnpj;
}
