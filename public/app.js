const cloud = document.querySelector("#wordCloud");
const entryCount = document.querySelector("#entryCount");
const qrCode = document.querySelector("#qrCode");
const joinUrl = document.querySelector("#joinUrl");
const clearButton = document.querySelector("#clearButton");
const demoButton = document.querySelector("#demoButton");

const demoWords = [
  "AI",
  "效率",
  "影像品質",
  "臨床決策",
  "報告速度",
  "團隊合作",
  "精準醫療",
  "Workflow",
  "病人安全",
  "自動化"
];

let ws;

fetch("/api/info")
  .then((response) => response.json())
  .then((info) => {
    qrCode.innerHTML = "";
    new QRCode(qrCode, {
      text: info.joinUrl,
      width: 260,
      height: 260,
      colorDark: "#111827",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
    joinUrl.href = info.joinUrl;
    joinUrl.textContent = info.joinUrl;
    renderCloud(info.words, info.totalEntries);
  });

connect();

clearButton.addEventListener("click", () => {
  send({ type: "clear" });
});

demoButton.addEventListener("click", () => {
  const word = demoWords[Math.floor(Math.random() * demoWords.length)];
  send({ type: "add", text: word });
});

function connect() {
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${protocol}://${location.host}/ws`);

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.type === "state") {
      renderCloud(message.words, message.totalEntries);
    }
  });

  ws.addEventListener("close", () => {
    setTimeout(connect, 1000);
  });
}

function send(message) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify(message));
}

function renderCloud(words, totalEntries) {
  entryCount.textContent = totalEntries;
  cloud.innerHTML = "";

  if (!words || words.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "等待第一筆回應";
    cloud.append(empty);
    return;
  }

  const max = Math.max(...words.map((word) => word.count));
  const palette = ["ink", "blue", "green", "rose", "amber", "violet"];

  words.forEach((word, index) => {
    const node = document.createElement("span");
    const weight = max === 1 ? 0.5 : word.count / max;
    const size = 22 + weight * 58;
    node.className = `cloud-word ${palette[index % palette.length]}`;
    node.style.fontSize = `${size}px`;
    node.style.setProperty("--mobile-size", `${Math.min(size, 42)}px`);
    node.style.setProperty("--tilt", `${(index % 5) * 2 - 4}deg`);
    node.textContent = word.text;
    node.title = `${word.count} 次`;
    cloud.append(node);
  });
}
