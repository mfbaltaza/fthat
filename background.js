// background.js

const DEFAULT_BLOCKED_SITES = ["facebook.com", "instagram.com", "x.com", "tiktok.com"];

// Initialize default state
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["isEnabled", "visitCounts", "lastResetDate", "blockedSites"], (result) => {
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
    // visitCounts will now be an object: { "facebook.com": 3, "x.com": 1 }
    if (result.visitCounts === undefined || typeof result.visitCounts === 'number') {
      chrome.storage.local.set({ visitCounts: {} });
    }
    if (result.blockedSites === undefined) {
      chrome.storage.local.set({ blockedSites: DEFAULT_BLOCKED_SITES });
    }
    if (result.lastResetDate === undefined) {
      const today = new Date().toISOString().split('T')[0];
      chrome.storage.local.set({ lastResetDate: today });
    }
  });
});

function getDomainFromUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    // Simple extraction. "www.facebook.com" -> "facebook.com" logic could be added,
    // but for now we'll match if the hostname *includes* the blocked string.
    return hostname;
  } catch (e) {
    return null;
  }
}

// Check if the current URL matches any of our blocked sites
function findMatchingBlockedSite(url, blockedSites) {
  if (!url) return null;
  const hostname = getDomainFromUrl(url);
  if (!hostname) return null;

  for (const site of blockedSites) {
    if (hostname.includes(site)) {
      return site; // Return the key (e.g., "facebook.com")
    }
  }
  return null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only act on loading to catch them early
  if (changeInfo.status === 'loading' && tab.url) {
    checkAndAct(tabId, tab.url);
  }
});

function checkAndAct(tabId, url) {
  chrome.storage.local.get(["isEnabled", "visitCounts", "lastResetDate", "blockedSites"], (data) => {
    if (!data.isEnabled) return; // Extension disabled

    const blockedSites = data.blockedSites || DEFAULT_BLOCKED_SITES;
    const matchingSite = findMatchingBlockedSite(url, blockedSites);

    // If this site isn't blocked, exit immediately
    if (!matchingSite) return;

    const today = new Date().toISOString().split('T')[0];
    let counts = data.visitCounts || {};

    // Daily Reset check
    if (data.lastResetDate !== today) {
      counts = {}; // Reset all counts
      chrome.storage.local.set({ lastResetDate: today });
    }

    // Get count for this specific site
    const currentCount = counts[matchingSite] || 0;
    const newCount = currentCount + 1;

    // Update the counts object
    counts[matchingSite] = newCount;
    chrome.storage.local.set({ visitCounts: counts });

    if (newCount <= 5) {
      // Close the tab immediately
      chrome.tabs.remove(tabId);
    } else {
      // Allow to load. Content script handles the "Begging" screen.
      console.log(`Limit reached for ${matchingSite}. Letting content script handle it.`);
    }
  });
}
