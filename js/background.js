/**
 * POP Background Service Worker
 * Handles hotkeys, alarms, and extension lifecycle
 */

// Import sample data initializer
importScripts('sampleData.js');

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('POP Extension installed!');
    // Initialize sample data
    await POPSampleData.initializeAll();

    // Set up alarms for recurring features
    setupAlarms();

    // Open the main dashboard
    chrome.tabs.create({
      url: chrome.runtime.getURL('html/main.html')
    });
  }
});

// Setup recurring alarms
function setupAlarms() {
  // Flow thermometer check (every 30 minutes)
  chrome.alarms.create('flowCheck', { periodInMinutes: 30 });

  // Tab snoozer check (every 5 minutes)
  chrome.alarms.create('tabSnoozeCheck', { periodInMinutes: 5 });

  // Weekly review check (every hour)
  chrome.alarms.create('weeklyReviewCheck', { periodInMinutes: 60 });
}

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
  switch (alarm.name) {
    case 'flowCheck':
      await handleFlowCheck();
      break;
    case 'tabSnoozeCheck':
      await handleTabSnoozeCheck();
      break;
    case 'weeklyReviewCheck':
      await handleWeeklyReviewCheck();
      break;
  }
});

// Flow check handler
async function handleFlowCheck() {
  const data = await getStorageData('pop_flow_thermometer');
  if (!data || data.paused) return;

  if (data.pausedUntil && new Date(data.pausedUntil) > new Date()) return;

  const settings = await getStorageData('pop_settings');
  if (!settings?.utilities?.flowThermometer?.enabled) return;

  // Send notification
  chrome.notifications.create('flowCheck', {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title: 'Flow Check 🌡️',
    message: 'How is your current task going? Rate your flow state.',
    buttons: [{ title: 'Check In' }, { title: 'Pause 30min' }],
    priority: 1
  });
}

// Tab snooze check handler
async function handleTabSnoozeCheck() {
  const data = await getStorageData('pop_tab_snoozer');
  if (!data) return;

  const settings = await getStorageData('pop_settings');
  if (!settings?.utilities?.tabSnoozer?.enabled) return;

  const now = new Date();
  const awakeTabs = data.snoozedTabs.filter(t => new Date(t.wakeAt) <= now);

  if (awakeTabs.length > 0) {
    for (const tab of awakeTabs) {
      chrome.tabs.create({ url: tab.url });
    }

    // Update storage
    data.snoozedTabs = data.snoozedTabs.filter(t => new Date(t.wakeAt) > now);
    await setStorageData('pop_tab_snoozer', data);

    // Notify user
    chrome.notifications.create('tabAwake', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Tabs Awakened 😴→👀',
      message: `${awakeTabs.length} snoozed tab(s) have been opened.`,
      priority: 1
    });
  }
}

// Weekly review check handler
async function handleWeeklyReviewCheck() {
  const data = await getStorageData('pop_weekly_review');
  if (!data) return;

  const settings = await getStorageData('pop_settings');
  if (!settings?.utilities?.weeklyReview?.enabled) return;

  const now = new Date();
  const schedule = data.schedule || { day: 5, hour: 16, minute: 0 };

  // Check if it's review time
  if (now.getDay() === schedule.day &&
      now.getHours() === schedule.hour &&
      now.getMinutes() >= schedule.minute &&
      now.getMinutes() < schedule.minute + 60) {

    // Check if already prompted today
    const todayKey = now.toISOString().split('T')[0];
    if (data.lastPromptDate === todayKey) return;

    // Update last prompt date
    data.lastPromptDate = todayKey;
    await setStorageData('pop_weekly_review', data);

    // Open review dashboard
    chrome.tabs.create({
      url: chrome.runtime.getURL('html/main.html#weekly-review')
    });

    chrome.notifications.create('weeklyReview', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Weekly Review Time 📋',
      message: 'Time for your weekly reflection. Take 15 minutes to review your week.',
      priority: 2
    });
  }
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId === 'flowCheck') {
    if (buttonIndex === 0) {
      // Check In - open dashboard
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html#flow-thermometer')
      });
    } else {
      // Pause 30min
      const data = await getStorageData('pop_flow_thermometer') || {};
      const pausedUntil = new Date();
      pausedUntil.setMinutes(pausedUntil.getMinutes() + 30);
      data.paused = true;
      data.pausedUntil = pausedUntil.toISOString();
      await setStorageData('pop_flow_thermometer', data);
    }
  }
  chrome.notifications.clear(notificationId);
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);

  switch (command) {
    case 'cognitive-offload':
      await showQuickCapture();
      break;
    case 'open-dashboard':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html')
      });
      break;
    case 'question-primer':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html#question-primer')
      });
      break;
    case 'flow-check':
      await triggerFlowCheck();
      break;
    case 'time-log':
      await triggerTimeLog();
      break;
    case 'daily-plan':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html#daily-negotiator')
      });
      break;
    case 'net-worth':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html#net-worth')
      });
      break;
    case 'cash-flow':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html#cash-flow')
      });
      break;
    case 'stock-check':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html#stock-watchlist')
      });
      break;
    case 'weekly-review':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html#weekly-review')
      });
      break;
  }
});

