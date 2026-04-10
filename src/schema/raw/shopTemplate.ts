import { z } from "zod";

const shopTemplateValueSchema = z
  .object({
    genre: z.string().optional(),
    effect_args: z.unknown().optional(),
    resource_num: z.number().optional(),
    resource_type: z.number().optional(),
    time: z.union([z.string(), z.unknown()]).optional(),
  })
  .passthrough();

export const ShopTemplateSchema = z.record(z.string(), shopTemplateValueSchema);
export type ShopTemplate = z.infer<typeof ShopTemplateSchema>;
export type ShopTemplateValue = z.infer<typeof shopTemplateValueSchema>;
