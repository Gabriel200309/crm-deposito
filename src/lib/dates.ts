/**
 * Converte um valor "YYYY-MM-DD" (de um <input type="date">) para meia-noite
 * no fuso local, em vez de meia-noite UTC. `new Date("2026-10-01")` cria
 * 2026-10-01T00:00:00Z, que em qualquer fuso atrás de UTC (ex: horário do
 * Brasil) formata de volta como o dia anterior — essa função evita esse
 * desvio de um dia.
 */
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
