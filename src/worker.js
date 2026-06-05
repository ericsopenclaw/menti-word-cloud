export { WordCloudRoom };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/info") {
      const room = getRoom(env);
      const stateResponse = await room.fetch(new Request(`${url.origin}/state`));
      const state = await stateResponse.json();
      return json({
        joinUrl: `${url.origin}/join.html`,
        totalEntries: state.totalEntries,
        words: state.words
      });
    }

    if (url.pathname === "/ws") {
      return getRoom(env).fetch(request);
    }

    return env.ASSETS.fetch(request);
  }
};

class WordCloudRoom {
  constructor(ctx) {
    this.ctx = ctx;
    this.statePromise = this.loadState();
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/state") {
      const state = await this.getState();
      return json(state);
    }

    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    server.send(JSON.stringify({ type: "state", ...(await this.getState()) }));

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  async webSocketMessage(ws, message) {
    let payload;
    try {
      payload = JSON.parse(message);
    } catch {
      ws.send(JSON.stringify({ type: "ack", ok: false, message: "Bad message" }));
      return;
    }

    if (payload.type === "add") {
      const pieces = normalizeInput(payload.text);
      if (pieces.length === 0) {
        ws.send(JSON.stringify({
          type: "ack",
          requestId: payload.requestId,
          ok: false,
          message: "請輸入文字"
        }));
        return;
      }

      const current = await this.getState();
      const counts = new Map(current.words.map((word) => [word.text, word.count]));
      for (const piece of pieces) {
        counts.set(piece, (counts.get(piece) || 0) + 1);
      }

      await this.saveState({
        totalEntries: current.totalEntries + pieces.length,
        words: sortWords(counts)
      });

      ws.send(JSON.stringify({
        type: "ack",
        requestId: payload.requestId,
        ok: true,
        accepted: pieces.length
      }));
      await this.broadcast();
      return;
    }

    if (payload.type === "clear") {
      await this.saveState({ totalEntries: 0, words: [] });
      await this.broadcast();
    }
  }

  async webSocketClose() {}

  async webSocketError() {}

  async broadcast() {
    const state = await this.getState();
    const message = JSON.stringify({ type: "state", ...state });
    for (const socket of this.ctx.getWebSockets()) {
      socket.send(message);
    }
  }

  async getState() {
    return this.statePromise;
  }

  async loadState() {
    return (await this.ctx.storage.get("state")) || { totalEntries: 0, words: [] };
  }

  async saveState(state) {
    this.statePromise = Promise.resolve(state);
    await this.ctx.storage.put("state", state);
  }
}

function getRoom(env) {
  return env.WORD_CLOUD.get(env.WORD_CLOUD.idFromName("main"));
}

function normalizeInput(value) {
  if (typeof value !== "string") return [];
  return Array.from(new Set(
    value
      .split(/[\n,，、;；|]+/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/\s+/g, " "))
      .filter((item) => item.length <= 32)
  )).slice(0, 5);
}

function sortWords(counts) {
  return Array.from(counts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text))
    .slice(0, 80);
}

function json(data) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
