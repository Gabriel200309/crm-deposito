"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductOrigin } from "@/generated/prisma/enums";
import { PRODUCT_ORIGIN_LABELS, PRODUCT_ORIGIN_ORDER } from "@/lib/product-labels";
import type { ActionState } from "@/lib/actions/products";

export type CategoryOption = { id: string; name: string; depth: number };
export type BrandOption = { id: string; name: string };
export type UnitOption = { id: string; code: string; label: string };

export type ProductFormValues = {
  internalCode: string;
  sku?: string | null;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId: string;
  brandId?: string | null;
  unitId: string;
  weight?: string | null;
  lengthCm?: string | null;
  widthCm?: string | null;
  heightCm?: string | null;
  costPrice?: string | null;
  salePrice: string;
  promoPrice?: string | null;
  currentStock?: string | null;
  minStock?: string | null;
  maxStock?: string | null;
  warehouseLocation?: string | null;
  supplierName?: string | null;
  ncm?: string | null;
  cest?: string | null;
  cfop?: string | null;
  cstCsosn?: string | null;
  origin?: ProductOrigin;
  icmsRate?: string | null;
};

export function ProductForm({
  action,
  categories,
  brands,
  units,
  defaultValues,
  mode,
}: {
  action: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  categories: CategoryOption[];
  brands: BrandOption[];
  units: UnitOption[];
  defaultValues?: ProductFormValues;
  mode: "create" | "edit";
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    success: false,
  });

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="internalCode">Código interno</Label>
            <Input id="internalCode" name="internalCode" defaultValue={defaultValues?.internalCode} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" name="sku" defaultValue={defaultValues?.sku ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="barcode">Código de barras (EAN)</Label>
            <Input id="barcode" name="barcode" defaultValue={defaultValues?.barcode ?? ""} />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={defaultValues?.name} required />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={2} defaultValue={defaultValues?.description ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select name="categoryId" defaultValue={defaultValues?.categoryId}>
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Selecione">
                  {(value: string | null) =>
                    categories.find((c) => c.id === value)?.name ?? "Selecione"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {"— ".repeat(category.depth)}
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandId">Marca</Label>
            <Select name="brandId" defaultValue={defaultValues?.brandId || "none"}>
              <SelectTrigger id="brandId" className="w-full">
                <SelectValue placeholder="Sem marca">
                  {(value: string | null) => brands.find((b) => b.id === value)?.name ?? "Sem marca"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem marca</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="unitId">Unidade</Label>
            <Select name="unitId" defaultValue={defaultValues?.unitId}>
              <SelectTrigger id="unitId" className="w-full">
                <SelectValue placeholder="Selecione">
                  {(value: string | null) => {
                    const unit = units.find((u) => u.id === value);
                    return unit ? `${unit.code} — ${unit.label}` : "Selecione";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.code} — {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preços</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="costPrice">Preço de custo (R$)</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.costPrice ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salePrice">Preço de venda (R$)</Label>
            <Input
              id="salePrice"
              name="salePrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.salePrice}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promoPrice">Preço promocional (R$)</Label>
            <Input
              id="promoPrice"
              name="promoPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={defaultValues?.promoPrice ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peso e dimensões</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input id="weight" name="weight" type="number" step="0.001" min="0" defaultValue={defaultValues?.weight ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lengthCm">Comprimento (cm)</Label>
            <Input id="lengthCm" name="lengthCm" type="number" step="0.01" min="0" defaultValue={defaultValues?.lengthCm ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="widthCm">Largura (cm)</Label>
            <Input id="widthCm" name="widthCm" type="number" step="0.01" min="0" defaultValue={defaultValues?.widthCm ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="heightCm">Altura (cm)</Label>
            <Input id="heightCm" name="heightCm" type="number" step="0.01" min="0" defaultValue={defaultValues?.heightCm ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estoque e localização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "edit" && (
            <p className="text-sm text-muted-foreground">
              Estoque atual: <span className="font-medium text-foreground">{defaultValues?.currentStock ?? "0"}</span>{" "}
              — gerenciado pelo módulo de Estoque (Fase 4), não editável aqui.
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="minStock">Estoque mínimo</Label>
              <Input id="minStock" name="minStock" type="number" step="0.001" min="0" defaultValue={defaultValues?.minStock ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxStock">Estoque máximo</Label>
              <Input id="maxStock" name="maxStock" type="number" step="0.001" min="0" defaultValue={defaultValues?.maxStock ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warehouseLocation">Localização no depósito</Label>
              <Input id="warehouseLocation" name="warehouseLocation" defaultValue={defaultValues?.warehouseLocation ?? ""} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplierName">Fornecedor</Label>
            <Input id="supplierName" name="supplierName" defaultValue={defaultValues?.supplierName ?? ""} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados fiscais</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ncm">NCM</Label>
            <Input id="ncm" name="ncm" defaultValue={defaultValues?.ncm ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cest">CEST</Label>
            <Input id="cest" name="cest" defaultValue={defaultValues?.cest ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cfop">CFOP padrão</Label>
            <Input id="cfop" name="cfop" defaultValue={defaultValues?.cfop ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cstCsosn">CST/CSOSN</Label>
            <Input id="cstCsosn" name="cstCsosn" defaultValue={defaultValues?.cstCsosn ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="icmsRate">Alíquota de ICMS (%)</Label>
            <Input id="icmsRate" name="icmsRate" type="number" step="0.01" min="0" max="100" defaultValue={defaultValues?.icmsRate ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origin">Origem da mercadoria</Label>
            <Select name="origin" defaultValue={defaultValues?.origin ?? ProductOrigin.ORIGEM_0}>
              <SelectTrigger id="origin" className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value ? PRODUCT_ORIGIN_LABELS[value as ProductOrigin] : "Selecione"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_ORIGIN_ORDER.map((value) => (
                  <SelectItem key={value} value={value}>
                    {PRODUCT_ORIGIN_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={isPending}>
        {mode === "create" ? "Criar produto" : "Salvar alterações"}
      </Button>
    </form>
  );
}
