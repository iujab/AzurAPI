import { z } from "zod";

// ---------------------------------------------------------------------------
// StatBlock
// NOTE: "antiwar" is the AzurAPI field name for anti-air — preserve the typo
//       for drop-in compatibility.
// ---------------------------------------------------------------------------

export const StatBlockSchema = z.object({
  health: z.number(),
  firepower: z.number(),
  torpedo: z.number(),
  evasion: z.number(),
  antiwar: z.number(),   // anti-air; AzurAPI named it antiwar — kept for compat
  aviation: z.number(),
  reload: z.number(),
  speed: z.number(),
  luck: z.number(),
  accuracy: z.number(),
});

export type StatBlock = z.infer<typeof StatBlockSchema>;

// ---------------------------------------------------------------------------
// Ship
// ---------------------------------------------------------------------------

export const ShipSchema = z.object({
  id: z.string(),

  names: z.object({
    en: z.string().optional(),
    jp: z.string().optional(),
    cn: z.string().optional(),
    code: z.string().optional(),
  }),

  rarity: z.enum([
    "Normal",
    "Rare",
    "Elite",
    "Super Rare",
    "Ultra Rare",
    "Priority",
    "Decisive",
  ]),

  stars: z.object({
    stars: z.string(),
    value: z.number(),
  }),

  thumbnail: z.string(),

  wikiUrl: z.string().optional(),

  class: z.string(),
  hullType: z.string(),
  nationality: z.string(),

  stats: z.object({
    level100: StatBlockSchema,
    level120: StatBlockSchema,
    level100Retrofit: StatBlockSchema.optional(),
    level120Retrofit: StatBlockSchema.optional(),
  }),

  enhanceValue: z.object({
    firepower: z.number(),
    torpedo: z.number(),
    aviation: z.number(),
    reload: z.number(),
  }),

  slots: z.array(
    z.object({
      type: z.string(),
      minEfficiency: z.number(),
      maxEfficiency: z.number(),
    }),
  ),

  skills: z.array(
    z.object({
      color: z.enum(["red", "yellow", "blue"]),
      // `en` is required; additional language keys are allowed as strings
      names: z.object({ en: z.string() }).catchall(z.string()),
      description: z.string(),
    }),
  ),

  limitBreaks: z.array(z.array(z.string())).optional(),

  construction: z
    .object({
      constructionTime: z.string().optional(),
      availableIn: z
        .object({
          light: z.boolean(),
          heavy: z.boolean(),
          aviation: z.boolean(),
          limited: z.boolean(),
          exchange: z.boolean(),
        })
        .optional(),
    })
    .optional(),

  scrapValue: z
    .object({
      coin: z.number(),
      oil: z.number(),
      medal: z.number(),
    })
    .optional(),

  fleetTech: z
    .object({
      techPoints: z.object({
        collection: z.number(),
        maxLimitBreak: z.number(),
        maxLevel: z.number(),
        total: z.number(),
      }),
      statsBonus: z.object({
        collection: z
          .object({
            stat: z.string(),
            bonus: z.number(),
            applicable: z.array(z.string()),
          })
          .optional(),
        maxLevel: z
          .object({
            stat: z.string(),
            bonus: z.number(),
            applicable: z.array(z.string()),
          })
          .optional(),
      }),
    })
    .optional(),

  obtainedFrom: z
    .object({
      fromMaps: z.array(z.string()).optional(),
      obtainedFrom: z.string().optional(),
    })
    .optional(),

  retrofit: z.boolean(),
  retrofitHullType: z.string().optional(),

  misc: z
    .object({
      artist: z.object({ name: z.string() }).optional(),
      voice: z.object({ name: z.string() }).optional(),
    })
    .optional(),

  skins: z.array(
    z.object({
      name: z.string(),
      image: z.string(),
      images: z.object({
        default: z.string().optional(),
        censored: z.string().optional(),
        censored_nobg: z.string().optional(),
        uncensored: z.string().optional(),
        uncensored_nobg: z.string().optional(),
        background: z.string().optional(),
      }).optional(),
      info: z.object({
        cost: z.number().optional(),
        obtainedFrom: z.string().optional(),
        live2dModel: z.boolean().optional(),
        enClient: z.string().optional(),
      }),
    }),
  ),

  // azurapi extension — optional
  isEnReleased: z.boolean().optional(),
});

export type Ship = z.infer<typeof ShipSchema>;

// ---------------------------------------------------------------------------
// ShipListEntry  — minimal shape written to ship-list.json
// ---------------------------------------------------------------------------

export const ShipListEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  hullType: z.string(),
  rarity: z.string(),
});

export type ShipListEntry = z.infer<typeof ShipListEntrySchema>;

// ---------------------------------------------------------------------------
// IdMapSchema  — shape of id-map.json: { "Belfast": "077", "077": "077", … }
// ---------------------------------------------------------------------------

export const IdMapSchema = z.record(z.string(), z.string());
export type IdMap = z.infer<typeof IdMapSchema>;
