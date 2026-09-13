"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/produtos", label: "Produtos" },
  { href: "/produtos/categorias", label: "Categorias" },
  { href: "/produtos/marcas", label: "Marcas" },
  { href: "/produtos/unidades", label: "Unidades" },
];

export function ProductsSubNav() {
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
