import { StockMovementType } from "@/generated/prisma/enums";

export const STOCK_MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  [StockMovementType.ENTRADA]: "Entrada",
  [StockMovementType.SAIDA]: "Saída",
  [StockMovementType.AJUSTE_ENTRADA]: "Ajuste (aumento)",
  [StockMovementType.AJUSTE_SAIDA]: "Ajuste (redução)",
  [StockMovementType.PERDA]: "Perda",
  [StockMovementType.AVARIA]: "Avaria",
  [StockMovementType.TRANSFERENCIA]: "Transferência",
};

// Tipos que o usuário pode lançar manualmente no módulo de estoque. "Venda" e
// "devolução" não estão aqui: serão criados automaticamente pelas Fases 5
// (Pedidos) e de Devoluções quando existirem.
export const MANUAL_STOCK_MOVEMENT_TYPES: StockMovementType[] = [
  StockMovementType.ENTRADA,
  StockMovementType.SAIDA,
  StockMovementType.AJUSTE_ENTRADA,
  StockMovementType.AJUSTE_SAIDA,
  StockMovementType.PERDA,
  StockMovementType.AVARIA,
  StockMovementType.TRANSFERENCIA,
];

const INCREASE_TYPES = new Set<StockMovementType>([
  StockMovementType.ENTRADA,
  StockMovementType.AJUSTE_ENTRADA,
]);

/** true = aumenta o estoque, false = diminui o estoque. */
export function movementIncreasesStock(type: StockMovementType) {
  return INCREASE_TYPES.has(type);
}
