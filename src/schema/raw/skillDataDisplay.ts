import { z } from "zod";

const skillDataDisplayValueSchema = z
  .object({
    name: z.string().optional(),
    id: z.number().optional(),
  })
  .passthrough();

export const SkillDataDisplaySchema = z.record(z.string(), skillDataDisplayValueSchema);
export type SkillDataDisplay = z.infer<typeof SkillDataDisplaySchema>;
export type SkillDataDisplayValue = z.infer<typeof skillDataDisplayValueSchema>;
