import { z } from "zod";

const fleetTechGroupValueSchema = z
  .object({
    name: z.string(),
  })
  .passthrough();

export const FleetTechGroupSchema = z.record(z.string(), fleetTechGroupValueSchema);
export type FleetTechGroup = z.infer<typeof FleetTechGroupSchema>;
export type FleetTechGroupValue = z.infer<typeof fleetTechGroupValueSchema>;
