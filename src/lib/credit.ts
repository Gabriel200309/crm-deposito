import { prisma } from "@/lib/prisma";

/** Soma o saldo em aberto (valor - pagamentos) de todas as parcelas não canceladas do cliente. */
export async function getCustomerCreditUsed(customerId: string) {
  const receivables = await prisma.accountsReceivable.findMany({
    where: { customerId, cancelled: false },
    include: { payments: { select: { amount: true } } },
  });
  return receivables.reduce((sum, receivable) => {
    const paid = receivable.payments.reduce((s, p) => s + Number(p.amount), 0);
    const balance = Number(receivable.amount) - paid;
    return sum + Math.max(balance, 0);
  }, 0);
}

export async function checkCustomerCredit(customerId: string, additionalAmount: number) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { creditLimit: true },
  });
  if (!customer?.creditLimit) {
    // Sem limite configurado: não há restrição de crédito para este cliente.
    return { withinLimit: true, limit: null, used: 0, available: null };
  }
  const limit = Number(customer.creditLimit);
  const used = await getCustomerCreditUsed(customerId);
  const available = limit - used;
  return { withinLimit: available >= additionalAmount, limit, used, available };
}
