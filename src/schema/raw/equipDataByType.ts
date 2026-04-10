import { z } from "zod";

const equipDataByTypeValueSchema = z
  .object({
    type_name: z.string(),
    type_name2: z.string().optional(),
    compare_group: z.unknown().optional(),
  })
  .passthrough();

export const EquipDataByTypeSchema = z.record(z.string(), equipDataByTypeValueSchema);
export type EquipDataByType = z.infer<typeof EquipDataByTypeSchema>;
export type EquipDataByTypeValue = z.infer<typeof equipDataByTypeValueSchema>;
