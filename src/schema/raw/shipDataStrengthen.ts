import { z } from "zod";

const shipDataStrengthenValueSchema = z
  .object({
    durability: z.array(z.number()),
    attr_exp: z.array(z.number()).optional(),
    level_exp: z.array(z.number()).optional(),
  })
  .passthrough();

export const ShipDataStrengthenSchema = z.record(z.string(), shipDataStrengthenValueSchema);
export type ShipDataStrengthen = z.infer<typeof ShipDataStrengthenSchema>;
export type ShipDataStrengthenValue = z.infer<typeof shipDataStrengthenValueSchema>;
