import { z } from "zod";

const shipSkinTemplateValueSchema = z
  .object({
    name: z.string(),
    painting: z.string(),
    prefab: z.string().optional(),
    ship_group: z.number(),
    skin_type: z.number(),
    shop_id: z.number().optional(),
    illustrator: z.number().optional(),
    illustrator2: z.number().optional(),
    voice_actor: z.number().optional(),
    voice_actor_2: z.number().optional(),
    desc: z.string().optional(),
    tag: z.unknown().optional(),
    l2d_animations: z.unknown().optional(),
    group_index: z.number().optional(),
  })
  .passthrough();

export const ShipSkinTemplateSchema = z.record(z.string(), shipSkinTemplateValueSchema);
export type ShipSkinTemplate = z.infer<typeof ShipSkinTemplateSchema>;
export type ShipSkinTemplateValue = z.infer<typeof shipSkinTemplateValueSchema>;
