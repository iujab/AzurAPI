import { z } from "zod";

const shipDataBreakoutValueSchema = z
  .object({
    id: z.number(),
    breakout_id: z.number(),
    pre_id: z.number(),
    breakout_view: z.string(),
    level: z.number(),
    use_char: z.union([z.array(z.number()), z.number()]).optional(),
    use_char_num: z.union([z.array(z.number()), z.number()]).optional(),
    weapon_ids: z.array(z.number()).optional(),
  })
  .passthrough();

export const ShipDataBreakoutSchema = z.record(z.string(), shipDataBreakoutValueSchema);
export type ShipDataBreakout = z.infer<typeof ShipDataBreakoutSchema>;
export type ShipDataBreakoutValue = z.infer<typeof shipDataBreakoutValueSchema>;
