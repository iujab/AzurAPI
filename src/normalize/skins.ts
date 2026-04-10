import type { Ship } from "../schema/output/ship.js";
import type {
  ShipSkinTemplate,
  ShopTemplate,
} from "../schema/raw/index.js";
import { PAINTINGS_URL } from "../config.js";

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export interface SkinsInputs {
  groupType: string;
  skinTemplate: ShipSkinTemplate;
  shopTemplate: ShopTemplate;
  thumbnailBaseUrl?: string;
  /** Set of available painting filenames (lowercase, no extension) for variant lookup. */
  availablePaintings?: Set<string>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const DEFAULT_BASE_URL = PAINTINGS_URL;

/**
 * Returns true if l2d_animations is non-empty
 * (Array with length > 0, or object with at least one key).
 */
function hasLive2d(l2dAnimations: unknown): boolean {
  if (l2dAnimations === undefined || l2dAnimations === null) return false;
  if (Array.isArray(l2dAnimations)) return l2dAnimations.length > 0;
  if (typeof l2dAnimations === "object") {
    return Object.keys(l2dAnimations as Record<string, unknown>).length > 0;
  }
  return false;
}

/**
 * Returns true if the shop entry's `time` value represents "always"
 * (i.e. the string "always").
 */
function isAlwaysAvailable(time: unknown): boolean {
  return time === "always";
}

/**
 * Build the variant images map for a skin painting.
 *
 * Variant mapping:
 *   {name}.webp        → "default" (base file — the EN version, may be censored)
 *   {name}_rw.webp     → "censored_nobg" (EN character layer without background)
 *   {name}_n.webp      → "uncensored" (JP/original version)
 *   {name}_n_rw.webp   → "uncensored_nobg" (JP character without background)
 *   {name}_bj.webp     → "background" (background layer only)
 *
 * "censored" is an alias for "default" since the base file IS the EN version.
 */
function buildVariantImages(
  painting: string,
  baseUrl: string,
  available?: Set<string>,
): Ship["skins"][number]["images"] {
  const lower = painting.toLowerCase();
  const has = (suffix: string) => {
    const key = suffix === "" ? lower : `${lower}${suffix}`;
    return available ? available.has(key) : true;
  };
  const url = (suffix: string) =>
    `${baseUrl}/${painting}${suffix}.webp`;

  const images: NonNullable<Ship["skins"][number]["images"]> = {};

  if (has(""))        images.default = url("");
  if (has(""))        images.censored = url("");         // alias for default
  if (has("_rw"))     images.censored_nobg = url("_rw");
  if (has("_n"))      images.uncensored = url("_n");
  if (has("_n_rw"))   images.uncensored_nobg = url("_n_rw");
  if (has("_bj"))     images.background = url("_bj");

  return Object.keys(images).length > 0 ? images : undefined;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function normalizeSkins(inputs: SkinsInputs): { skins: Ship["skins"] } {
  const { groupType, skinTemplate, shopTemplate, thumbnailBaseUrl, availablePaintings } = inputs;
  const base = thumbnailBaseUrl ?? DEFAULT_BASE_URL;
  const groupTypeNum = Number(groupType);

  // Filter skin rows belonging to this ship group, then sort by skin ID ascending
  const skinEntries = Object.entries(skinTemplate)
    .filter(([, row]) => row !== undefined && row.ship_group === groupTypeNum)
    .sort(([a], [b]) => {
      const diff = Number(a) - Number(b);
      return diff;
    });

  if (skinEntries.length === 0) {
    return { skins: [] };
  }

  const skins: Ship["skins"] = [];

  for (const [skinId, row] of skinEntries) {
    if (row === undefined) continue;

    // name: row.name if non-empty, else row.desc if non-empty, else "(unnamed)"
    const name =
      row.name.trim().length > 0
        ? row.name.trim()
        : (row.desc?.trim().length ?? 0) > 0
          ? (row.desc?.trim() ?? "(unnamed)")
          : "(unnamed)";

    // image URL
    const image = `${base}/${row.painting}.webp`;

    // shop info
    const shopId = row.shop_id;
    let cost: number | undefined;
    let isAlways = false;
    let hasValidShop = false;

    if (shopId !== undefined && shopId !== 0) {
      const shopEntry = shopTemplate[String(shopId)];
      if (shopEntry !== undefined) {
        const isShopGenre =
          shopEntry.genre === "skin_shop" || shopEntry.effect_args !== undefined;
        const resourceNum = shopEntry.resource_num;
        if (isShopGenre && resourceNum !== undefined && resourceNum > 0) {
          cost = resourceNum;
        }
        isAlways = isAlwaysAvailable(shopEntry.time);
        hasValidShop = true;
      }
    }

    // obtainedFrom heuristic
    let obtainedFrom: string;
    if (row.skin_type === -1) {
      obtainedFrom = "Default";
    } else if (hasValidShop && isAlways) {
      obtainedFrom = "Skin Shop";
    } else if (shopId !== undefined && shopId !== 0) {
      obtainedFrom = "Limited (Event)";
    } else if (
      row.skin_type === 7 ||
      name.toLowerCase().includes("pledge")
    ) {
      obtainedFrom = "Wedding";
    } else {
      obtainedFrom = "Special";
    }

    // live2dModel
    const live2dModel = hasLive2d(row.l2d_animations) ? true : undefined;

    const info: Ship["skins"][number]["info"] = {
      ...(cost !== undefined ? { cost } : {}),
      obtainedFrom,
      ...(live2dModel !== undefined ? { live2dModel } : {}),
      enClient: "Yes",
    };

    // Build variant images object
    const images = buildVariantImages(row.painting, base, availablePaintings);

    skins.push({ name, image, images, info });
  }

  return { skins };
}
