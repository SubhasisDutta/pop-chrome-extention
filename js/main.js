/**
 * POP Main Dashboard Script
 * Orchestrates all utilities and handles global functionality
 */

// Global toast function
window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠' : 'ℹ'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

// Utility key mapping
const UTILITY_MAP = {
  cognitiveOffload: { key: 'pop_cognitive_offload', module: CognitiveOffload, name: 'Cognitive Offload' },
  cashFlow: { key: 'pop_cash_flow', module: CashFlow, name: 'Cash Flow' },
  netWorth: { key: 'pop_net_worth', module: NetWorth, name: 'Net Worth' },
  stockWatchlist: { key: 'pop_stock_watchlist', module: StockWatchlist, name: 'Stock Watchlist' },
  purposeGatekeeper: { key: 'pop_purpose_gatekeeper', module: PurposeGatekeeper, name: 'Purpose Gatekeeper' },
  dailyNegotiator: { key: 'pop_daily_negotiator', module: DailyNegotiator, name: 'Daily Negotiator' },
  questionPrimer: { key: 'pop_question_primer', module: QuestionPrimer, name: 'Question Primer' },
  flowThermometer: { key: 'pop_flow_thermometer', module: FlowThermometer, name: 'Flow Thermometer' },
  truthLogger: { key: 'pop_truth_logger', module: TruthLogger, name: 'Truth Logger' },
  tabSnoozer: { key: 'pop_tab_snoozer', module: TabSnoozer, name: 'Tab Snoozer' },
  masteryGraph: { key: 'pop_mastery_graph', module: MasteryGraph, name: 'Mastery Graph' },
  digitalCleaner: { key: 'pop_digital_cleaner', module: DigitalCleaner, name: 'Digital Cleaner' },
  weeklyReview: { key: 'pop_weekly_review', module: WeeklyReview, name: 'Weekly Review' },
  lifeCalculator: { key: 'pop_life_calculator', module: LifeCalculator, name: 'Life Calculator' }
};

// Initialize sample data if first run
async function initializeSampleData() {
  const initialized = await new Promise(resolve => {
    chrome.storage.local.get(['pop_initialized'], result => {
      resolve(result.pop_initialized);
    });
  });

  if (!initialized) {
    await POPSampleData.initializeAll();
  }
}

// Load and apply settings
async function loadSettings() {
  const settings = await POPStorage.getSettings();

  // Apply utility visibility
  Object.entries(settings.utilities).forEach(([key, config]) => {
    const element = document.querySelector(`[data-utility="${key}"]`);
    if (element) {
      if (config.enabled) {
        element.classList.remove('bubble-hidden');
      } else {
        element.classList.add('bubble-hidden');
      }
    }
  });

  return settings;
}

