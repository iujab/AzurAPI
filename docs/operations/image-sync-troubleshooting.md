# Image-Sync Troubleshooting

## Pipeline Recap

1. `iujab/azurlane-images/.github/workflows/refresh-images.yml` runs Sundays 12:00 UTC.
2. On any new file added, it commits + pushes, then fires `repository_dispatch` (`azurlane-images-updated`) at this repo.
3. This repo's `refresh-data.yml` rebuilds against the new images.

## Common failures

### Disk full during azlassets download
**Symptom:** runner exits with `No space left on device`.
**Fix:** restrict `download-folder-list` in `azurlane-images/config/user_config.yml`. If the cache lost the state files between runs, re-run the bootstrap workflow.

### Dispatch returns 403
**Symptom:** "Trigger AzurAPI rebuild" step fails with `gh: HTTP 403`.
**Fix:** the `AZURAPI_DISPATCH_TOKEN` secret in azurlane-images expired or has wrong scopes. Regenerate per the original setup checklist.

### AzurAPI build references 404 image URLs
**Symptom:** consumers report broken `paintings/*.webp` URLs.
**Cause:** AzurAPI built against a different commit than the one in production. Possible races: image push succeeds → dispatch fails → next AzurAPI cron picks it up correctly, but ships.json published in between is stale.
**Fix:** manually trigger `Refresh Ship Data` in the AzurAPI repo to rebuild against current HEAD.

### Game CDN returns 502/timeouts
**Symptom:** azlassets fails mid-download.
**Fix:** workflow will retry on next cron. If urgent, manually re-run.

### azlassets state cache mismatched with repo files
**Symptom:** workflow downloads bundles successfully but `Added 0 paintings, 0 thumbnails` even though there should be new skins.
**Cause:** state cache says "new bundle X downloaded" but its extracted PNG already exists in `paintings/` (likely from a prior manual commit).
**Fix:** this is the system working correctly — additive-only sync rejects duplicates. Confirm by checking the actual painting filenames against current EN game skins.
