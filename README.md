# Menti Word Cloud

QR-code audience input with a realtime presenter word cloud.

## Run Locally

```bash
npm install
npm start
```

Open the presenter page:

```text
http://localhost:3000/
```

The presenter page generates a LAN QR code for the audience input page.
Audience phones must be on the same Wi-Fi network when running locally.

## Features

- Presenter page with QR code
- Audience input page
- Realtime word cloud via Socket.IO
- Multiple words per submission with comma/newline separation
- Clear and demo controls

## Deployment Note

This app uses a Node server and Socket.IO WebSockets. Vercel can host the
static frontend, but Vercel Functions cannot act as a WebSocket server. To
deploy this app publicly with realtime behavior, use one of these approaches:

- Deploy the current Node/Socket.IO app to a WebSocket-capable host such as
  Render, Railway, Fly.io, or a VPS.
- Keep the frontend on Vercel and add a realtime provider such as Supabase,
  Firebase Realtime Database, Ably, Pusher, Convex, or Liveblocks.

GitHub Pages has the same static-only limitation and cannot run this server.
