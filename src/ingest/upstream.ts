import path from "path";

export const UPSTREAM_ROOT = path.resolve(process.cwd(), "upstream/azurlane-data");

export type Region = "EN" | "CN" | "JP" | "KR" | "TW";

export function regionPath(region: Region, ...segments: string[]): string {
  return path.join(UPSTREAM_ROOT, region, ...segments);
}
