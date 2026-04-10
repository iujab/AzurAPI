import fs from "fs";
import path from "path";

// ---------------------------------------------------------------------------
// writeVersion
// ---------------------------------------------------------------------------

export interface VersionInfo {
  generatedAt: string;
  shipCount: number;
  schemaVersion: string;
}

/**
 * Write a small version metadata file.
 * Shape: { generatedAt: ISO8601, shipCount: number, schemaVersion: string }
 */
export function writeVersion(shipCount: number, outputPath = "data/version.json"): void {
  const info: VersionInfo = {
    generatedAt: new Date().toISOString(),
    shipCount,
    schemaVersion: "0.0.1",
  };

  const json = JSON.stringify(info, null, 2);

  const dir = path.dirname(path.resolve(outputPath));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, json, "utf-8");
}
