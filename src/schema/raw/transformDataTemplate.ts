import { z } from "zod";

const transformDataTemplateValueSchema = z
  .object({
    name: z.string().optional(),
    icon: z.string().optional(),
    level_limit: z.number().optional(),
    star_limit: z.number().optional(),
    effect: z.array(z.record(z.string(), z.number())),
    skill_id: z.union([z.number(), z.array(z.number())]).optional(),
    use_gold: z.number().optional(),
    use_item: z.unknown().optional(),
    condition_id: z.union([z.number(), z.array(z.number())]).optional(),
  })
  .passthrough();

export const TransformDataTemplateSchema = z.record(z.string(), transformDataTemplateValueSchema);
export type TransformDataTemplate = z.infer<typeof TransformDataTemplateSchema>;
export type TransformDataTemplateValue = z.infer<typeof transformDataTemplateValueSchema>;
