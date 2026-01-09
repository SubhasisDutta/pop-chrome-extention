/**
 * Truth Time Logger Utility
 * Track deep vs shallow work without blocking
 * Hotkey: Alt+T
 */

const TruthLogger = {
  STORAGE_KEY: 'pop_truth_logger',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          siteCategories: {},
          timeLog: [],
          currentSession: { startTime: null, site: null, category: null }
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async categorizeSite(site, category) {
    const data = await this.getData();
    data.siteCategories[site] = category;
    await this.saveData(data);
    await this.render();
  },

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  },

  async logTime(category, minutes) {
    const data = await this.getData();
    const todayKey = this.getTodayKey();
    let todayLog = data.timeLog.find(l => l.date.startsWith(todayKey));

    if (!todayLog) {
      todayLog = { date: new Date().toISOString(), deep: 0, shallow: 0 };
      data.timeLog.unshift(todayLog);
    }

    todayLog[category] += minutes;
    await this.saveData(data);
    await this.render();
  },

  getTruthScore(data) {
    const todayKey = this.getTodayKey();
    const todayLog = data.timeLog.find(l => l.date.startsWith(todayKey));
    if (!todayLog) return { score: 0, deep: 0, shallow: 0, verdict: 'No data' };

    const total = todayLog.deep + todayLog.shallow;
    if (total === 0) return { score: 0, deep: 0, shallow: 0, verdict: 'No data' };

    const score = Math.round((todayLog.deep / total) * 100);
    let verdict = 'Shallow Day';
    if (score >= 70) verdict = 'Deep Work Day! 🎯';
    else if (score >= 50) verdict = 'Balanced Day';
    else if (score >= 30) verdict = 'Mostly Shallow';

    return { score, deep: todayLog.deep, shallow: todayLog.shallow, verdict };
  },

  formatMinutes(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  },

  async render() {
    const container = document.getElementById('truth-logger-content');
    if (!container) return;

    const data = await this.getData();
    const truth = this.getTruthScore(data);
    const categorizedSites = Object.entries(data.siteCategories);

    container.innerHTML = `
      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <div style="flex: 1; text-align: center; padding: 16px; background: ${truth.score >= 50 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'}; border-radius: 12px;">
          <div style="font-size: 32px; font-weight: 700; color: ${truth.score >= 50 ? 'var(--accent-success)' : 'var(--accent-warning)'};">${truth.score}%</div>
          <div style="font-size: 12px; color: var(--text-muted);">Truth Score</div>
          <div style="font-size: 14px; font-weight: 600; margin-top: 4px;">${truth.verdict}</div>
        </div>
        <div style="flex: 1;">
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span class="tag tag-deep">Deep</span>
              <span>${this.formatMinutes(truth.deep)}</span>
            </div>
            <div class="progress-bar" style="margin-top: 4px;">
              <div class="progress-fill success" style="width: ${truth.deep + truth.shallow > 0 ? (truth.deep / (truth.deep + truth.shallow)) * 100 : 0}%;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 12px;">
              <span class="tag tag-shallow">Shallow</span>
              <span>${this.formatMinutes(truth.shallow)}</span>
            </div>
            <div class="progress-bar" style="margin-top: 4px;">
              <div class="progress-fill warning" style="width: ${truth.deep + truth.shallow > 0 ? (truth.shallow / (truth.deep + truth.shallow)) * 100 : 0}%;"></div>
            </div>
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <button class="btn btn-sm" id="tl-log-deep" style="flex: 1; background: rgba(139, 92, 246, 0.2); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3);">+ Deep Work</button>
        <button class="btn btn-sm" id="tl-log-shallow" style="flex: 1; background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3);">+ Shallow Work</button>
      </div>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
        Categorized Sites (${categorizedSites.length})
        <button class="btn btn-sm btn-secondary" id="tl-add-site" style="margin-left: 8px; padding: 4px 8px; font-size: 10px;">+</button>
      </div>
      <ul class="item-list" style="max-height: 100px;">
        ${categorizedSites.length === 0 ? `
          <li style="justify-content: center; color: var(--text-muted); font-size: 12px;">No sites categorized yet</li>
        ` : categorizedSites.slice(0, 5).map(([site, cat]) => `
          <li style="padding: 8px;">
            <span style="flex: 1; font-size: 12px;">${this.escapeHtml(site)}</span>
            <span class="tag ${cat === 'deep' ? 'tag-deep' : 'tag-shallow'}" style="font-size: 10px;">${cat}</span>
          </li>
        `).join('')}
      </ul>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'tl-log-deep') {
        this.showLogModal('deep');
      }

      if (e.target.id === 'tl-log-shallow') {
        this.showLogModal('shallow');
      }

      if (e.target.id === 'tl-add-site') {
        this.showAddSiteModal();
      }
    });
  },

  showLogModal(category) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'tl-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 350px;">
        <div class="modal-header">
          <h2 class="modal-title">${category === 'deep' ? '🎯 Log Deep Work' : '📧 Log Shallow Work'}</h2>
          <button class="modal-close" data-dismiss="tl-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">How many minutes?</label>
          <div style="display: flex; gap: 8px;">
            ${[15, 30, 45, 60].map(m => `
              <button class="btn btn-secondary btn-sm tl-quick-min" data-minutes="${m}" style="flex: 1;">${m}m</button>
            `).join('')}
          </div>
        </div>
        <div class="input-group" style="margin-top: 12px;">
          <label class="input-label">Or enter custom:</label>
          <input type="number" class="input" id="tl-minutes" placeholder="Minutes" min="1">
        </div>
        <button class="btn btn-primary" id="tl-log-btn" style="width: 100%; margin-top: 16px;">Log Time</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="tl-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    let selectedMinutes = 0;

    modal.querySelectorAll('.tl-quick-min').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.tl-quick-min').forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = 'var(--accent-primary)';
        selectedMinutes = parseInt(btn.dataset.minutes);
        modal.querySelector('#tl-minutes').value = '';
      });
    });

    modal.querySelector('#tl-log-btn').addEventListener('click', async () => {
      const customMinutes = parseInt(modal.querySelector('#tl-minutes').value);
      const minutes = customMinutes || selectedMinutes;

      if (!minutes || minutes <= 0) {
        window.showToast?.('Select or enter time', 'error');
        return;
      }

      await this.logTime(category, minutes);
      window.showToast?.(`Logged ${minutes}m of ${category} work`, 'success');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  showAddSiteModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'tl-site-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">🏷️ Categorize Site</h2>
          <button class="modal-close" data-dismiss="tl-site-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">Website domain</label>
          <input type="text" class="input" id="tl-site-domain" placeholder="e.g., github.com">
        </div>
        <div class="input-group">
          <label class="input-label">Category</label>
          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <label style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; background: rgba(139, 92, 246, 0.1); border-radius: 10px; cursor: pointer; border: 2px solid transparent;">
              <input type="radio" name="tl-cat" value="deep" checked style="display: none;">
              <span style="font-size: 24px;">🎯</span>
              <span style="font-size: 12px; margin-top: 4px;">Deep Work</span>
            </label>
            <label style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: 10px; cursor: pointer; border: 2px solid transparent;">
              <input type="radio" name="tl-cat" value="shallow" style="display: none;">
              <span style="font-size: 24px;">📧</span>
              <span style="font-size: 12px; margin-top: 4px;">Shallow</span>
            </label>
          </div>
        </div>
        <button class="btn btn-primary" id="tl-save-site" style="width: 100%; margin-top: 16px;">Save Category</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="tl-site-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelectorAll('label:has(input[name="tl-cat"])').forEach(label => {
      label.addEventListener('click', () => {
        modal.querySelectorAll('label:has(input[name="tl-cat"])').forEach(l => l.style.borderColor = 'transparent');
        label.style.borderColor = 'var(--accent-primary)';
      });
    });

    modal.querySelector('#tl-save-site').addEventListener('click', async () => {
      const domain = modal.querySelector('#tl-site-domain').value.trim().toLowerCase();
      const category = modal.querySelector('input[name="tl-cat"]:checked').value;

      if (!domain) {
        window.showToast?.('Enter a domain', 'error');
        return;
      }

      await this.categorizeSite(domain, category);
      window.showToast?.(`${domain} marked as ${category}`, 'success');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'date,deep,shallow\n';
    data.timeLog.forEach(l => {
      csv += `"${l.date}",${l.deep},${l.shallow}\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const logs = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          logs.push({ date: parts[0], deep: parseInt(parts[1]), shallow: parseInt(parts[2]) });
        }
      }
      const data = await this.getData();
      data.timeLog = merge ? [...data.timeLog, ...logs] : logs;
      await this.saveData(data);
      await this.render();
      return { success: true, count: logs.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TruthLogger.init());
} else {
  TruthLogger.init();
}
