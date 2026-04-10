import { z } from "zod";

const shipDataByTypeValueSchema = z
  .object({
    type_name: z.string(),
    team_type: z.union([z.number(), z.string()]).optional(),
    distory_resource_gold_ratio: z.number().optional(),
    fix_resource_gold: z.number().optional(),
  })
  .passthrough();

export const ShipDataByTypeSchema = z.record(z.string(), shipDataByTypeValueSchema);
export type ShipDataByType = z.infer<typeof ShipDataByTypeSchema>;
export type ShipDataByTypeValue = z.infer<typeof shipDataByTypeValueSchema>;
