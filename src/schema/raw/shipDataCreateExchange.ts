import { z } from "zod";

const shipDataCreateExchangeValueSchema = z
  .object({
    exchange_ship_id: z.array(z.number()).optional(),
  })
  .passthrough();

export const ShipDataCreateExchangeSchema = z.record(
  z.string(),
  shipDataCreateExchangeValueSchema,
);
export type ShipDataCreateExchange = z.infer<typeof ShipDataCreateExchangeSchema>;
export type ShipDataCreateExchangeValue = z.infer<typeof shipDataCreateExchangeValueSchema>;
