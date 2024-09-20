let currentTask = '';
let productiveSites = ['github.com', 'stackoverflow.com', 'docs.google.com'];
let wastingSites = ['facebook.com', 'twitter.com', 'instagram.com'];
let siteTimers = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ isEnabled: true });
});

function checkForWastingSite(tab) {
  chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled) {
      const url = new URL(tab.url);
      const domain = url.hostname;

      if (wastingSites.some(site => domain.includes(site))) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: 'Productivity Alert',
          message: "You're getting distracted!"
        });
      }
    }
  });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled) {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        checkForWastingSite(tab);
        
        const url = new URL(tab.url);
        const domain = url.hostname;
        
        const now = Date.now();
        siteTimers[domain] = { startTime: now, totalTime: siteTimers[domain]?.totalTime || 0 };
      });
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled && changeInfo.status === 'complete') {
      checkForWastingSite(tab);
    }
  });
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  updateSiteTime();
});

function updateSiteTime() {
  const now = Date.now();
  Object.keys(siteTimers).forEach(domain => {
    if (siteTimers[domain].startTime) {
      siteTimers[domain].totalTime += now - siteTimers[domain].startTime;
      siteTimers[domain].startTime = now;
    }
  });
  chrome.storage.local.set({ siteTimers: siteTimers });
}

chrome.alarms.create('updateSiteTime', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  chrome.storage.local.get(['isEnabled'], (result) => {
    if (result.isEnabled && alarm.name === 'updateSiteTime') {
      updateSiteTime();
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setTask') {
    currentTask = request.task;
    chrome.storage.local.set({ currentTask: currentTask });
  }
});