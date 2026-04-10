<img src="https://github.com/iujab/azurlane-images/blob/main/banner.png" />

# AzurAPI - js

A self-maintained, current Azur Lane data library. Drop-in replacement for the `@azurapi/azurapi` package.

## Why?

The older and amazing `@azurapi/azurapi` ecosystem is now 3+ years stale. I have fond memories starting off my computer science hobby building a discord bot using that API. Recently, when revisiting that project, I noticed that the azurapi package was years out of date, likely due to the wiki scraper method no longer being viable. This AzurAPI builds on the [AzurLaneTools/AzurLaneData](https://github.com/AzurLaneTools/AzurLaneData) and [nobbyfix/AzurLane-AssetDownloader](https://github.com/nobbyfix/AzurLane-AssetDownloader) repos so our data stays fresh within hours of each game patch.

## Installation

```bash
npm install @lycoristech/azurapi
```

## Usage

```ts
import { AzurData } from "@lycoristech/azurapi";

const azur = new AzurData();

// Get a ship by name, ID, or fuzzy search
const belfast = azur.ships.get("Belfast");
const byId    = azur.ships.get("20212");
const byCode  = azur.ships.get("115");

// Get all ships
const all = azur.ships.getAll();
console.log(`${azur.ships.count()} ships loaded`);

// Fuzzy search
const results = azur.ships.search("Enterp", 5); // top 5 matches
```

## Migrating from @azurapi/azurapi

```diff
- import { AzurAPI } from "@azurapi/azurapi";
+ import { AzurData as AzurAPI } from "@lycoristech/azurapi";
```

That's it. The `ships.get()` API is compatible. Ship objects match the same schema!

## Data Freshness

Data is auto-refreshed weekly (every Monday) via GitHub Actions from [AzurLaneTools/AzurLaneData](https://github.com/AzurLaneTools/AzurLaneData) (EN + CN + JP regions). The refresh pipeline:
1. Sparse-clones the upstream repo
2. Normalizes raw game tables into AzurAPI-compatible JSON
3. Runs sanity checks (schema validation, field coverage)
4. Commits updated `data/*.json` only if data changed

You can also trigger a refresh manually from the Actions tab, or run `npm run build:data` locally.

Current data version: see [`data/version.json`](data/version.json).

## Ship Schema

Ships have the full AzurAPI-compatible shape including:
- Identity: `id`, `names`, `rarity`, `class`, `hullType`, `nationality`
- Stats: level 100/120, with and without retrofit
- Equipment slots with min/max efficiency
- Skills with max-rank substituted descriptions
- Limit breaks, construction info, fleet tech
- Skins with metadata
- And more — see [`src/schema/output/ship.ts`](src/schema/output/ship.ts)

## Raw JSON Access

The committed `data/ships.json` is fetchable via GitHub raw URL:

```
https://raw.githubusercontent.com/iujab/AzurAPI/main/data/ships.json
```

Also available: `ship-list.json` (minimal index), `id-map.json` (name→id lookup), `version.json`.

## Development

```bash
# Install deps
npm install

# Build data from upstream (requires upstream/ sparse checkout)
npm run build:data

# Verify data integrity
npm run verify

# Run tests
npm test

# Type check
npm run typecheck
```

## Asset Images

Ship paintings and thumbnails are hosted in a separate GitHub repo: [iujab/azurlane-images](https://github.com/iujab/azurlane-images). Image URLs in ship data point to raw GitHub URLs from that repo:

- **Paintings** — skin art in WebP format (`paintings/{asset_name}.webp`)
- **Thumbnails** — shipyard icons in PNG format (`thumbnails/{group_type}.png`)

## License

MIT for the code. Game data is extracted from publicly available game files and is the property of Yostar/Manjuu/Yongshi. This project is not affiliated with or endorsed by any of these companies.

## Acknowledgments

- [AzurLaneTools/AzurLaneData](https://github.com/AzurLaneTools/AzurLaneData) — upstream auto-updating game data
- [nobbyfix/AzurLane-AssetDownloader](https://github.com/nobbyfix/AzurLane-AssetDownloader) — game asset extraction
- [AzurAPI/azurapi-js](https://github.com/AzurAPI/azurapi-js) — the original library whose schema we replicate, and is the base inspiration for this project!❤️
