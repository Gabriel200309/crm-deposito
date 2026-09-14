"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/financeiro/receber", label: "Contas a receber" },
  { href: "/financeiro/pagar", label: "Contas a pagar" },
  { href: "/financeiro/fluxo-caixa", label: "Fluxo de caixa" },
];

export function FinanceSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
