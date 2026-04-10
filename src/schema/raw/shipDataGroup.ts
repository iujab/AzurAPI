import { z } from "zod";

const shipDataGroupValueSchema = z
  .object({
    code: z.number(),
    group_type: z.number(),
    type: z.number(),
    nationality: z.number(),
    description: z
      .array(z.tuple([z.string(), z.unknown(), z.number().optional()]))
      .catch([]),
    index_id: z.number().optional(),
    handbook_type: z.number().optional(),
    trans_type: z.number().optional(),
    trans_skin: z.number().optional(),
    trans_skill: z.unknown().optional(),
    trans_radar_chart: z.unknown().optional(),
  })
  .passthrough();

export const ShipDataGroupSchema = z.record(z.string(), shipDataGroupValueSchema);
export type ShipDataGroup = z.infer<typeof ShipDataGroupSchema>;
export type ShipDataGroupValue = z.infer<typeof shipDataGroupValueSchema>;
