import { DeliveryType, OrderStatus, PaymentMethod } from "@/generated/prisma/enums";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.RASCUNHO]: "Rascunho",
  [OrderStatus.ORCAMENTO]: "Orçamento",
  [OrderStatus.AGUARDANDO_APROVACAO]: "Aguardando aprovação",
  [OrderStatus.AGUARDANDO_PAGAMENTO]: "Aguardando pagamento",
  [OrderStatus.PAGAMENTO_CONFIRMADO]: "Pagamento confirmado",
  [OrderStatus.EM_SEPARACAO]: "Em separação",
  [OrderStatus.SEPARADO]: "Separado",
  [OrderStatus.FATURADO]: "Faturado",
  [OrderStatus.EM_TRANSPORTE]: "Em transporte",
  [OrderStatus.ENTREGUE]: "Entregue",
  [OrderStatus.CANCELADO]: "Cancelado",
  [OrderStatus.PERDIDO]: "Perdido",
};

// Ordem do pipeline normal, para o seletor de status. Cancelado/Perdido são
// estados finais alcançáveis a partir de qualquer estágio anterior a
// Faturado, por isso ficam de fora da progressão linear mas continuam
// selecionáveis.
export const ORDER_STATUS_PIPELINE: OrderStatus[] = [
  OrderStatus.RASCUNHO,
  OrderStatus.ORCAMENTO,
  OrderStatus.AGUARDANDO_APROVACAO,
  OrderStatus.AGUARDANDO_PAGAMENTO,
  OrderStatus.PAGAMENTO_CONFIRMADO,
  OrderStatus.EM_SEPARACAO,
  OrderStatus.SEPARADO,
  OrderStatus.FATURADO,
  OrderStatus.EM_TRANSPORTE,
  OrderStatus.ENTREGUE,
];

export const ORDER_FINAL_STATUSES: OrderStatus[] = [OrderStatus.CANCELADO, OrderStatus.PERDIDO];

// Depois de faturado, o pedido já baixou estoque e gerou comissão — não dá
// para simplesmente cancelar/voltar sem um fluxo de devolução (futuro), então
// travamos a edição de itens e o cancelamento direto a partir daqui.
export const ORDER_LOCKED_STATUSES: OrderStatus[] = [
  OrderStatus.FATURADO,
  OrderStatus.EM_TRANSPORTE,
  OrderStatus.ENTREGUE,
  OrderStatus.CANCELADO,
  OrderStatus.PERDIDO,
];

export function isOrderEditable(status: OrderStatus) {
  return !ORDER_LOCKED_STATUSES.includes(status);
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.DINHEIRO]: "Dinheiro",
  [PaymentMethod.PIX]: "Pix",
  [PaymentMethod.CARTAO_CREDITO]: "Cartão de crédito",
  [PaymentMethod.CARTAO_DEBITO]: "Cartão de débito",
  [PaymentMethod.BOLETO]: "Boleto",
  [PaymentMethod.TRANSFERENCIA]: "Transferência",
  [PaymentMethod.CREDIARIO]: "Crediário",
  [PaymentMethod.OUTROS]: "Outros",
};

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  [DeliveryType.RETIRADA]: "Retirada na loja",
  [DeliveryType.ENTREGA]: "Entrega",
};

export function formatMoney(value: unknown) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}
