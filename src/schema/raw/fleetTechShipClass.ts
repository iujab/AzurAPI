import { z } from "zod";

const fleetTechShipClassValueSchema = z
  .object({
    name: z.string(),
    nation: z.number().optional(),
    ships: z.array(z.number()).optional(),
    shiptype: z.number().optional(),
    t_level: z.number().optional(),
    t_level_1: z.number().optional(),
  })
  .passthrough();

export const FleetTechShipClassSchema = z.record(z.string(), fleetTechShipClassValueSchema);
export type FleetTechShipClass = z.infer<typeof FleetTechShipClassSchema>;
export type FleetTechShipClassValue = z.infer<typeof fleetTechShipClassValueSchema>;
