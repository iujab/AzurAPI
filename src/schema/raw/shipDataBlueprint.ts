import { z } from "zod";

const shipDataBlueprintValueSchema = z
  .object({
    name: z.string().optional(),
    blueprint_version: z.number().optional(),
    strengthen_effect: z.array(z.number()).optional(),
    fate_strengthen: z.array(z.number()).optional(),
  })
  .passthrough();

export const ShipDataBlueprintSchema = z.record(z.string(), shipDataBlueprintValueSchema);
export type ShipDataBlueprint = z.infer<typeof ShipDataBlueprintSchema>;
export type ShipDataBlueprintValue = z.infer<typeof shipDataBlueprintValueSchema>;
