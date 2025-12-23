## Dokploy deployment

### What runs in production

- **Single container** built from repo root `Dockerfile`
- **HTTP**: `:3000`
- **WebSocket**: same port, **`/ws`**

The container starts `node web/server/app-server.js`, which runs Next.js and attaches WebSocket upgrade handling on `/ws`.

### Dokploy setup

- **Build type**: Dockerfile
- **Dockerfile path**: `Dockerfile` (repo root)
- **Internal port**: `3000`
- **Domain**: attach your domain (enable SSL/HTTPS)

### Environment variables

- **Recommended**:
  - `PORT=3000` (optional; default is 3000)
  - `HOSTNAME=0.0.0.0` (optional)
- **Public runtime config (no rebuild)**:
  - `NEXT_PUBLIC_WS_URL` (optional): if set, overrides WebSocket URL (otherwise `wss://<your-domain>/ws` or `ws://`).
  - `NEXT_PUBLIC_API_URL` (optional): backend/base API URL for client usage.

### Quick checks after deploy

- Open the site: `https://<your-domain>`
- WebSocket endpoint: `wss://<your-domain>/ws`
- Runtime env script: `https://<your-domain>/runtime-env.js`

### Docker Hub (CI publish)

This repo includes GitHub Actions workflow that builds the root `Dockerfile` and pushes the image to Docker Hub.

Add repository secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN` (Docker Hub access token)
- `DOCKERHUB_REPO` (repository name on Docker Hub, e.g. `sb-zum` or `zavidovo`)

