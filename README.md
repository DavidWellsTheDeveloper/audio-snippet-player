# Audio Snippet Player

Play a time range (snippet) of audio from a URL or YouTube. Built with Nuxt 3, Vuetify, and TypeScript.

## Features

- **Player** (`/`): Play a snippet from URL params `url`, `start` (seconds), `end` (seconds). Optional `hideVideo=1` for YouTube (audio only, with play/pause buttons).
- **YouTube**: Official embed with `start` and `end`; starts paused, stops at end. High-quality audio supported.
- **Direct audio**: HTML5 `<audio>` with snippet logic; optional Nitro proxy when run with a server if CORS blocks playback.
- **Create snippet** (`/form`): Form to paste URL, set start/end, toggle hide video, then open the player or save the snippet.
- **Saved snippets** (`/saved`): List of snippets saved in the browser (IndexedDB). Name, date saved, and player URL. Click to open in a new tab; delete as needed.
- **UI**: Teal theme (light/dark), top nav, footer, mobile drawer, responsive layout.

## URL parameters

| Param      | Description                    |
| ---------- | ------------------------------ |
| `url`      | YouTube or direct audio URL    |
| `start`    | Start time in seconds          |
| `end`      | End time in seconds            |
| `hideVideo`| Optional; `1` = hide YouTube video (audio only) |

**Example (YouTube):** `/?url=https://www.youtube.com/watch?v=VIDEO_ID&start=30&end=90`  
**Example (YouTube, audio only):** `/?url=https://www.youtube.com/watch?v=VIDEO_ID&start=30&end=90&hideVideo=1`  
**Example (direct):** `/?url=https://example.com/track.mp3&start=0&end=60`

## Static deploy

Run `npm run generate` and deploy `.output/public` to any static host. YouTube and CORS-friendly direct URLs work without a server. For direct URLs that block CORS, run the app with a server so the `/api/proxy` route is available.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production (SSR):

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Generate a static site (for S3/CloudFront or any static host):

```bash
# npm
npm run generate

# pnpm
pnpm generate

# yarn
yarn generate

# bun
bun run generate
```

Output is in `.output/public`. Locally preview a production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## Deployment (GitHub + AWS)

To deploy to **snippets.davidwellsthedeveloper.com** on push to `master`, see **[DEPLOY-SETUP.md](./DEPLOY-SETUP.md)** for the full checklist (GitHub repo, Secrets/Variables, S3, CloudFront, Route 53, IAM). The workflow is in `.github/workflows/deploy.yml`.

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
