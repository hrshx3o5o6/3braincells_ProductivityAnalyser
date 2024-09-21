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
        if (tab.url) { // Check if tab.url is defined
          try {
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
          } catch (error) {
            console.error('Invalid URL:', tab.url); // Log invalid URLs for debugging
          }
        } else {
          console.warn('Tab URL is undefined:', tab); // Log if tab.url is undefined
        }
      }
    });
  }

  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get(['siteTimers', 'isEnabled'], (result) => {
      if (result.isEnabled) {
        siteTimers = result.siteTimers || {}; // Restore from storage
        chrome.tabs.get(activeInfo.tabId, (tab) => {
          const url = new URL(tab.url);
          const domain = url.hostname;
          const now = Date.now();
          siteTimers[domain] = { 
            startTime: now, 
            totalTime: siteTimers[domain]?.totalTime || 0 
          };
        });
      }
    });
  });
  
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      chrome.storage.local.get(['siteTimers', 'isEnabled'], (result) => {
        if (result.isEnabled) {
          siteTimers = result.siteTimers || {}; // Restore from storage
          checkForWastingSite(tab);
        }
      });
    }
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
  
    // Save the updated siteTimers to chrome storage
    chrome.storage.local.set({ siteTimers: siteTimers }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error saving siteTimers:', chrome.runtime.lastError);
      } else {
        console.log('siteTimers saved successfully');
      }
    });
  }

  chrome.alarms.create('updateSiteTime', { periodInMinutes: 1 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'updateSiteTime') {
      chrome.storage.local.get(['isEnabled'], (result) => {
        if (result.isEnabled) {
          console.log('Updating site time...');
          updateSiteTime();
        }
      });
    }
  });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setTask') {
    currentTask = request.task;
    chrome.storage.local.set({ currentTask: currentTask });
  }
});

