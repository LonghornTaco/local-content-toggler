const STORAGE_KEY = 'Sitecore.Pages.LocalXmCloudUrl';
const PAGES_ORIGIN = 'https://pages.sitecorecloud.io';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith(PAGES_ORIGIN)) {
    updateBadge(tabId);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url?.startsWith(PAGES_ORIGIN)) {
    updateBadge(tab.id);
  }
});

async function updateBadge(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: (key) => localStorage.getItem(key),
      args: [STORAGE_KEY]
    });

    const isEnabled = results[0]?.result != null;
    setBadge(tabId, isEnabled);
  } catch {
    // Tab may not be accessible — ignore
  }
}

function setBadge(tabId, isEnabled) {
  chrome.action.setBadgeText({
    tabId,
    text: isEnabled ? 'ON' : ''
  });
  chrome.action.setBadgeBackgroundColor({
    tabId,
    color: isEnabled ? '#22c55e' : '#6b7280'
  });

  const size = isEnabled ? 'on' : 'off';
  chrome.action.setIcon({
    tabId,
    path: {
      16: `icons/icon-${size}-16.png`,
      48: `icons/icon-${size}-48.png`,
      128: `icons/icon-${size}-128.png`
    }
  });
}
