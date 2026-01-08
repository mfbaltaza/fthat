document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  // Main View
  const mainView = document.getElementById('main-view');
  const settingsView = document.getElementById('settings-view');
  const toggle = document.getElementById('toggle');
  const statusDiv = document.getElementById('status');
  const challengeSection = document.getElementById('challenge-section');
  const challengeInput = document.getElementById('challenge-input');
  const settingsBtn = document.getElementById('settings-btn');

  // Settings View
  const backBtn = document.getElementById('back-btn');
  const siteList = document.getElementById('site-list');
  const newSiteInput = document.getElementById('new-site-input');
  const addBtn = document.getElementById('add-btn');

  const TARGET_PHRASE = "I am extremely weak, and I need a break. Please let me fail";
  const DEFAULT_BLOCKED_SITES = ["facebook.com", "instagram.com", "x.com", "tiktok.com"];

  // --- Initialization ---
  
  // Load initial state
  chrome.storage.local.get(['isEnabled', 'blockedSites'], (data) => {
    const isEnabled = data.isEnabled !== false; // Default to true
    toggle.checked = isEnabled;
    updateStatusUI(isEnabled);

    // Initialize list if needed
    if (!data.blockedSites) {
      chrome.storage.local.set({ blockedSites: DEFAULT_BLOCKED_SITES });
    }
  });

  // --- Main View Logic ---

  // Handle Toggle Click
  toggle.addEventListener('click', (e) => {
    if (toggle.checked) {
      // Trying to enable
      enableExtension();
    } else {
      // Trying to disable
      e.preventDefault(); // Stop the toggle from moving immediately
      toggle.checked = true; // Keep it visually on for now
      challengeSection.style.display = 'block';
      challengeInput.value = '';
      challengeInput.focus();
    }
  });

  // Handle Input for Challenge
  challengeInput.addEventListener('input', (e) => {
    if (e.target.value === TARGET_PHRASE) {
      disableExtension();
    }
  });

  // Prevent Paste
  challengeInput.addEventListener('paste', (e) => {
    e.preventDefault();
    alert("Cheating is not allowed. Type it out.");
  });

  function enableExtension() {
    chrome.storage.local.set({ isEnabled: true, visitCounts: {} }, () => {
      updateStatusUI(true);
      challengeSection.style.display = 'none';
    });
  }

  function disableExtension() {
    chrome.storage.local.set({ isEnabled: false }, () => {
      toggle.checked = false;
      updateStatusUI(false);
      challengeSection.style.display = 'none';
      challengeInput.value = '';
    });
  }

  function updateStatusUI(isEnabled) {
    statusDiv.textContent = isEnabled ? "Focus Enabled" : "Focus Disabled";
    statusDiv.style.color = isEnabled ? "#D32F2F" : "#A0A0A0";
  }

  // --- Navigation ---

  settingsBtn.addEventListener('click', () => {
    mainView.classList.add('hidden');
    settingsView.classList.remove('hidden');
    renderSiteList();
  });

  backBtn.addEventListener('click', () => {
    settingsView.classList.add('hidden');
    mainView.classList.remove('hidden');
  });

  // --- Settings Logic ---

  function renderSiteList() {
    chrome.storage.local.get(['blockedSites'], (data) => {
      const sites = data.blockedSites || DEFAULT_BLOCKED_SITES;
      siteList.innerHTML = '';

      sites.forEach(site => {
        const li = document.createElement('li');
        li.className = 'site-item';
        
        const span = document.createElement('span');
        span.className = 'site-name';
        span.textContent = site;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.title = 'Remove site';
        removeBtn.onclick = () => removeSite(site);

        li.appendChild(span);
        li.appendChild(removeBtn);
        siteList.appendChild(li);
      });
    });
  }

  function addSite() {
    const rawInput = newSiteInput.value.trim().toLowerCase();
    if (!rawInput) return;

    // Basic clean up (remove http://, www., etc)
    let domain = rawInput;
    try {
      if (!domain.startsWith('http')) {
        domain = 'https://' + domain;
      }
      domain = new URL(domain).hostname;
    } catch (e) {
      // If URL parsing fails, just use the raw input if it looks vaguely like a domain
      domain = rawInput;
    }
    
    // Remove 'www.' if present for cleaner matching
    domain = domain.replace(/^www\./, '');

    chrome.storage.local.get(['blockedSites'], (data) => {
      const sites = data.blockedSites || DEFAULT_BLOCKED_SITES;
      
      if (!sites.includes(domain)) {
        const updatedSites = [...sites, domain];
        chrome.storage.local.set({ blockedSites: updatedSites }, () => {
          newSiteInput.value = '';
          renderSiteList();
        });
      } else {
        alert('Site already blocked.');
      }
    });
  }

  function removeSite(siteToRemove) {
    chrome.storage.local.get(['blockedSites'], (data) => {
      const sites = data.blockedSites || DEFAULT_BLOCKED_SITES;
      const updatedSites = sites.filter(site => site !== siteToRemove);
      
      chrome.storage.local.set({ blockedSites: updatedSites }, () => {
        renderSiteList();
      });
    });
  }

  addBtn.addEventListener('click', addSite);
  newSiteInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
  });

});
