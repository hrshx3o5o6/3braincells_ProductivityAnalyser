let currentTask = '';
let productiveSites = ['github.com', 'stackoverflow.com', 'docs.google.com'];
let wastingSites = ['facebook.com', 'twitter.com', 'instagram.com'];
let siteTimers = {};

// Function to get data from chrome.storage using Promises
function storageGet(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], (result) => {
      if (chrome.runtime.lastError) {
        console.error(`Error retrieving ${key}:`, chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log(`Successfully retrieved ${key}:`, result[key]);
        resolve(result[key]);
      }
    });
  });
}

// Function to set data in chrome.storage using Promises
function storageSet(key, value) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error saving ${key}:`, chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
      } else {
        console.log(`Successfully saved ${key}:`, value);
        resolve();
      }
    });
  });
}

// Function to check for wasting site
function checkForWastingSite(tab) {
  storageGet('isEnabled').then((isEnabled) => {
    if (isEnabled && tab.url) {
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
        console.error('Invalid URL:', tab.url);
      }
    }
  }).catch(error => {
    console.error('Error in checking for wasting site:', error);
  });
}

// Event listener for when a new tab is created
chrome.tabs.onCreated.addListener((tab) => {
  console.log('A new tab has been opened:', tab);

  // Enable the extension functionality when a new tab is created
  storageSet('isEnabled', true).catch(error => {
    console.error('Error enabling extension on tab creation:', error);
  });
});

// Event listener for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  storageGet('isEnabled').then((isEnabled) => {
    if (isEnabled) {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
          checkForWastingSite(tab);

          try {
            const url = new URL(tab.url);
            const domain = url.hostname;
            const now = Date.now();
            siteTimers[domain] = { startTime: now, totalTime: siteTimers[domain]?.totalTime || 0 };
          } catch (error) {
            console.error('Invalid URL on activation:', tab.url);
          }
        } else {
          console.warn('Activated tab has no URL:', tab);
        }
      });
    }
  }).catch(error => {
    console.error('Error in tab activation listener:', error);
  });
});

// Event listener for tab update (when a tab is completely loaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    storageGet('isEnabled').then((isEnabled) => {
      if (isEnabled) {
        checkForWastingSite(tab);
      }
    }).catch(error => {
      console.error('Error in tab update listener:', error);
    });
  }
});

// Event listener for when a tab is removed
chrome.tabs.onUpdated.addListener((tabId, removeInfo) => {
  updateSiteTime().catch(error => {
    console.error('Error updating site time on tab removal:', error);
  });
});

// Function to update site timers and save to storage
async function updateSiteTime() {
  const now = Date.now();
  for (const domain in siteTimers) {
    if (siteTimers[domain].startTime) {
      siteTimers[domain].totalTime += now - siteTimers[domain].startTime;
      siteTimers[domain].startTime = now;
    }
  }

  try {
    await storageSet('siteTimers', siteTimers);
  } catch (error) {
    console.error('Error saving updated site timers:', error);
  }
}

// Set an alarm to update site time periodically
chrome.alarms.create('updateSiteTime', { periodInMinutes: 1/40 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateSiteTime') {
    storageGet('isEnabled').then((isEnabled) => {
      if (isEnabled) {
        console.log('Updating site time...');
        updateSiteTime().catch(error => {
          console.error('Error updating site time on alarm:', error);
        });
      }
    }).catch(error => {
      console.error('Error in alarm listener:', error);
    });
  }
});

// // Handle messages for setting the current task
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'setTask') {
//     currentTask = request.task;
//     storageSet('currentTask', currentTask).catch(error => {
//       console.error('Error setting current task:', error);
//     });
//   }
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (message.action === 'setTask'){
    console.log("recieved task input", message.task);

    processScrapedContent(message.task)
  }
})


// Function to get current tab ID and scrape content
async function getCurrentTabContent() {
  return new Promise((resolve, reject) => {
    // Query the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTabId = tabs[0].id;
      console.log("Current Tab ID:", currentTabId);

      // Inject the script to scrape page content
      chrome.scripting.executeScript(
        {
          target: { tabId: currentTabId },
          func: scrapePageContent, // The function to inject
        },
        (injectionResults) => {
          if (chrome.runtime.lastError) {
            reject("Script injection failed: " + chrome.runtime.lastError.message);
            return;
          }

          // Resolve with the scraped content
          resolve(injectionResults[0].result);
        }
      );
    });
  });
}


// Function to process and compare scraped content
async function processScrapedContent(taskInput) {
  try {
    // Step 1: Scrape content from the current tab
    const scrapedContent = await getCurrentTabContent();
    console.log("Scraped Content:", scrapedContent);

    // Step 2: Process scraped content into an array of words
    const wordsArray = scrapedContent
      .replace(/[^\w\s]/gi, "") // Remove punctuation
      .split(/\s+/) // Split by spaces
      .filter((word) => word.length > 0); // Remove empty strings

    console.log("Processed Words Array:", wordsArray);

    // Step 3: Call Gemini API to generate another array of words
    const geminiWordsArray = await fetchGeminiResponse(taskInput);

    // Step 4: Compare the two arrays
    compareWordArrays(wordsArray, geminiWordsArray);
  } catch (error) {
    console.error("Error processing content:", error);
  }
}


//need to code the logic for Gemini API call
async function fetchGeminiResponse(enter){
  // chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  //   if (message.action === 'setTask'){
  //     t = message.task
  //   }
  // })
  const scrapedContent = await getCurrentTabContent();
  const wordsArray = scrapedContent
      .replace(/[^\w\s]/gi, "") // Remove punctuation
      .split(/\s+/) // Split by spaces
      .filter((word) => word.length > 0); // Remove empty strings
  const l = wordsArray.length

  const { GoogleGenerativeAI } = require("@google/generative-ai");

  const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = "generate a list ${l} of words seperated by a space on the topic relevant to ${enter}";

  const result = await model.generateContent(prompt);
  console.log(result.response.text());
  return result
}


//comparing the arrays, 1. that has been retrieved from the webpage after webscraping
//2. that has been retrieved from the Gemini API
async function compareWordArrays(){

}