const socket = io();
const form = document.querySelector("#wordForm");
const input = document.querySelector("#wordInput");
const statusText = document.querySelector("#statusText");

socket.on("connect", () => {
  statusText.textContent = "已連線，可以送出。";
});

socket.on("disconnect", () => {
  statusText.textContent = "連線中斷，正在重連...";
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) {
    statusText.textContent = "請先輸入文字。";
    input.focus();
    return;
  }

  socket.emit("word:add", { text }, (result) => {
    if (!result || !result.ok) {
      statusText.textContent = (result && result.message) || "送出失敗，請再試一次。";
      return;
    }

    input.value = "";
    statusText.textContent = `已送出 ${result.accepted} 筆。`;
    input.focus();
  });
});
