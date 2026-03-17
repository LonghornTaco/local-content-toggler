const STORAGE_KEY = 'Sitecore.Pages.LocalXmCloudUrl';
const DEFAULT_URL = 'https://local.cm.mcc.mayo.edu/';
const PAGES_ORIGIN = 'https://pages.sitecorecloud.io';

const toggle = document.getElementById('toggle');
const statusLabel = document.getElementById('status-label');
const urlInput = document.getElementById('url-input');
const saveBtn = document.getElementById('save-url');
const controls = document.getElementById('controls');
const notPages = document.getElementById('not-pages');

let currentTabId = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.startsWith(PAGES_ORIGIN)) {
    controls.hidden = true;
    notPages.hidden = false;
    return;
  }

  currentTabId = tab.id;

  // Load saved URL from chrome.storage
  const { localCmUrl } = await chrome.storage.sync.get({ localCmUrl: DEFAULT_URL });
  urlInput.value = localCmUrl;

  // Check current state of localStorage on the page
  const results = await chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (key) => localStorage.getItem(key),
    args: [STORAGE_KEY]
  });

  const currentValue = results[0]?.result;
  const isEnabled = currentValue != null;

  toggle.checked = isEnabled;
  updateStatusLabel(isEnabled);

  // If there's a value in localStorage, show it (in case it differs from saved)
  if (isEnabled && currentValue) {
    urlInput.value = currentValue;
  }
}

function updateStatusLabel(isEnabled) {
  statusLabel.textContent = isEnabled ? 'On' : 'Off';
  statusLabel.classList.toggle('active', isEnabled);
}

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  const url = urlInput.value.trim() || DEFAULT_URL;

  await chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (key, value, shouldEnable) => {
      if (shouldEnable) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    },
    args: [STORAGE_KEY, url, enabled]
  });

  updateStatusLabel(enabled);

  // Update badge
  chrome.action.setBadgeText({ tabId: currentTabId, text: enabled ? 'ON' : '' });
  chrome.action.setBadgeBackgroundColor({ tabId: currentTabId, color: enabled ? '#22c55e' : '#6b7280' });

  const size = enabled ? 'on' : 'off';
  chrome.action.setIcon({
    tabId: currentTabId,
    path: {
      16: `icons/icon-${size}-16.png`,
      48: `icons/icon-${size}-48.png`,
      128: `icons/icon-${size}-128.png`
    }
  });

  // Reload the page so Pages picks up the change
  chrome.tabs.reload(currentTabId);
  window.close();
});

saveBtn.addEventListener('click', async () => {
  const url = urlInput.value.trim() || DEFAULT_URL;
  await chrome.storage.sync.set({ localCmUrl: url });

  // If toggle is on, update localStorage too
  if (toggle.checked) {
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: (key, value) => localStorage.setItem(key, value),
      args: [STORAGE_KEY, url]
    });
  }

  saveBtn.textContent = 'Saved!';
  saveBtn.classList.add('saved');
  setTimeout(() => {
    saveBtn.textContent = 'Save URL';
    saveBtn.classList.remove('saved');
  }, 1500);
});

init();
