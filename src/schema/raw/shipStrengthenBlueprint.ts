import { z } from "zod";

/**
 * ship_strengthen_blueprint.json — per-level dev/fate strengthen rows for
 * research ships. Keyed by a numeric row id referenced from
 * ship_data_blueprint[group].strengthen_effect[] and fate_strengthen[].
 *
 * `effect` is a 5-element CUMULATIVE array with the same layout as
 * ship_data_strengthen.durability: [firepower, torpedo, _, aviation, reload].
 * Index 2 is unused (always 0 in current data).
 */
const shipStrengthenBlueprintValueSchema = z
  .object({
    id: z.number(),
    lv: z.number(),
    need_lv: z.number().optional(),
    effect: z.array(z.number()),
  })
  .passthrough();

export const ShipStrengthenBlueprintSchema = z.record(
  z.string(),
  shipStrengthenBlueprintValueSchema,
);
export type ShipStrengthenBlueprint = z.infer<typeof ShipStrengthenBlueprintSchema>;
export type ShipStrengthenBlueprintValue = z.infer<
  typeof shipStrengthenBlueprintValueSchema
>;
