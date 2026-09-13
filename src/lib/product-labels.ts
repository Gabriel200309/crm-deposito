import { ProductOrigin } from "@/generated/prisma/enums";

export const PRODUCT_ORIGIN_LABELS: Record<ProductOrigin, string> = {
  [ProductOrigin.ORIGEM_0]: "0 - Nacional",
  [ProductOrigin.ORIGEM_1]: "1 - Estrangeira (importação direta)",
  [ProductOrigin.ORIGEM_2]: "2 - Estrangeira (mercado interno)",
  [ProductOrigin.ORIGEM_3]: "3 - Nacional (importação > 40%)",
  [ProductOrigin.ORIGEM_4]: "4 - Nacional (processos produtivos básicos)",
  [ProductOrigin.ORIGEM_5]: "5 - Nacional (importação ≤ 40%)",
  [ProductOrigin.ORIGEM_6]: "6 - Estrangeira (importação direta, sem similar nacional)",
  [ProductOrigin.ORIGEM_7]: "7 - Estrangeira (mercado interno, sem similar nacional)",
  [ProductOrigin.ORIGEM_8]: "8 - Nacional (importação > 70%)",
};

export const PRODUCT_ORIGIN_ORDER: ProductOrigin[] = [
  ProductOrigin.ORIGEM_0,
  ProductOrigin.ORIGEM_1,
  ProductOrigin.ORIGEM_2,
  ProductOrigin.ORIGEM_3,
  ProductOrigin.ORIGEM_4,
  ProductOrigin.ORIGEM_5,
  ProductOrigin.ORIGEM_6,
  ProductOrigin.ORIGEM_7,
  ProductOrigin.ORIGEM_8,
];
