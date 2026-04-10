import fs from "fs";
import { z } from "zod";

import {
  ShipDataTemplateSchema,
  type ShipDataTemplate,
  ShipDataStatisticsSchema,
  type ShipDataStatistics,
  ShipDataBreakoutSchema,
  type ShipDataBreakout,
  ShipSkinWordsSchema,
  type ShipSkinWords,
  ShipDataStrengthenSchema,
  type ShipDataStrengthen,
  ShipDataBlueprintSchema,
  type ShipDataBlueprint,
  ShipDataTransSchema,
  type ShipDataTrans,
  ShipDataGroupSchema,
  type ShipDataGroup,
  ShipSkinTemplateSchema,
  type ShipSkinTemplate,
  TransformDataTemplateSchema,
  type TransformDataTemplate,
  FleetTechShipTemplateSchema,
  type FleetTechShipTemplate,
  FleetTechShipClassSchema,
  type FleetTechShipClass,
  FleetTechGroupSchema,
  type FleetTechGroup,
  ShipDataByTypeSchema,
  type ShipDataByType,
  ShipDataByStarSchema,
  type ShipDataByStar,
  SkillDataTemplateSchema,
  type SkillDataTemplate,
  SkillDataDisplaySchema,
  type SkillDataDisplay,
  ShopTemplateSchema,
  type ShopTemplate,
  VoiceActorCnSchema,
  type VoiceActorCn,
  EquipDataByTypeSchema,
  type EquipDataByType,
  ShipDataCreateExchangeSchema,
  type ShipDataCreateExchange,
  AttributeInfoByTypeSchema,
  type AttributeInfoByType,
} from "../schema/raw/index.js";
import { regionPath, type Region } from "./upstream.js";

function readJsonFile(filePath: string): unknown {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    // Many upstream files have an "all" key containing an array of IDs
    // (an index listing all record keys). Strip it before validation.
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      if ("all" in obj && Array.isArray(obj["all"])) {
        const { all: _all, ...rest } = obj;
        return rest;
      }
    }
    return parsed;
  } catch {
    // File missing or unreadable — treat as empty
    return {};
  }
}

