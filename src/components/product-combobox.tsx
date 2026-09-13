"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ProductOption = {
  id: string;
  name: string;
  internalCode: string;
  unitCode: string;
  currentStock: string;
};

export function ProductCombobox({
  products,
  value,
  onChange,
  name,
}: {
  products: ProductOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = products.find((p) => p.id === value);

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? `${selected.internalCode} — ${selected.name}` : "Selecione um produto"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0">
          <Command>
            <CommandInput placeholder="Buscar por nome ou código..." />
            <CommandList>
              <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`${product.internalCode} ${product.name}`}
                    onSelect={() => {
                      onChange(product.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("h-4 w-4", value === product.id ? "opacity-100" : "opacity-0")}
                    />
                    <div className="flex flex-col">
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.internalCode} · estoque: {product.currentStock} {product.unitCode}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
