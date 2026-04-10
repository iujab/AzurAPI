import { z } from "zod";

const attributeInfoByTypeValueSchema = z
  .object({
    name: z.string().optional(),
    condition: z.string().optional(),
  })
  .passthrough();

export const AttributeInfoByTypeSchema = z.record(z.string(), attributeInfoByTypeValueSchema);
export type AttributeInfoByType = z.infer<typeof AttributeInfoByTypeSchema>;
export type AttributeInfoByTypeValue = z.infer<typeof attributeInfoByTypeValueSchema>;
