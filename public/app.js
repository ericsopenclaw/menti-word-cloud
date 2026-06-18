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

  const palette = ["ink", "blue", "green", "rose", "amber", "violet"];

  const baseSize = 42;
  const growthPerRepeat = 10;
  const maxSize = 140;
  const mobileMaxSize = 72;

  words.forEach((word, index) => {
    const node = document.createElement("span");
    const size = Math.min(baseSize + (word.count - 1) * growthPerRepeat, maxSize);
    node.className = `cloud-word ${word.count > 1 ? "is-repeated" : ""} ${palette[index % palette.length]}`;
    node.style.fontSize = `${size}px`;
    node.style.setProperty("--mobile-size", `${Math.min(size, mobileMaxSize)}px`);
    node.style.setProperty("--tilt", `${(index % 5) * 2 - 4}deg`);
    const label = document.createElement("span");
    label.className = "cloud-word-label";
    label.textContent = word.text;

    const count = document.createElement("span");
    count.className = "cloud-word-count";
    count.textContent = word.count;
    count.setAttribute("aria-label", `${word.count} 次`);

    node.append(label, count);
    node.title = `${word.count} 次`;
    cloud.append(node);
  });
}
