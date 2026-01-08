// content.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showBlockScreen") {
    window.stop();
    document.documentElement.innerHTML = "";

    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.height = "100vh";
    container.style.width = "100vw";
    container.style.backgroundColor = "white";
    container.style.color = "black";
    container.style.fontFamily = "'Times New Roman', serif";
    container.style.fontSize = "24px";
    container.style.fontStyle = "italic";
    container.style.textAlign = "center";
    container.style.margin = "0";
    container.style.padding = "0";
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.zIndex = "2147483647";

    const text = document.createElement("p");
    text.textContent = "Are you going to make us beg, dawg?";

    container.appendChild(text);

    if (document.body) {
      document.body.appendChild(container);
    } else {
      const body = document.createElement("body");
      document.documentElement.appendChild(body);
      body.appendChild(container);
    }
  }
});
