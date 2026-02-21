# Audio Snippet Player

Play a time range (snippet) of audio from a URL or YouTube. Uses URL parameters: `url`, `start` (seconds), `end` (seconds).

- **YouTube**: Use any YouTube watch or embed URL; playback uses the official embed with `start` and `end` (starts paused, stops at end).
- **Direct audio**: Use a direct link to an audio file (e.g. `.mp3`). Some hosts block cross-origin playback; if playback fails, the app will try the proxy when run with a server.

**Example (YouTube):** `/?url=https://www.youtube.com/watch?v=VIDEO_ID&start=30&end=90`  
**Example (direct):** `/?url=https://example.com/track.mp3&start=0&end=60`

**Static deploy:** Run `npm run generate` and deploy `.output/public` to any static host. YouTube and CORS-friendly direct URLs work. For direct URLs that block CORS, run the app with a server (e.g. `npm run dev` or `node .output/server/index.mjs`) so the `/api/proxy` route is available.

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

Build the application for production:

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

Locally preview production build:

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
