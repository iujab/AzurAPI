import { z } from "zod";

const shipSkinWordsValueSchema = z
  .object({
    detail: z.string().optional(),
    drop_descrip: z.string().optional(),
  })
  .passthrough();

export const ShipSkinWordsSchema = z.record(z.string(), shipSkinWordsValueSchema);
export type ShipSkinWords = z.infer<typeof ShipSkinWordsSchema>;
export type ShipSkinWordsValue = z.infer<typeof shipSkinWordsValueSchema>;
