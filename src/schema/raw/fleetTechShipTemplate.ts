import { z } from "zod";

const fleetTechShipTemplateValueSchema = z
  .object({
    pt_get: z.number(),
    pt_level: z.number(),
    pt_upgrage: z.number(),
    add_get_attr: z.number(),
    add_get_shiptype: z.array(z.number()),
    add_get_value: z.number(),
    add_level_attr: z.number(),
    add_level_shiptype: z.array(z.number()),
    add_level_value: z.number(),
    class: z.number(),
    max_star: z.number().optional(),
  })
  .passthrough();

export const FleetTechShipTemplateSchema = z.record(z.string(), fleetTechShipTemplateValueSchema);
export type FleetTechShipTemplate = z.infer<typeof FleetTechShipTemplateSchema>;
export type FleetTechShipTemplateValue = z.infer<typeof fleetTechShipTemplateValueSchema>;