// Show quick capture overlay on current tab
async function showQuickCapture() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'showQuickCapture' });
  }
}

// Trigger flow check on current tab
async function triggerFlowCheck() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    chrome.tabs.sendMessage(tab.id, { action: 'showFlowCheck' });
  }
}

// Trigger time log for current site
async function triggerTimeLog() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;

      // Get truth logger data
      const data = await getStorageData('pop_truth_logger') || { siteCategories: {}, timeLog: [] };
      const category = data.siteCategories[domain];

      if (category) {
        // Site already categorized - just show badge
        chrome.tabs.sendMessage(tab.id, {
          action: 'showTruthBadge',
          category,
          domain
        });
      } else {
        // Ask to categorize
        chrome.tabs.sendMessage(tab.id, {
          action: 'categorizesite',
          domain
        });
      }
    } catch (e) {
      console.error('Error triggering time log:', e);
    }
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('html/main.html')
  });
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'saveThought':
      saveThought(request.text, request.type).then(sendResponse);
      return true;

    case 'getSettings':
      getStorageData('pop_settings').then(sendResponse);
      return true;

    case 'categorizeSite':
      categorizeSite(request.domain, request.category).then(sendResponse);
      return true;

    case 'logTime':
      logTimeForCategory(request.category, request.minutes).then(sendResponse);
      return true;

    case 'openDashboard':
      chrome.tabs.create({
        url: chrome.runtime.getURL('html/main.html' + (request.hash ? `#${request.hash}` : ''))
      });
      sendResponse({ success: true });
      return false;
  }
});

// Save a thought from quick capture
async function saveThought(text, type) {
  const data = await getStorageData('pop_cognitive_offload') || { thoughts: [] };
  const thought = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    text,
    type,
    createdAt: new Date().toISOString(),
    completed: false
  };
  data.thoughts.unshift(thought);
  await setStorageData('pop_cognitive_offload', data);
  return { success: true, thought };
}

// Categorize a site for truth logger
async function categorizeSite(domain, category) {
  const data = await getStorageData('pop_truth_logger') || { siteCategories: {}, timeLog: [] };
  data.siteCategories[domain] = category;
  await setStorageData('pop_truth_logger', data);
  return { success: true };
}

// Log time for truth logger
async function logTimeForCategory(category, minutes) {
  const data = await getStorageData('pop_truth_logger') || { siteCategories: {}, timeLog: [] };
  const todayKey = new Date().toISOString().split('T')[0];
  let todayLog = data.timeLog.find(l => l.date.startsWith(todayKey));

  if (!todayLog) {
    todayLog = { date: new Date().toISOString(), deep: 0, shallow: 0 };
    data.timeLog.unshift(todayLog);
  }

  todayLog[category] += minutes;
  await setStorageData('pop_truth_logger', data);
  return { success: true };
}

// Storage helpers
async function getStorageData(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve(result[key] || null);
    });
  });
}

async function setStorageData(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'pop-capture-text',
    title: 'Capture to POP',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'pop-save-link',
    title: 'Save link to POP',
    contexts: ['link']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'pop-capture-text') {
    const text = info.selectionText;
    if (text) {
      // Show a simple prompt in the content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'captureSelection',
        text
      });
    }
  }

  if (info.menuItemId === 'pop-save-link') {
    const url = info.linkUrl;
    const title = info.linkUrl;
    // Save to tab snoozer with immediate wake
    const data = await getStorageData('pop_tab_snoozer') || { snoozedTabs: [] };
    data.snoozedTabs.push({
      id: Date.now().toString(36),
      url,
      title: title || url,
      snoozedAt: new Date().toISOString(),
      wakeAt: new Date().toISOString() // Wake immediately (it's a save, not a snooze)
    });
    await setStorageData('pop_tab_snoozer', data);

    // Notify
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: 'Link Saved',
      message: 'Link saved to POP Tab Snoozer.',
      priority: 1
    });
  }
});

console.log('POP Background Service Worker loaded');
