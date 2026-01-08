// content.js

function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

chrome.storage.local.get(["isEnabled", "visitCounts", "blockedSites"], (data) => {
  if (!data.isEnabled) return;

  const blockedSites = data.blockedSites || [];
  const currentHost = window.location.hostname;
  
  // Find which blocked site this is (if any)
  const matchingSite = blockedSites.find(site => currentHost.includes(site));

  if (!matchingSite) return; // Not a blocked site, exit immediately.

  // Check the count for this specific site
  const counts = data.visitCounts || {};
  const siteCount = counts[matchingSite] || 0;

  // If count > 5, we block the page
  if (siteCount > 5) {
    // Stop the window from loading further resources if possible
    window.stop();

    // Nuke the DOM
    document.documentElement.innerHTML = "";

    // Create the message container
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
    container.style.zIndex = "2147483647"; // Max z-index

    const text = document.createElement("p");
    text.textContent = "“Are you going to make us beg, dawg?”";
    
    container.appendChild(text);
    
    // Ensure we attach it somewhere valid
    if (document.body) {
        document.body.appendChild(container);
    } else {
        const body = document.createElement("body");
        document.documentElement.appendChild(body);
        body.appendChild(container);
    }
  }
});
