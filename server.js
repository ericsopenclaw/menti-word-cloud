const os = require("os");
const path = require("path");
const express = require("express");
const http = require("http");
const QRCode = require("qrcode");
const { Server } = require("socket.io");

const PORT = Number(process.env.PORT || 3000);
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const entries = [];
const counts = new Map();

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/info", async (req, res) => {
  const origin = getPublicOrigin(req);
  const joinUrl = `${origin}/join.html`;
  const qrDataUrl = await QRCode.toDataURL(joinUrl, {
    margin: 1,
    width: 420,
    color: { dark: "#111827", light: "#ffffff" }
  });

  res.json({
    joinUrl,
    qrDataUrl,
    totalEntries: entries.length,
    words: getWords()
  });
});

io.on("connection", (socket) => {
  socket.emit("cloud:update", {
    totalEntries: entries.length,
    words: getWords()
  });

  socket.on("word:add", (payload, ack) => {
    const pieces = normalizeInput(payload && payload.text);
    if (pieces.length === 0) {
      ack && ack({ ok: false, message: "請輸入文字" });
      return;
    }

    for (const piece of pieces) {
      entries.push({ text: piece, at: Date.now() });
      counts.set(piece, (counts.get(piece) || 0) + 1);
    }

    const state = {
      totalEntries: entries.length,
      words: getWords()
    };

    io.emit("cloud:update", state);
    ack && ack({ ok: true, accepted: pieces.length });
  });

  socket.on("cloud:clear", () => {
    entries.length = 0;
    counts.clear();
    io.emit("cloud:update", {
      totalEntries: 0,
      words: []
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  const localUrl = `http://localhost:${PORT}`;
  const lanUrl = getLanUrl(PORT);
  console.log(`Presenter: ${localUrl}`);
  if (lanUrl) console.log(`Audience QR target: ${lanUrl}/join.html`);
});

function getWords() {
  return Array.from(counts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, 80);
}

function normalizeInput(value) {
  if (typeof value !== "string") return [];

  const tokens = value
    .split(/[\n,，、;；|]+/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, " "))
    .filter((item) => item.length <= 32);

  return Array.from(new Set(tokens)).slice(0, 5);
}

function getPublicOrigin(req) {
  const host = req.get("host");
  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
    return `${protocol}://${host}`;
  }

  return getLanUrl(PORT) || `${protocol}://${host || `localhost:${PORT}`}`;
}

function getLanUrl(port) {
  const interfaces = os.networkInterfaces();
  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses || []) {
      if (address.family === "IPv4" && !address.internal) {
        return `http://${address.address}:${port}`;
      }
    }
  }
  return null;
}
