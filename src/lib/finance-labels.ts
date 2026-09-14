import { PayableStatus } from "@/generated/prisma/enums";

export const PAYABLE_STATUS_LABELS: Record<PayableStatus, string> = {
  [PayableStatus.ABERTO]: "Aberto",
  [PayableStatus.PAGO]: "Pago",
  [PayableStatus.CANCELADO]: "Cancelado",
};

export type ReceivableComputedStatus = "ABERTO" | "PARCIALMENTE_PAGO" | "PAGO" | "VENCIDO" | "CANCELADO";

export const RECEIVABLE_STATUS_LABELS: Record<ReceivableComputedStatus, string> = {
  ABERTO: "Aberto",
  PARCIALMENTE_PAGO: "Parcialmente pago",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

/**
 * "Vencido"/"pago"/"parcialmente pago" são calculados a partir do valor, da
 * soma de pagamentos e da data de vencimento — não são um estado gravado.
 * Só `cancelled` é persistido, porque não dá pra derivar isso de outra coisa.
 */
export function computeReceivableStatus(params: {
  amount: number | string;
  dueDate: Date;
  totalPaid: number;
  cancelled: boolean;
}): ReceivableComputedStatus {
  if (params.cancelled) return "CANCELADO";
  const amount = Number(params.amount);
  if (params.totalPaid >= amount) return "PAGO";
  if (params.totalPaid > 0) return "PARCIALMENTE_PAGO";
  if (params.dueDate.getTime() < Date.now()) return "VENCIDO";
  return "ABERTO";
}

/** Divide um total em N parcelas, jogando o resto da divisão na última. */
export function splitInstallments(total: number, installments: number): number[] {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / installments);
  const remainder = cents - base * installments;
  return Array.from({ length: installments }, (_, i) =>
    (i === installments - 1 ? base + remainder : base) / 100,
  );
}
