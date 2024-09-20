/******/ (() => { // webpackBootstrap
/*!******************************!*\
  !*** ./public/background.js ***!
  \******************************/
let currentTask = '';
let productiveSites = ['github.com', 'stackoverflow.com', 'docs.google.com'];
let wastingSites = ['facebook.com', 'twitter.com', 'instagram.com'];
let siteTimers = {};

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    analyzeTab(tab);
  }
});

function analyzeTab(tab) {
  const url = new URL(tab.url);
  const domain = url.hostname;

  if (productiveSites.some(site => domain.includes(site))) {
    console.log("Productive tab opened");
  } else if (wastingSites.some(site => domain.includes(site))) {
    notifyUser("You might be getting distracted!");
  }
}

function notifyUser(message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon128.png',
    title: 'Productivity Alert',
    message: message
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setTask') {
    currentTask = request.task;
    chrome.storage.local.set({ currentTask: currentTask });
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    const url = new URL(tab.url);
    const domain = url.hostname;
    
    const now = Date.now();
    siteTimers[domain] = { startTime: now, totalTime: siteTimers[domain]?.totalTime || 0 };
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
  if (alarm.name === 'updateSiteTime') {
    updateSiteTime();
  }
});
/******/ })()
;
//# sourceMappingURL=background.js.map