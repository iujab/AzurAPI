import { z } from "zod";

const skillDataTemplateValueSchema = z
  .object({
    name: z.string().optional(),
    desc: z.string().optional(),
    desc_add: z.unknown().optional(),
    desc_get: z.string().optional(),
    desc_get_add: z.unknown().optional(),
    max_level: z.number().optional(),
    type: z.number().optional(),
    world_death_mark: z.unknown().optional(),
  })
  .passthrough();

export const SkillDataTemplateSchema = z.record(z.string(), skillDataTemplateValueSchema);
export type SkillDataTemplate = z.infer<typeof SkillDataTemplateSchema>;
export type SkillDataTemplateValue = z.infer<typeof skillDataTemplateValueSchema>;