// Render settings page
async function renderSettings() {
  const settings = await POPStorage.getSettings();
  const grid = document.getElementById('settingsGrid');
  if (!grid) return;

  const icons = {
    cognitiveOffload: '💡',
    cashFlow: '💰',
    netWorth: '📈',
    stockWatchlist: '📊',
    purposeGatekeeper: '🎯',
    dailyNegotiator: '☀️',
    questionPrimer: '❓',
    flowThermometer: '🌡️',
    truthLogger: '⏱️',
    tabSnoozer: '😴',
    masteryGraph: '📉',
    digitalCleaner: '🧹',
    weeklyReview: '📋',
    lifeCalculator: '⏳'
  };

  // Define actual shortcuts from manifest.json
  const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
  const shortcuts = {
    cognitiveOffload: isMac ? 'MacCtrl+C' : 'Alt+C',
    dailyNegotiator: isMac ? 'MacCtrl+D' : 'Alt+D',
    truthLogger: isMac ? 'MacCtrl+T' : 'Alt+T'
    // open-dashboard (Alt+P / MacCtrl+P) is not a utility, it's for opening the dashboard
  };

  grid.innerHTML = Object.entries(settings.utilities).map(([key, config]) => {
    const util = UTILITY_MAP[key];
    const shortcut = shortcuts[key];
    return `
      <div class="settings-item">
        <div class="settings-item-info">
          <div class="settings-item-icon" style="background: var(--glass-bg);">
            ${icons[key] || '📦'}
          </div>
          <div class="settings-item-text">
            <h4>${util?.name || key}</h4>
            ${shortcut ? `<p>${shortcut}</p>` : ''}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="display: flex; gap: 8px; font-size: 13px;">
            <a href="#" class="settings-action-link" data-export="${key}" title="Export ${util?.name || key}">📤 Export</a>
            <a href="#" class="settings-action-link" data-import="${key}" title="Import ${util?.name || key}">📥 Import</a>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" data-utility="${key}" ${config.enabled ? 'checked' : ''}>
            <span class="toggle-slider-input"></span>
          </label>
        </div>
      </div>
    `;
  }).join('');

  // Add event listeners
  grid.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const utility = e.target.dataset.utility;
      const enabled = e.target.checked;
      await POPStorage.setUtilityEnabled(utility, enabled);

      // Update visibility
      const element = document.querySelector(`[data-utility="${utility}"]`);
      if (element) {
        if (enabled) {
          element.classList.remove('bubble-hidden');
        } else {
          element.classList.add('bubble-hidden');
        }
      }

      showToast(`${UTILITY_MAP[utility]?.name || utility} ${enabled ? 'enabled' : 'disabled'}`, 'success');
    });
  });

  // Load weekly review settings
  document.getElementById('weeklyReviewDay').value = settings.weeklyReviewTime?.day || 5;
  const hour = String(settings.weeklyReviewTime?.hour || 16).padStart(2, '0');
  const minute = String(settings.weeklyReviewTime?.minute || 0).padStart(2, '0');
  document.getElementById('weeklyReviewTime').value = `${hour}:${minute}`;
  document.getElementById('weeklyReviewDismissible').checked = settings.weeklyReviewDismissible !== false;

  // Load flow check settings
  document.getElementById('flowCheckInterval').value = settings.flowCheckInterval || 30;
  document.getElementById('flowCheckPauseable').checked = settings.flowCheckPauseable !== false;

  // Setup export/import event listeners for settings items
  setupExportImportInSettings();
}

// Save settings
async function saveAllSettings() {
  const day = parseInt(document.getElementById('weeklyReviewDay').value);
  const [hour, minute] = document.getElementById('weeklyReviewTime').value.split(':').map(Number);
  const dismissible = document.getElementById('weeklyReviewDismissible').checked;
  const flowInterval = parseInt(document.getElementById('flowCheckInterval').value);
  const flowPauseable = document.getElementById('flowCheckPauseable').checked;

  await POPStorage.saveSettings({
    weeklyReviewTime: { day, hour, minute },
    weeklyReviewDismissible: dismissible,
    flowCheckInterval: flowInterval,
    flowCheckPauseable: flowPauseable
  });

  showToast('Settings saved!', 'success');
}

// Export/Import handling
let currentImportUtility = null;

function setupExportImportInSettings() {
  // Export links in settings
  document.querySelectorAll('.settings-action-link[data-export]').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const utilityKey = link.dataset.export;
      const util = UTILITY_MAP[utilityKey];
      if (!util || !util.module) return;

      try {
        const csv = await util.module.exportToCSV();
        if (csv) {
          POPStorage.downloadCSV(csv, util.name.toLowerCase().replace(/\s+/g, '-'));
          showToast(`${util.name} exported!`, 'success');
        } else {
          showToast('No data to export', 'warning');
        }
      } catch (e) {
        showToast('Export failed', 'error');
        console.error(e);
      }
    });
  });

  // Import links in settings
  document.querySelectorAll('.settings-action-link[data-import]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const utilityKey = link.dataset.import;
      const util = UTILITY_MAP[utilityKey];
      if (!util) return;

      currentImportUtility = utilityKey;
      document.getElementById('importUtilityName').textContent = util.name;
      document.getElementById('importFileInput').value = '';
      document.getElementById('importMerge').checked = false;
      document.getElementById('importModal').classList.add('active');
    });
  });

  // Import confirm button (shared for all imports)
  // Remove any existing listeners to avoid duplicates
  const importConfirmBtn = document.getElementById('importConfirmBtn');
  if (importConfirmBtn) {
    const newBtn = importConfirmBtn.cloneNode(true);
    importConfirmBtn.parentNode.replaceChild(newBtn, importConfirmBtn);

    newBtn.addEventListener('click', async () => {
      const fileInput = document.getElementById('importFileInput');
      const merge = document.getElementById('importMerge').checked;

      if (!fileInput.files.length) {
        showToast('Please select a file', 'error');
        return;
      }

      const util = UTILITY_MAP[currentImportUtility];
      if (!util || !util.module) return;

      try {
        const content = await POPStorage.readCSVFile(fileInput.files[0]);
        const result = await util.module.importFromCSV(content, merge);

        if (result.success) {
          showToast(`Imported ${result.count} items!`, 'success');
          document.getElementById('importModal').classList.remove('active');
          // Reload the current utility if visible
          if (util.module.init) {
            await util.module.init();
          }
        } else {
          showToast(result.message || 'Import failed', 'error');
        }
      } catch (e) {
        showToast('Import failed: ' + e.message, 'error');
        console.error(e);
      }
    });
  }
}


