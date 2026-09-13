"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Menu,
  Users,
  ShieldCheck,
  LogOut,
  Warehouse,
  Contact,
  Kanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
};

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/clientes": Contact,
  "/leads": Kanban,
  "/usuarios": Users,
  "/perfis": ShieldCheck,
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = ICONS[item.href] ?? LayoutDashboard;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  user,
  navItems,
  children,
}: {
  user: { name: string; email: string; roleName: string };
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [, startLogoutTransition] = useTransition();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-background md:flex md:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <Warehouse className="h-5 w-5 text-primary" />
          <span className="font-semibold">Depósito CRM</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <NavLinks items={navItems} />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" />}>
                <Menu className="h-5 w-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <div className="flex h-16 items-center gap-2 border-b px-4">
                  <Warehouse className="h-5 w-5 text-primary" />
                  <span className="font-semibold">Depósito CRM</span>
                </div>
                <div className="p-3">
                  <NavLinks items={navItems} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Depósito CRM</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" className="flex items-center gap-2 px-2" />}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                      <span className="mt-1 text-xs font-normal text-muted-foreground">{user.roleName}</span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => startLogoutTransition(() => logoutAction())}>
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
