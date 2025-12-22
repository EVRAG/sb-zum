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
- **WebSocket URL**:
  - By default the client derives it from the current site URL: `wss://<your-domain>/ws` (or `ws://` without HTTPS).
  - Setting `NEXT_PUBLIC_WS_URL` is **not required** and is only useful if you want to force WS to a different host/path.
    Keep in mind `NEXT_PUBLIC_*` is baked into the Next.js build, so changing it requires a rebuild/redeploy.

### Quick checks after deploy

- Open the site: `https://<your-domain>`
- WebSocket endpoint: `wss://<your-domain>/ws`

