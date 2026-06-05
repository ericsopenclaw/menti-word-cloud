const form = document.querySelector("#wordForm");
const input = document.querySelector("#wordInput");
const statusText = document.querySelector("#statusText");
const pending = new Map();
let ws;

connect();

function connect() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${protocol}://${location.host}/ws`);

  ws.addEventListener("open", () => {
    statusText.textContent = "已連線，可以送出。";
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type !== "ack" || !message.requestId) return;
    const resolve = pending.get(message.requestId);
    if (!resolve) return;
    pending.delete(message.requestId);
    resolve(message);
  });

  ws.addEventListener("close", () => {
    statusText.textContent = "連線中斷，正在重連...";
    setTimeout(connect, 1000);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    statusText.textContent = "請先輸入文字。";
    input.focus();
    return;
  }

  send({ type: "add", text }).then((result) => {
    if (!result || !result.ok) {
      statusText.textContent = (result && result.message) || "送出失敗，請再試一次。";
      return;
    }

    input.value = "";
    statusText.textContent = `已送出 ${result.accepted} 筆。`;
    input.focus();
  });
});

function send(message) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    statusText.textContent = "尚未連線，請稍候。";
    return Promise.resolve({ ok: false });
  }

  const requestId = crypto.randomUUID();
  ws.send(JSON.stringify({ ...message, requestId }));
  return new Promise((resolve) => {
    pending.set(requestId, resolve);
    setTimeout(() => {
      if (!pending.has(requestId)) return;
      pending.delete(requestId);
      resolve({ ok: false, message: "連線逾時，請再試一次。" });
    }, 5000);
  });
}
