/**
 * POP Theme Manager
 * Handles dark/light mode toggle with persistence
 */

const POPTheme = {
  STORAGE_KEY: 'pop_theme',

  /**
   * Initialize theme based on stored preference or system preference
   */
  async init() {
    const storedTheme = await this.getStoredTheme();

    if (storedTheme) {
      this.applyTheme(storedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  },

  /**
   * Get stored theme preference
   * @returns {Promise<string|null>}
   */
  async getStoredTheme() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([this.STORAGE_KEY], (result) => {
          resolve(result[this.STORAGE_KEY] || null);
        });
      } else {
        resolve(localStorage.getItem(this.STORAGE_KEY));
      }
    });
  },

  /**
   * Store theme preference
   * @param {string} theme - 'dark' or 'light'
   */
  async storeTheme(theme) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [this.STORAGE_KEY]: theme });
    }
    localStorage.setItem(this.STORAGE_KEY, theme);
  },

  /**
   * Apply theme to document
   * @param {string} theme - 'dark' or 'light'
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.updateToggleButton(theme);
  },

  /**
   * Update toggle button state
   * @param {string} theme - Current theme
   */
  updateToggleButton(theme) {
    const toggles = document.querySelectorAll('.theme-toggle');
    toggles.forEach(toggle => {
      toggle.setAttribute('data-theme', theme);
    });
  },

  /**
   * Toggle between dark and light mode
   */
  async toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    this.applyTheme(newTheme);
    await this.storeTheme(newTheme);

    return newTheme;
  },

  /**
   * Get current theme
   * @returns {string}
   */
  getCurrentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  /**
   * Create theme toggle element
   * @returns {HTMLElement}
   */
  createToggleElement() {
    const toggle = document.createElement('div');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('role', 'button');
    toggle.setAttribute('aria-label', 'Toggle dark mode');
    toggle.setAttribute('tabindex', '0');

    const slider = document.createElement('div');
    slider.className = 'toggle-slider';
    toggle.appendChild(slider);

    toggle.addEventListener('click', () => this.toggle());
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      }
    });

    return toggle;
  }
};

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => POPTheme.init());
  } else {
    POPTheme.init();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = POPTheme;
}
