const CM_STORAGE_KEY = 'Sitecore.Pages.LocalXmCloudUrl';
const RH_STORAGE_KEY = 'Sitecore.Pages.LocalRenderingHostUrl|test-tenant-id';
const RH_STORAGE_KEY_PREFIX = 'Sitecore.Pages.LocalRenderingHostUrl';
const DEFAULT_CM_URL = '';
const DEFAULT_RH_URL = '';
const PAGES_ORIGIN = 'https://pages.sitecorecloud.io';

const toggle = document.getElementById('toggle');
const statusLabel = document.getElementById('status-label');
const cmUrl = document.getElementById('cm-url');
const rhUrl = document.getElementById('rh-url');
const saveBtn = document.getElementById('save-btn');
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

  // Load saved URLs
  const stored = await chrome.storage.sync.get({
    localCmUrl: DEFAULT_CM_URL,
    localRhUrl: DEFAULT_RH_URL
  });
  cmUrl.value = stored.localCmUrl;
  rhUrl.value = stored.localRhUrl;

  // Read current localStorage state
  const results = await chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (cmKey, rhKey) => {
      return {
        cm: localStorage.getItem(cmKey),
        rh: localStorage.getItem(rhKey)
      };
    },
    args: [CM_STORAGE_KEY, RH_STORAGE_KEY]
  });

  const state = results[0]?.result || {};

  const isEnabled = state.cm != null || state.rh != null;
  toggle.checked = isEnabled;
  updateLabel(isEnabled);

  if (state.cm) cmUrl.value = state.cm;
  if (state.rh) rhUrl.value = state.rh;
}

function updateLabel(isEnabled) {
  statusLabel.textContent = isEnabled ? 'Local' : 'Off';
  statusLabel.classList.toggle('active', isEnabled);
}

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  const cm = cmUrl.value.trim() || DEFAULT_CM_URL;
  const rh = rhUrl.value.trim() || DEFAULT_RH_URL;

  await chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (cmKey, cmVal, rhKey, rhVal, rhPrefix, shouldEnable) => {
      // Clean up any stale rendering host keys (e.g. ones with real GUIDs)
      const staleKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(rhPrefix) && key !== rhKey) {
          staleKeys.push(key);
        }
      }
      staleKeys.forEach(k => localStorage.removeItem(k));

      if (shouldEnable) {
        localStorage.setItem(cmKey, cmVal);
        localStorage.setItem(rhKey, rhVal);
      } else {
        localStorage.removeItem(cmKey);
        localStorage.removeItem(rhKey);
      }
    },
    args: [CM_STORAGE_KEY, cm, RH_STORAGE_KEY, rh, RH_STORAGE_KEY_PREFIX, enabled]
  });

  updateLabel(enabled);
  updateBadgeAndIcon(enabled);
  chrome.tabs.reload(currentTabId);
  window.close();
});

function updateBadgeAndIcon(isEnabled) {
  chrome.action.setBadgeText({ tabId: currentTabId, text: isEnabled ? 'ON' : '' });
  chrome.action.setBadgeBackgroundColor({ tabId: currentTabId, color: isEnabled ? '#22c55e' : '#6b7280' });

  const iconState = isEnabled ? 'on' : 'off';
  chrome.action.setIcon({
    tabId: currentTabId,
    path: {
      16: `icons/icon-${iconState}-16.png`,
      48: `icons/icon-${iconState}-48.png`,
      128: `icons/icon-${iconState}-128.png`
    }
  });
}

saveBtn.addEventListener('click', async () => {
  const cm = cmUrl.value.trim() || DEFAULT_CM_URL;
  const rh = rhUrl.value.trim() || DEFAULT_RH_URL;
  await chrome.storage.sync.set({ localCmUrl: cm, localRhUrl: rh });

  // If toggle is on, update localStorage too
  if (toggle.checked) {
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: (cmKey, cmVal, rhKey, rhVal) => {
        localStorage.setItem(cmKey, cmVal);
        localStorage.setItem(rhKey, rhVal);
      },
      args: [CM_STORAGE_KEY, cm, RH_STORAGE_KEY, rh]
    });
  }

  saveBtn.textContent = 'Saved!';
  saveBtn.classList.add('saved');
  setTimeout(() => {
    saveBtn.textContent = 'Save URLs';
    saveBtn.classList.remove('saved');
  }, 1500);
});

init();
