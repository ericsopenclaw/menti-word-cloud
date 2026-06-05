# Menti Word Cloud

QR-code audience input with a realtime presenter word cloud.

Live Cloudflare Worker:

```text
https://menti-word-cloud.eric020730.com/
```

## Run Locally

```bash
npm install
npm run dev
```

Open the local presenter page:

```text
http://localhost:8787/
```

The presenter page generates a QR code for the audience input page.

## Features

- Presenter page with QR code
- Audience input page
- Realtime word cloud via Cloudflare Durable Objects and WebSockets
- Multiple words per submission with comma/newline separation
- Clear and demo controls

## Deploy

```bash
npm run deploy
```

The Worker is configured with:

- static assets from `public/`
- `WordCloudRoom` Durable Object for shared state
- custom domain `menti-word-cloud.eric020730.com`

GitHub Pages and Vercel static hosting cannot run this realtime backend by
themselves; Cloudflare Workers is the production target for this version.
