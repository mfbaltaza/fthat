// background.js

const DEFAULT_BLOCKED_SITES = ["facebook.com", "instagram.com", "x.com", "tiktok.com"];
let storageUpdateQueue = Promise.resolve();

function getDomainFromUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

function matchesBlockedSite(hostname, blockedSites) {
  if (!hostname) return null;
  for (const site of blockedSites) {
    if (hostname === site || hostname.endsWith('.' + site)) {
      return site;
    }
  }
  return null;
}

function queueStorageUpdate(updateFn) {
  storageUpdateQueue = storageUpdateQueue.then(() => {
    return new Promise((resolve) => {
      chrome.storage.local.get(["isEnabled", "visitCounts", "lastResetDate", "blockedSites"], (data) => {
        const result = updateFn(data);
        if (result) {
          chrome.storage.local.set(result, () => resolve());
        } else {
          resolve();
        }
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["isEnabled", "visitCounts", "lastResetDate", "blockedSites"], (result) => {
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
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

function findMatchingBlockedSite(url, blockedSites) {
  if (!url) return null;
  const hostname = getDomainFromUrl(url);
  if (!hostname) return null;
  return matchesBlockedSite(hostname, blockedSites);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    checkAndAct(tabId, tab.url);
  }
});

function checkAndAct(tabId, url) {
  queueStorageUpdate((data) => {
    if (!data.isEnabled) return null;

    const blockedSites = data.blockedSites || DEFAULT_BLOCKED_SITES;
    const matchingSite = findMatchingBlockedSite(url, blockedSites);

    if (!matchingSite) return null;

    const today = new Date().toISOString().split('T')[0];
    let counts = data.visitCounts || {};

    if (data.lastResetDate !== today) {
      counts = {};
    }

    const currentCount = counts[matchingSite] || 0;
    const newCount = currentCount + 1;
    counts[matchingSite] = newCount;

    const updates = { visitCounts: counts };
    if (data.lastResetDate !== today) {
      updates.lastResetDate = today;
    }

    if (newCount <= 5) {
      chrome.tabs.remove(tabId, () => {
        if (chrome.runtime.lastError) {
          console.log('Tab removal skipped:', chrome.runtime.lastError.message);
        }
      });
    } else {
      chrome.tabs.sendMessage(tabId, { action: "showBlockScreen" }).catch(() => {});
    }

    return updates;
  });
}
