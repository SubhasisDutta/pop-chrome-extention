/**
 * Tab Snoozer Utility (2-Minute Rule)
 * Manage tab clutter with Do/Snooze/Trash options
 * Hotkey: Alt+B
 */

const TabSnoozer = {
  STORAGE_KEY: 'pop_tab_snoozer',

  async init() {
    await this.render();
    this.bindEvents();
    await this.checkSnoozedTabs();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          snoozedTabs: [],
          idleThresholdMinutes: 5,
          defaultSnoozeHours: 24
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async snoozeTab(url, title, hours = 24) {
    const data = await this.getData();
    const wakeAt = new Date();
    wakeAt.setHours(wakeAt.getHours() + hours);

    const tab = {
      id: Date.now().toString(36),
      url,
      title,
      snoozedAt: new Date().toISOString(),
      wakeAt: wakeAt.toISOString()
    };

    data.snoozedTabs.push(tab);
    await this.saveData(data);
    await this.render();
    return tab;
  },

  async wakeTab(id) {
    const data = await this.getData();
    const tab = data.snoozedTabs.find(t => t.id === id);
    if (tab) {
      chrome.tabs.create({ url: tab.url });
      data.snoozedTabs = data.snoozedTabs.filter(t => t.id !== id);
      await this.saveData(data);
      await this.render();
    }
  },

  async deleteSnooze(id) {
    const data = await this.getData();
    data.snoozedTabs = data.snoozedTabs.filter(t => t.id !== id);
    await this.saveData(data);
    await this.render();
  },

  async checkSnoozedTabs() {
    const data = await this.getData();
    const now = new Date();
    const awakeTabs = data.snoozedTabs.filter(t => new Date(t.wakeAt) <= now);

    if (awakeTabs.length > 0) {
      // Open awakened tabs
      for (const tab of awakeTabs) {
        chrome.tabs.create({ url: tab.url });
      }
      // Remove from snoozed
      data.snoozedTabs = data.snoozedTabs.filter(t => new Date(t.wakeAt) > now);
      await this.saveData(data);
      await this.render();
    }
  },

  formatTimeUntil(dateStr) {
    const now = new Date();
    const wake = new Date(dateStr);
    const diffMs = wake - now;

    if (diffMs <= 0) return 'Now';

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },

  async render() {
    const container = document.getElementById('tab-snoozer-content');
    if (!container) return;

    const data = await this.getData();
    const sortedTabs = [...data.snoozedTabs].sort((a, b) => new Date(a.wakeAt) - new Date(b.wakeAt));

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 40px; margin-bottom: 8px;">😴</div>
        <div style="font-size: 24px; font-weight: 700;">${data.snoozedTabs.length}</div>
        <div style="font-size: 12px; color: var(--text-muted);">Tabs Snoozed</div>
      </div>
      <button class="btn btn-primary btn-sm" id="ts-snooze-current" style="width: 100%; margin-bottom: 12px;">
        😴 Snooze Current Tab
      </button>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Upcoming Wake-ups</div>
      <ul class="item-list" style="max-height: 150px;">
        ${sortedTabs.length === 0 ? `
          <li style="justify-content: center; color: var(--text-muted); font-size: 12px;">No snoozed tabs</li>
        ` : sortedTabs.slice(0, 5).map(tab => `
          <li data-id="${tab.id}" style="padding: 10px;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${this.escapeHtml(tab.title || tab.url)}
              </div>
              <div style="font-size: 10px; color: var(--text-muted);">
                ⏰ ${this.formatTimeUntil(tab.wakeAt)}
              </div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn btn-icon btn-sm ts-wake" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-success); width: 28px; height: 28px;" title="Wake now">👀</button>
              <button class="btn btn-icon btn-sm ts-delete" style="opacity: 0.5; width: 28px; height: 28px;" title="Delete">🗑️</button>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'ts-snooze-current') {
        this.showSnoozeModal();
      }

      if (e.target.classList.contains('ts-wake')) {
        const li = e.target.closest('li');
        if (li) {
          await this.wakeTab(li.dataset.id);
          window.showToast?.('Tab opened!', 'success');
        }
      }

      if (e.target.classList.contains('ts-delete')) {
        const li = e.target.closest('li');
        if (li) {
          await this.deleteSnooze(li.dataset.id);
          window.showToast?.('Snooze deleted', 'info');
        }
      }
    });
  },

  async showSnoozeModal() {
    // Get current tab info
    let currentTab = { url: '', title: 'Current Tab' };
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        currentTab = { url: tab.url, title: tab.title };
      }
    } catch (e) {
      // Fallback for when not in extension context
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'ts-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">😴 Snooze Tab</h2>
          <button class="modal-close" data-dismiss="ts-modal">&times;</button>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; padding: 12px; background: var(--glass-bg); border-radius: 10px;">
          <strong>GTD Decision:</strong> Will this take less than 2 minutes?
        </p>
        <div class="input-group">
          <label class="input-label">URL</label>
          <input type="text" class="input" id="ts-url" value="${currentTab.url}" placeholder="https://...">
        </div>
        <div class="input-group">
          <label class="input-label">Title</label>
          <input type="text" class="input" id="ts-title" value="${this.escapeHtml(currentTab.title)}" placeholder="Tab title">
        </div>
        <div class="input-group">
          <label class="input-label">Wake up in:</label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
            ${[
              { hours: 1, label: '1 hour' },
              { hours: 4, label: '4 hours' },
              { hours: 24, label: 'Tomorrow' },
              { hours: 48, label: '2 days' },
              { hours: 168, label: '1 week' },
              { hours: 0, label: 'Custom' }
            ].map(opt => `
              <button class="btn btn-secondary btn-sm ts-duration" data-hours="${opt.hours}" style="padding: 10px;">
                ${opt.label}
              </button>
            `).join('')}
          </div>
        </div>
        <div id="ts-custom-time" style="display: none; margin-top: 12px;">
          <div class="input-group">
            <label class="input-label">Custom date/time</label>
            <input type="datetime-local" class="input" id="ts-datetime">
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button class="btn btn-success" id="ts-do-it" style="flex: 1;">✓ Do It (< 2min)</button>
          <button class="btn btn-primary" id="ts-snooze-btn" style="flex: 1;">😴 Snooze</button>
          <button class="btn btn-danger" id="ts-trash-btn" style="flex: 1;">🗑️ Trash</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="ts-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    let selectedHours = 24;

    modal.querySelectorAll('.ts-duration').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.ts-duration').forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = 'var(--accent-primary)';
        selectedHours = parseInt(btn.dataset.hours);
        modal.querySelector('#ts-custom-time').style.display = selectedHours === 0 ? 'block' : 'none';
      });
    });

    modal.querySelector('#ts-do-it').addEventListener('click', () => {
      window.showToast?.('Do it now! Less than 2 minutes.', 'success');
      modal.remove();
    });

    modal.querySelector('#ts-snooze-btn').addEventListener('click', async () => {
      const url = modal.querySelector('#ts-url').value.trim();
      const title = modal.querySelector('#ts-title').value.trim();

      if (!url) {
        window.showToast?.('Enter a URL', 'error');
        return;
      }

      let hours = selectedHours;
      if (hours === 0) {
        const datetime = modal.querySelector('#ts-datetime').value;
        if (!datetime) {
          window.showToast?.('Select a date/time', 'error');
          return;
        }
        const wakeDate = new Date(datetime);
        hours = Math.max(1, Math.ceil((wakeDate - new Date()) / (1000 * 60 * 60)));
      }

      await this.snoozeTab(url, title, hours);
      window.showToast?.(`Tab snoozed for ${hours}h`, 'success');
      modal.remove();
    });

    modal.querySelector('#ts-trash-btn').addEventListener('click', () => {
      window.showToast?.('Tab discarded. Moving on!', 'info');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'id,url,title,snoozedAt,wakeAt\n';
    data.snoozedTabs.forEach(t => {
      csv += `"${t.id}","${t.url}","${(t.title || '').replace(/"/g, '""')}","${t.snoozedAt}","${t.wakeAt}"\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const tabs = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 5) {
          tabs.push({ id: parts[0], url: parts[1], title: parts[2], snoozedAt: parts[3], wakeAt: parts[4] });
        }
      }
      const data = await this.getData();
      data.snoozedTabs = merge ? [...data.snoozedTabs, ...tabs] : tabs;
      await this.saveData(data);
      await this.render();
      return { success: true, count: tabs.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TabSnoozer.init());
} else {
  TabSnoozer.init();
}