function loadFile<T extends z.ZodTypeAny>(
  schema: T,
  filePath: string,
): z.infer<T> {
  const data = readJsonFile(filePath);

  // Empty object stub — return as-is (valid empty record)
  if (data !== null && typeof data === "object" && !Array.isArray(data) && Object.keys(data as object).length === 0) {
    return {} as z.infer<T>;
  }

  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Zod parse failed for file: ${filePath}\n${result.error.message}`,
    );
  }
  return result.data as z.infer<T>;
}

// ---------------------------------------------------------------------------
// sharecfgdata/ files
// ---------------------------------------------------------------------------

export function loadShipDataTemplate(region: Region = "EN"): ShipDataTemplate {
  return loadFile(
    ShipDataTemplateSchema,
    regionPath(region, "sharecfgdata", "ship_data_template.json"),
  );
}

export function loadShipDataStatistics(region: Region = "EN"): ShipDataStatistics {
  return loadFile(
    ShipDataStatisticsSchema,
    regionPath(region, "sharecfgdata", "ship_data_statistics.json"),
  );
}

export function loadShipDataBreakout(region: Region = "EN"): ShipDataBreakout {
  return loadFile(
    ShipDataBreakoutSchema,
    regionPath(region, "sharecfgdata", "ship_data_breakout.json"),
  );
}

export function loadShipSkinWords(region: Region = "EN"): ShipSkinWords {
  return loadFile(
    ShipSkinWordsSchema,
    regionPath(region, "sharecfgdata", "ship_skin_words.json"),
  );
}

export function loadShopTemplate(region: Region = "EN"): ShopTemplate {
  return loadFile(
    ShopTemplateSchema,
    regionPath(region, "sharecfgdata", "shop_template.json"),
  );
}

// ---------------------------------------------------------------------------
// ShareCfg/ files
// ---------------------------------------------------------------------------

export function loadShipDataStrengthen(region: Region = "EN"): ShipDataStrengthen {
  return loadFile(
    ShipDataStrengthenSchema,
    regionPath(region, "ShareCfg", "ship_data_strengthen.json"),
  );
}

export function loadShipDataBlueprint(region: Region = "EN"): ShipDataBlueprint {
  return loadFile(
    ShipDataBlueprintSchema,
    regionPath(region, "ShareCfg", "ship_data_blueprint.json"),
  );
}

export function loadShipDataTrans(region: Region = "EN"): ShipDataTrans {
  return loadFile(
    ShipDataTransSchema,
    regionPath(region, "ShareCfg", "ship_data_trans.json"),
  );
}

export function loadShipDataGroup(region: Region = "EN"): ShipDataGroup {
  return loadFile(
    ShipDataGroupSchema,
    regionPath(region, "ShareCfg", "ship_data_group.json"),
  );
}

export function loadShipSkinTemplate(region: Region = "EN"): ShipSkinTemplate {
  return loadFile(
    ShipSkinTemplateSchema,
    regionPath(region, "ShareCfg", "ship_skin_template.json"),
  );
}

export function loadTransformDataTemplate(region: Region = "EN"): TransformDataTemplate {
  return loadFile(
    TransformDataTemplateSchema,
    regionPath(region, "ShareCfg", "transform_data_template.json"),
  );
}

export function loadFleetTechShipTemplate(region: Region = "EN"): FleetTechShipTemplate {
  return loadFile(
    FleetTechShipTemplateSchema,
    regionPath(region, "ShareCfg", "fleet_tech_ship_template.json"),
  );
}

export function loadFleetTechShipClass(region: Region = "EN"): FleetTechShipClass {
  return loadFile(
    FleetTechShipClassSchema,
    regionPath(region, "ShareCfg", "fleet_tech_ship_class.json"),
  );
}

export function loadFleetTechGroup(region: Region = "EN"): FleetTechGroup {
  return loadFile(
    FleetTechGroupSchema,
    regionPath(region, "ShareCfg", "fleet_tech_group.json"),
  );
}

export function loadShipDataByType(region: Region = "EN"): ShipDataByType {
  return loadFile(
    ShipDataByTypeSchema,
    regionPath(region, "ShareCfg", "ship_data_by_type.json"),
  );
}

export function loadShipDataByStar(region: Region = "EN"): ShipDataByStar {
  return loadFile(
    ShipDataByStarSchema,
    regionPath(region, "ShareCfg", "ship_data_by_star.json"),
  );
}

export function loadSkillDataTemplate(region: Region = "EN"): SkillDataTemplate {
  return loadFile(
    SkillDataTemplateSchema,
    regionPath(region, "ShareCfg", "skill_data_template.json"),
  );
}

export function loadSkillDataDisplay(region: Region = "EN"): SkillDataDisplay {
  return loadFile(
    SkillDataDisplaySchema,
    regionPath(region, "ShareCfg", "skill_data_display.json"),
  );
}

export function loadVoiceActorCn(region: Region = "EN"): VoiceActorCn {
  return loadFile(
    VoiceActorCnSchema,
    regionPath(region, "ShareCfg", "voice_actor_CN.json"),
  );
}

export function loadEquipDataByType(region: Region = "EN"): EquipDataByType {
  return loadFile(
    EquipDataByTypeSchema,
    regionPath(region, "ShareCfg", "equip_data_by_type.json"),
  );
}

export function loadShipDataCreateExchange(region: Region = "EN"): ShipDataCreateExchange {
  return loadFile(
    ShipDataCreateExchangeSchema,
    regionPath(region, "ShareCfg", "ship_data_create_exchange.json"),
  );
}

export function loadAttributeInfoByType(region: Region = "EN"): AttributeInfoByType {
  return loadFile(
    AttributeInfoByTypeSchema,
    regionPath(region, "ShareCfg", "attribute_info_by_type.json"),
  );
}
