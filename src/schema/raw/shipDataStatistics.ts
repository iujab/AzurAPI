import { z } from "zod";

const shipDataStatisticsValueSchema = z
  .object({
    name: z.string(),
    english_name: z.string().optional(),
    nationality: z.number(),
    rarity: z.number(),
    type: z.number(),
    star: z.number(),
    tag_list: z.array(z.string()).optional(),
    attrs: z.array(z.number()),
    attrs_growth: z.array(z.number()),
    attrs_growth_extra: z.array(z.number()).optional(),
    equipment_proficiency: z.array(z.number()),
    skin_id: z.number(),
    armor_type: z.number().optional(),
    default_equip_list: z.array(z.number()).optional(),
    fix_equip_list: z.array(z.number()).optional(),
  })
  .passthrough();

export const ShipDataStatisticsSchema = z.record(z.string(), shipDataStatisticsValueSchema);
export type ShipDataStatistics = z.infer<typeof ShipDataStatisticsSchema>;
export type ShipDataStatisticsValue = z.infer<typeof shipDataStatisticsValueSchema>;
