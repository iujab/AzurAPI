import { z } from "zod";

const shipDataByStarValueSchema = z
  .object({
    destory_item: z.array(z.tuple([z.number(), z.number(), z.number()])).optional(),
  })
  .passthrough();

export const ShipDataByStarSchema = z.record(z.string(), shipDataByStarValueSchema);
export type ShipDataByStar = z.infer<typeof ShipDataByStarSchema>;
export type ShipDataByStarValue = z.infer<typeof shipDataByStarValueSchema>;
