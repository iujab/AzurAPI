// Central config for GitHub URLs.
const GITHUB_USER = "iujab";
const GITHUB_BRANCH = "main";

// Image URLs (azurlane-images repo)
const IMAGES_REPO = "azurlane-images";
export const IMAGE_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${IMAGES_REPO}/${GITHUB_BRANCH}`;
export const PAINTINGS_URL = `${IMAGE_BASE_URL}/paintings`;
export const THUMBNAILS_URL = `${IMAGE_BASE_URL}/thumbnails`;

// Data URLs (Lycoris-AzurAPI repo — for runtime fetch)
const DATA_REPO = "Lycoris-AzurAPI";
export const DATA_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_USER}/${DATA_REPO}/${GITHUB_BRANCH}/data`;
