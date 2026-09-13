"use client";

import { useActionState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategoryAction, type ActionState } from "@/lib/actions/categories";

export function CategoryForm({ categories }: { categories: { id: string; name: string; depth: number }[] }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createCategoryAction, {
    success: false,
  });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 sm:flex-row">
      <Input name="name" placeholder="Nome da categoria" required className="sm:max-w-xs" />
      <Select name="parentId" defaultValue="none">
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Categoria principal">
            {(value: string | null) =>
              value && value !== "none"
                ? categories.find((c) => c.id === value)?.name
                : "Categoria principal (sem pai)"
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Categoria principal (sem pai)</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {"— ".repeat(category.depth)}
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button type="submit" variant="outline" disabled={isPending}>
        Adicionar
      </Button>
      {state.error && <p className="text-sm text-destructive sm:ml-2 sm:self-center">{state.error}</p>}
    </form>
  );
}
