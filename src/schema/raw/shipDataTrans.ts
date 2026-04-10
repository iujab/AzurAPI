import { z } from "zod";

const shipDataTransValueSchema = z
  .object({
    group_id: z.number(),
    skill_id: z.union([z.number(), z.array(z.number())]),
    skin_id: z.union([z.number(), z.array(z.number())]).optional(),
    transform_list: z.array(z.array(z.tuple([z.number(), z.number()]))),
  })
  .passthrough();

export const ShipDataTransSchema = z.record(z.string(), shipDataTransValueSchema);
export type ShipDataTrans = z.infer<typeof ShipDataTransSchema>;
export type ShipDataTransValue = z.infer<typeof shipDataTransValueSchema>;
