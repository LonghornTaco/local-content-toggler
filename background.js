const CM_STORAGE_KEY = 'Sitecore.Pages.LocalXmCloudUrl';
const RH_STORAGE_KEY = 'Sitecore.Pages.LocalRenderingHostUrl|test-tenant-id';
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
      func: (cmKey, rhKey) => {
        const cmOn = localStorage.getItem(cmKey) != null;
        const rhOn = localStorage.getItem(rhKey) != null;
        return { cmOn, rhOn };
      },
      args: [CM_STORAGE_KEY, RH_STORAGE_KEY]
    });

    const { cmOn, rhOn } = results[0]?.result || {};
    const anyOn = cmOn || rhOn;

    let badgeText = '';
    if (cmOn && rhOn) badgeText = 'ALL';
    else if (cmOn) badgeText = 'CM';
    else if (rhOn) badgeText = 'RH';

    chrome.action.setBadgeText({ tabId, text: badgeText });
    chrome.action.setBadgeBackgroundColor({ tabId, color: anyOn ? '#22c55e' : '#6b7280' });

    const iconState = anyOn ? 'on' : 'off';
    chrome.action.setIcon({
      tabId,
      path: {
        16: `icons/icon-${iconState}-16.png`,
        48: `icons/icon-${iconState}-48.png`,
        128: `icons/icon-${iconState}-128.png`
      }
    });
  } catch {
    // Tab may not be accessible — ignore
  }
}