// Export all data
async function exportAllData() {
  const allData = await POPStorage.getAll();
  const json = JSON.stringify(allData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pop-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('All data exported!', 'success');
}

// Reset all data
async function resetAllData() {
  if (confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
    if (confirm('Really delete everything?')) {
      await POPStorage.clearAll();
      await POPSampleData.initializeAll();
      location.reload();
    }
  }
}

// Modal handling
function setupModals() {
  // Settings modal
  document.getElementById('settingsBtn')?.addEventListener('click', () => {
    renderSettings();
    document.getElementById('settingsModal').classList.add('active');
  });

  document.getElementById('closeSettings')?.addEventListener('click', () => {
    saveAllSettings();
    document.getElementById('settingsModal').classList.remove('active');
  });

  // Import modal
  document.getElementById('closeImport')?.addEventListener('click', () => {
    document.getElementById('importModal').classList.remove('active');
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Export all button
  document.getElementById('exportAllBtn')?.addEventListener('click', exportAllData);

  // Reset data button
  document.getElementById('resetDataBtn')?.addEventListener('click', resetAllData);
}

// Theme toggle
function setupThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => POPTheme.toggle());
}

// Handle URL hash for navigation
function handleHashNavigation() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const element = document.getElementById(`bubble-${hash}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'pulse 0.5s ease';
    }
  }
}

// Setup hotkeys for utilities that have them
function setupUtilityHotkeys() {
  const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);

  // Only these utilities have actual shortcuts in manifest.json
  const shortcuts = {
    'bubble-cognitive-offload': isMac ? 'MacCtrl+C' : 'Alt+C',
    'bubble-daily-negotiator': isMac ? 'MacCtrl+D' : 'Alt+D',
    'bubble-truth-logger': isMac ? 'MacCtrl+T' : 'Alt+T'
  };

  Object.entries(shortcuts).forEach(([bubbleId, shortcut]) => {
    const bubble = document.getElementById(bubbleId);
    if (bubble) {
      const bubbleName = bubble.querySelector('.bubble-name');
      if (bubbleName && bubbleName.parentElement) {
        // Check if hotkey span doesn't already exist
        if (!bubbleName.parentElement.querySelector('.bubble-hotkey')) {
          const hotkeySpan = document.createElement('span');
          hotkeySpan.className = 'bubble-hotkey';
          hotkeySpan.textContent = shortcut;
          bubbleName.parentElement.appendChild(hotkeySpan);
        }
      }
    }
  });
}

// Initialize everything
async function init() {
  console.log('Initializing POP Dashboard...');

  // Initialize sample data
  await initializeSampleData();

  // Load settings and apply
  await loadSettings();

  // Setup modals
  setupModals();

  // Setup theme toggle
  setupThemeToggle();

  // Setup utility hotkeys
  setupUtilityHotkeys();

  // Handle hash navigation
  handleHashNavigation();

  // Listen for hash changes
  window.addEventListener('hashchange', handleHashNavigation);

  console.log('POP Dashboard initialized!');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
