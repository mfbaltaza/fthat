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
