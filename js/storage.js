/**
 * POP Storage Utility
 * Handles all data persistence with Chrome's storage API
 * Includes export/import functionality for each utility
 */

const POPStorage = {
  // Storage keys for each utility
  KEYS: {
    SETTINGS: 'pop_settings',
    THEME: 'pop_theme',
    COGNITIVE_OFFLOAD: 'pop_cognitive_offload',
    CASH_FLOW: 'pop_cash_flow',
    NET_WORTH: 'pop_net_worth',
    STOCK_WATCHLIST: 'pop_stock_watchlist',
    PURPOSE_GATEKEEPER: 'pop_purpose_gatekeeper',
    DAILY_NEGOTIATOR: 'pop_daily_negotiator',
    QUESTION_PRIMER: 'pop_question_primer',
    FLOW_THERMOMETER: 'pop_flow_thermometer',
    TRUTH_LOGGER: 'pop_truth_logger',
    TAB_SNOOZER: 'pop_tab_snoozer',
    MASTERY_GRAPH: 'pop_mastery_graph',
    DIGITAL_CLEANER: 'pop_digital_cleaner',
    WEEKLY_REVIEW: 'pop_weekly_review',
    LIFE_CALCULATOR: 'pop_life_calculator'
  },

  // Default settings for all utilities
  DEFAULT_SETTINGS: {
    utilities: {
      cognitiveOffload: { enabled: true, hotkey: 'Alt+C' },
      cashFlow: { enabled: true, hotkey: 'Alt+M' },
      netWorth: { enabled: true, hotkey: 'Alt+N' },
      stockWatchlist: { enabled: true, hotkey: 'Alt+S' },
      purposeGatekeeper: { enabled: true, hotkey: 'Alt+G' },
      dailyNegotiator: { enabled: true, hotkey: 'Alt+D' },
      questionPrimer: { enabled: true, hotkey: 'Alt+Q' },
      flowThermometer: { enabled: true, hotkey: 'Alt+F' },
      truthLogger: { enabled: true, hotkey: 'Alt+T' },
      tabSnoozer: { enabled: true, hotkey: 'Alt+B' },
      masteryGraph: { enabled: true, hotkey: 'Alt+Y' },
      digitalCleaner: { enabled: true, hotkey: 'Alt+K' },
      weeklyReview: { enabled: true, hotkey: 'Alt+W' },
      lifeCalculator: { enabled: true, hotkey: 'Alt+L' }
    },
    weeklyReviewTime: { day: 5, hour: 16, minute: 0 }, // Friday 4 PM
    weeklyReviewDismissible: true,
    flowCheckInterval: 30, // minutes
    flowCheckPauseable: true
  },

  /**
   * Get data from storage
   * @param {string} key - Storage key
   * @returns {Promise<any>} - Stored data or null
   */
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  },

  /**
   * Set data in storage
   * @param {string} key - Storage key
   * @param {any} value - Data to store
   * @returns {Promise<void>}
   */
  async set(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  },

  /**
   * Remove data from storage
   * @param {string} key - Storage key
   * @returns {Promise<void>}
   */
  async remove(key) {
    return new Promise((resolve) => {
      chrome.storage.local.remove([key], resolve);
    });
  },

  /**
   * Get all data from storage
   * @returns {Promise<object>}
   */
  async getAll() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
  },

  /**
   * Clear all POP data from storage
   * @returns {Promise<void>}
   */
  async clearAll() {
    const keys = Object.values(this.KEYS);
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  },

  /**
   * Get settings with defaults
   * @returns {Promise<object>}
   */
  async getSettings() {
    const settings = await this.get(this.KEYS.SETTINGS);
    if (!settings) return { ...this.DEFAULT_SETTINGS };

    // Deep merge utilities to ensure all defaults are present
    const mergedUtilities = { ...this.DEFAULT_SETTINGS.utilities };
    if (settings.utilities) {
      Object.keys(this.DEFAULT_SETTINGS.utilities).forEach(key => {
        mergedUtilities[key] = {
          ...this.DEFAULT_SETTINGS.utilities[key],
          ...(settings.utilities[key] || {})
        };
      });
    }

    return {
      ...this.DEFAULT_SETTINGS,
      ...settings,
      utilities: mergedUtilities
    };
  },

  /**
   * Save settings
   * @param {object} settings - Settings to save
   * @returns {Promise<void>}
   */
  async saveSettings(settings) {
    const current = await this.getSettings();
    return this.set(this.KEYS.SETTINGS, { ...current, ...settings });
  },

  /**
   * Check if a utility is enabled
   * @param {string} utilityName - Name of the utility
   * @returns {Promise<boolean>}
   */
  async isUtilityEnabled(utilityName) {
    const settings = await this.getSettings();
    return settings.utilities[utilityName]?.enabled ?? true;
  },

  /**
   * Toggle utility enabled state
   * @param {string} utilityName - Name of the utility
   * @param {boolean} enabled - Enabled state
   * @returns {Promise<void>}
   */
  async setUtilityEnabled(utilityName, enabled) {
    const settings = await this.getSettings();
    if (!settings.utilities[utilityName]) {
      settings.utilities[utilityName] = { enabled: enabled };
    } else {
      settings.utilities[utilityName].enabled = enabled;
    }
    await this.set(this.KEYS.SETTINGS, settings);
  },

  /**
   * Export utility data to CSV
   * @param {string} utilityKey - Storage key for the utility
   * @param {string} utilityName - Human-readable name
   * @returns {Promise<string>} - CSV string
   */
  async exportToCSV(utilityKey, utilityName) {
    const data = await this.get(utilityKey);
    if (!data) return '';

    // Handle different data structures
    let csvContent = '';
    const timestamp = new Date().toISOString().split('T')[0];

    if (Array.isArray(data)) {
      // Array of objects
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      csvContent = headers.join(',') + '\n';
      data.forEach(item => {
        const row = headers.map(h => {
          const val = item[h];
          if (typeof val === 'object') return JSON.stringify(val).replace(/"/g, '""');
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return val;
        });
        csvContent += row.join(',') + '\n';
      });
    } else if (typeof data === 'object') {
      // Single object - convert to key-value pairs
      csvContent = 'key,value\n';
      Object.entries(data).forEach(([key, value]) => {
        const val = typeof value === 'object' ? JSON.stringify(value) : value;
        csvContent += `"${key}","${String(val).replace(/"/g, '""')}"\n`;
      });
    }

    return csvContent;
  },

  /**
   * Import data from CSV
   * @param {string} utilityKey - Storage key for the utility
   * @param {string} csvContent - CSV content to import
   * @param {boolean} merge - Whether to merge with existing data
   * @returns {Promise<{success: boolean, message: string, count: number}>}
   */
  async importFromCSV(utilityKey, csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        return { success: false, message: 'CSV file is empty or invalid', count: 0 };
      }

      const headers = this.parseCSVLine(lines[0]);
      const data = [];

      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length === headers.length) {
          const obj = {};
          headers.forEach((header, index) => {
            let value = values[index];
            // Try to parse JSON values
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Keep as string
            }
            obj[header] = value;
          });
          data.push(obj);
        }
      }

      // Check if it's key-value format
      if (headers.length === 2 && headers[0] === 'key' && headers[1] === 'value') {
        const obj = {};
        data.forEach(item => {
          obj[item.key] = item.value;
        });
        if (merge) {
          const existing = await this.get(utilityKey) || {};
          await this.set(utilityKey, { ...existing, ...obj });
        } else {
          await this.set(utilityKey, obj);
        }
        return { success: true, message: 'Data imported successfully', count: Object.keys(obj).length };
      }

      // Array format
      if (merge) {
        const existing = await this.get(utilityKey) || [];
        await this.set(utilityKey, [...existing, ...data]);
      } else {
        await this.set(utilityKey, data);
      }

      return { success: true, message: 'Data imported successfully', count: data.length };
    } catch (error) {
      return { success: false, message: `Import failed: ${error.message}`, count: 0 };
    }
  },

  /**
   * Parse a CSV line handling quoted values
   * @param {string} line - CSV line
   * @returns {string[]} - Array of values
   */
  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          current += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          values.push(current);
          current = '';
        } else {
          current += char;
        }
      }
    }
    values.push(current);

    return values;
  },

  /**
   * Download data as CSV file
   * @param {string} csvContent - CSV content
   * @param {string} filename - Filename without extension
   */
  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Read CSV file from file input
   * @param {File} file - File object
   * @returns {Promise<string>} - CSV content
   */
  readCSVFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  /**
   * Generate unique ID
   * @returns {string}
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = POPStorage;
}
