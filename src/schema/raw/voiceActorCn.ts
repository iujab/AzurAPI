import { z } from "zod";

const voiceActorCnValueSchema = z
  .object({
    actor_name: z.string().optional(),
    code: z.number().optional(),
  })
  .passthrough();

export const VoiceActorCnSchema = z.record(z.string(), voiceActorCnValueSchema);
export type VoiceActorCn = z.infer<typeof VoiceActorCnSchema>;
export type VoiceActorCnValue = z.infer<typeof voiceActorCnValueSchema>;
