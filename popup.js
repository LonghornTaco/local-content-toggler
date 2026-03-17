const CM_STORAGE_KEY = 'Sitecore.Pages.LocalXmCloudUrl';
const RH_STORAGE_KEY_PREFIX = 'Sitecore.Pages.LocalRenderingHostUrl';
const DEFAULT_CM_URL = 'https://local.cm.mcc.mayo.edu/';
const DEFAULT_RH_URL = 'https://local.mcc.mayo.edu';
const PAGES_ORIGIN = 'https://pages.sitecorecloud.io';

const cmToggle = document.getElementById('cm-toggle');
const cmStatus = document.getElementById('cm-status');
const cmUrl = document.getElementById('cm-url');
const rhToggle = document.getElementById('rh-toggle');
const rhStatus = document.getElementById('rh-status');
const rhUrl = document.getElementById('rh-url');
const saveBtn = document.getElementById('save-btn');
const controls = document.getElementById('controls');
const notPages = document.getElementById('not-pages');

let currentTabId = null;
let detectedRhKey = null; // Full key including |GUID suffix

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url?.startsWith(PAGES_ORIGIN)) {
    controls.hidden = true;
    notPages.hidden = false;
    return;
  }

  currentTabId = tab.id;

  // Load saved URLs from chrome.storage
  const stored = await chrome.storage.sync.get({
    localCmUrl: DEFAULT_CM_URL,
    localRhUrl: DEFAULT_RH_URL,
    rhKeySuffix: ''
  });
  cmUrl.value = stored.localCmUrl;
  rhUrl.value = stored.localRhUrl;

  // Read current localStorage state from the page
  const results = await chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (cmKey, rhPrefix) => {
      const cm = localStorage.getItem(cmKey);

      // Find the rendering host key by prefix (includes |GUID suffix)
      let rhKey = null;
      let rh = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(rhPrefix)) {
          rhKey = key;
          rh = localStorage.getItem(key);
          break;
        }
      }

      return { cm, rh, rhKey };
    },
    args: [CM_STORAGE_KEY, RH_STORAGE_KEY_PREFIX]
  });

  const state = results[0]?.result || {};

  // CM toggle
  const cmEnabled = state.cm != null;
  cmToggle.checked = cmEnabled;
  updateLabel(cmStatus, cmEnabled);
  if (cmEnabled && state.cm) cmUrl.value = state.cm;

  // Rendering host toggle
  detectedRhKey = state.rhKey;
  const rhEnabled = state.rh != null;
  rhToggle.checked = rhEnabled;
  updateLabel(rhStatus, rhEnabled);
  if (rhEnabled && state.rh) rhUrl.value = state.rh;

  // If we detected a key with GUID, save the suffix for future use
  if (detectedRhKey) {
    const suffix = detectedRhKey.substring(RH_STORAGE_KEY_PREFIX.length);
    await chrome.storage.sync.set({ rhKeySuffix: suffix });
  }
}

function updateLabel(el, isEnabled) {
  el.textContent = isEnabled ? 'On' : 'Off';
  el.classList.toggle('active', isEnabled);
}

async function getRhFullKey() {
  // Use detected key if available, otherwise construct from stored suffix
  if (detectedRhKey) return detectedRhKey;
  const { rhKeySuffix } = await chrome.storage.sync.get({ rhKeySuffix: '' });
  if (rhKeySuffix) return RH_STORAGE_KEY_PREFIX + rhKeySuffix;
  return null;
}

cmToggle.addEventListener('change', async () => {
  const enabled = cmToggle.checked;
  const url = cmUrl.value.trim() || DEFAULT_CM_URL;

  await chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (key, value, shouldEnable) => {
      if (shouldEnable) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    },
    args: [CM_STORAGE_KEY, url, enabled]
  });

  updateLabel(cmStatus, enabled);
  updateBadgeAndIcon();
  chrome.tabs.reload(currentTabId);
  window.close();
});

rhToggle.addEventListener('change', async () => {
  const enabled = rhToggle.checked;
  const url = rhUrl.value.trim() || DEFAULT_RH_URL;
  const fullKey = await getRhFullKey();

  if (!fullKey) {
    // No GUID known — need to scan or prompt
    rhToggle.checked = false;
    rhStatus.textContent = 'No key found';
    rhStatus.style.color = '#dc2626';
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (key, value, shouldEnable) => {
      if (shouldEnable) {
        localStorage.setItem(key, value);
      } else {
        localStorage.removeItem(key);
      }
    },
    args: [fullKey, url, enabled]
  });

  updateLabel(rhStatus, enabled);
  updateBadgeAndIcon();
  chrome.tabs.reload(currentTabId);
  window.close();
});

async function updateBadgeAndIcon() {
  const cmOn = cmToggle.checked;
  const rhOn = rhToggle.checked;
  const anyOn = cmOn || rhOn;

  let badgeText = '';
  if (cmOn && rhOn) badgeText = 'ALL';
  else if (cmOn) badgeText = 'CM';
  else if (rhOn) badgeText = 'RH';

  chrome.action.setBadgeText({ tabId: currentTabId, text: badgeText });
  chrome.action.setBadgeBackgroundColor({ tabId: currentTabId, color: anyOn ? '#22c55e' : '#6b7280' });

  const iconState = anyOn ? 'on' : 'off';
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

  // If toggles are on, update localStorage too
  if (cmToggle.checked) {
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: (key, value) => localStorage.setItem(key, value),
      args: [CM_STORAGE_KEY, cm]
    });
  }

  const fullKey = await getRhFullKey();
  if (rhToggle.checked && fullKey) {
    await chrome.scripting.executeScript({
      target: { tabId: currentTabId },
      func: (key, value) => localStorage.setItem(key, value),
      args: [fullKey, rh]
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
