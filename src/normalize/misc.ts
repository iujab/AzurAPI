import type { Ship } from "../schema/output/ship.js";
import type { ShipSkinTemplate } from "../schema/raw/index.js";
import type { Lookups } from "../translate/lookups.js";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export interface MiscInputs {
  /** The default skin ID (typically group_type + "0", e.g. "202120") */
  defaultSkinId: string;
  skinTemplate: ShipSkinTemplate;
  lookups: Lookups;
  /** Optional artist name from data/overrides/artists.json */
  artistOverride?: string;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function normalizeMisc(inputs: MiscInputs): { misc?: Ship["misc"] } {
  const { defaultSkinId, skinTemplate, lookups, artistOverride } = inputs;

  let voiceName: string | undefined;
  let artistName: string | undefined;

  // voice: resolve via voice_actor field on the default skin row
  const defaultSkinRow = skinTemplate[defaultSkinId];
  if (defaultSkinRow !== undefined && defaultSkinRow.voice_actor !== undefined) {
    const name = lookups.voiceActorName(defaultSkinRow.voice_actor);
    if (name !== "Unknown") {
      voiceName = name;
    }
  }

  // artist: only from override — illustrator.json is empty in raw data
  if (artistOverride !== undefined && artistOverride.trim().length > 0) {
    artistName = artistOverride.trim();
  }

  if (voiceName === undefined && artistName === undefined) {
    return { misc: undefined };
  }

  const misc: Ship["misc"] = {
    ...(artistName !== undefined ? { artist: { name: artistName } } : {}),
    ...(voiceName !== undefined ? { voice: { name: voiceName } } : {}),
  };

  return { misc };
}
