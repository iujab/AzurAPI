import type {
  FleetTechShipTemplate,
  FleetTechShipClass,
  ShipDataByType,
  EquipDataByType,
  SkillDataTemplate,
  SkillDataDisplay,
  VoiceActorCn,
} from "../schema/raw/index.js";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Inputs required to build a Lookups helper. */
export interface LookupInputs {
  fleetTechShipTemplate: FleetTechShipTemplate;
  fleetTechShipClass: FleetTechShipClass;
  shipDataByType: ShipDataByType;
  equipDataByType: EquipDataByType;
  skillDataTemplate: SkillDataTemplate;
  skillDataDisplay: SkillDataDisplay;
  voiceActorCn: VoiceActorCn;
}

/** Lookup helper object returned by createLookups. */
export interface Lookups {
  /**
   * group_type (string) → class name, e.g. "Edinburgh Class".
   * Falls back to fallbackFromTagList if no fleet_tech entry is found.
   */
  classNameFor(groupType: string, fallbackFromTagList?: string): string;

  /** type id → hull type pretty name. Fallback: "Unknown". */
  hullTypeName(typeId: number): string;

  /**
   * equipment type id → display name.
   * "type_name2" preferred, fallback "type_name". Fallback: "Unknown".
   */
  equipTypeName(typeId: number): string;

  /**
   * skill id → display name.
   * Prefers skill_data_template.name, fallback skill_data_display.name.
   * Fallback: `Skill ${id}`.
   */
  skillName(id: number): string;

  /** voice actor code → name, fallback "Unknown". */
  voiceActorName(code: number): string;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Build a Lookups helper from the raw upstream tables. */
export function createLookups(inputs: LookupInputs): Lookups {
  const {
    fleetTechShipTemplate,
    fleetTechShipClass,
    shipDataByType,
    equipDataByType,
    skillDataTemplate,
    skillDataDisplay,
    voiceActorCn,
  } = inputs;

  // Pre-build a code→name map for voice actors (keyed by `code` field value, not the record key)
  const voiceActorByCode = new Map<number, string>();
  for (const entry of Object.values(voiceActorCn)) {
    if (entry.code !== undefined && entry.actor_name !== undefined) {
      voiceActorByCode.set(entry.code, entry.actor_name);
    }
  }

  return {
    classNameFor(groupType: string, fallbackFromTagList?: string): string {
      const techEntry = fleetTechShipTemplate[groupType];
      if (techEntry !== undefined) {
        const classId = String(techEntry.class);
        const classEntry = fleetTechShipClass[classId];
        if (classEntry !== undefined) {
          return classEntry.name;
        }
      }
      return fallbackFromTagList ?? "Unknown";
    },

    hullTypeName(typeId: number): string {
      const entry = shipDataByType[String(typeId)];
      return entry?.type_name ?? "Unknown";
    },

    equipTypeName(typeId: number): string {
      const entry = equipDataByType[String(typeId)];
      if (entry === undefined) return "Unknown";
      return entry.type_name2 ?? entry.type_name ?? "Unknown";
    },

    skillName(id: number): string {
      const key = String(id);
      const templateEntry = skillDataTemplate[key];
      if (templateEntry?.name !== undefined) {
        return templateEntry.name;
      }
      const displayEntry = skillDataDisplay[key];
      if (displayEntry?.name !== undefined) {
        return displayEntry.name;
      }
      return `Skill ${id}`;
    },

    voiceActorName(code: number): string {
      // Try the pre-built code→name map first (keyed by the `code` field in each record)
      const byCode = voiceActorByCode.get(code);
      if (byCode !== undefined) return byCode;

      // Also try looking up by record key directly (some files key by code number)
      const entry = voiceActorCn[String(code)];
      if (entry?.actor_name !== undefined) return entry.actor_name;

      return "Unknown";
    },
  };
}
