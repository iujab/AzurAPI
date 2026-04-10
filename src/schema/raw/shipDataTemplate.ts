import { z } from "zod";

const shipDataTemplateValueSchema = z
  .object({
    id: z.number(),
    group_type: z.number(),
    strengthen_id: z.number(),
    type: z.number(),
    max_level: z.number(),
    star: z.number(),
    star_max: z.number(),
    equip_1: z.array(z.number()),
    equip_2: z.array(z.number()),
    equip_3: z.array(z.number()),
    equip_4: z.array(z.number()).optional(),
    equip_5: z.array(z.number()).optional(),
    buff_list: z.array(z.number()),
    buff_list_display: z.array(z.number()),
    oil_at_start: z.number().optional(),
    oil_at_end: z.number().optional(),
    specific_type: z.unknown().optional(),
  })
  .passthrough();

export const ShipDataTemplateSchema = z.record(z.string(), shipDataTemplateValueSchema);
export type ShipDataTemplate = z.infer<typeof ShipDataTemplateSchema>;
export type ShipDataTemplateValue = z.infer<typeof shipDataTemplateValueSchema>;
