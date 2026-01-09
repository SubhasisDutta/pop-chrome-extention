/**
 * Mastery Graph Utility (Yesterday Comparison)
 * Compare today vs yesterday for incremental improvement
 * Hotkey: Alt+Y
 */

const MasteryGraph = {
  STORAGE_KEY: 'pop_mastery_graph',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          metric: { name: 'Progress Points', unit: 'points' },
          entries: [],
          streak: 0
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  getTodayKey() {
    return new Date().toISOString().split('T')[0];
  },

  getYesterdayKey() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  },

  async logValue(value) {
    const data = await this.getData();
    const todayKey = this.getTodayKey();
    const yesterdayKey = this.getYesterdayKey();

    // Find or create today's entry
    let todayEntry = data.entries.find(e => e.date.startsWith(todayKey));
    const yesterdayEntry = data.entries.find(e => e.date.startsWith(yesterdayKey));

    if (todayEntry) {
      todayEntry.value = value;
    } else {
      todayEntry = { date: new Date().toISOString(), value };
      data.entries.unshift(todayEntry);
    }

    // Update streak
    if (yesterdayEntry && value > yesterdayEntry.value) {
      data.streak = (data.streak || 0) + 1;
    } else if (!yesterdayEntry || value <= yesterdayEntry.value) {
      data.streak = value > (yesterdayEntry?.value || 0) ? 1 : 0;
    }

    // Keep only last 30 entries
    data.entries = data.entries.slice(0, 30);

    await this.saveData(data);
    await this.render();
  },

  async setMetric(name, unit) {
    const data = await this.getData();
    data.metric = { name, unit };
    await this.saveData(data);
    await this.render();
  },

  async render() {
    const container = document.getElementById('mastery-graph-content');
    if (!container) return;

    const data = await this.getData();
    const todayKey = this.getTodayKey();
    const yesterdayKey = this.getYesterdayKey();

    const todayEntry = data.entries.find(e => e.date.startsWith(todayKey));
    const yesterdayEntry = data.entries.find(e => e.date.startsWith(yesterdayKey));

    const todayValue = todayEntry?.value || 0;
    const yesterdayValue = yesterdayEntry?.value || 0;
    const diff = todayValue - yesterdayValue;
    const isImproved = todayValue > yesterdayValue;
    const percentChange = yesterdayValue > 0 ? Math.round((diff / yesterdayValue) * 100) : 0;

    container.innerHTML = `
      <div style="text-align: center; padding: 16px; background: ${isImproved ? 'rgba(16, 185, 129, 0.15)' : yesterdayValue === 0 ? 'var(--glass-bg)' : 'rgba(245, 158, 11, 0.15)'}; border-radius: 12px; margin-bottom: 16px;">
        ${todayEntry ? `
          <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 4px;">${data.metric.name}</div>
          <div style="font-size: 48px; font-weight: 700; color: ${isImproved ? 'var(--accent-success)' : 'var(--text-primary)'};">
            ${todayValue}
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">${data.metric.unit}</div>
          ${yesterdayEntry ? `
            <div style="margin-top: 12px; font-size: 14px; color: ${isImproved ? 'var(--accent-success)' : 'var(--accent-warning)'};">
              ${isImproved ? '↑' : diff === 0 ? '=' : '↓'} ${Math.abs(diff)} from yesterday (${percentChange >= 0 ? '+' : ''}${percentChange}%)
            </div>
          ` : `
            <div style="margin-top: 12px; font-size: 12px; color: var(--text-muted);">
              No data from yesterday
            </div>
          `}
        ` : `
          <div style="font-size: 40px; margin-bottom: 8px;">📈</div>
          <div style="font-size: 14px; color: var(--text-muted);">Log today's progress</div>
        `}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div>
          <span style="font-size: 20px;">🔥</span>
          <span style="font-weight: 600;">${data.streak}</span>
          <span style="font-size: 12px; color: var(--text-muted);">day streak</span>
        </div>
        <button class="btn btn-sm btn-secondary" id="mg-change-metric">Change Metric</button>
      </div>
      <div style="display: flex; gap: 8px; align-items: flex-end; justify-content: center; height: 60px; margin-bottom: 12px;">
        <div style="text-align: center;">
          <div style="width: 50px; height: ${Math.min(60, Math.max(4, yesterdayValue * 0.5))}px; background: var(--text-muted); border-radius: 6px 6px 0 0; opacity: 0.5;"></div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Yesterday</div>
          <div style="font-size: 12px; font-weight: 600;">${yesterdayValue}</div>
        </div>
        <div style="text-align: center;">
          <div style="width: 50px; height: ${Math.min(60, Math.max(4, todayValue * 0.5))}px; background: ${isImproved ? 'var(--accent-success)' : 'var(--accent-primary)'}; border-radius: 6px 6px 0 0;"></div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">Today</div>
          <div style="font-size: 12px; font-weight: 600;">${todayValue}</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="mg-log-btn" style="width: 100%;">
        + Log Today's ${data.metric.name}
      </button>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'mg-log-btn') {
        this.showLogModal();
      }

      if (e.target.id === 'mg-change-metric') {
        this.showMetricModal();
      }
    });
  },

  async showLogModal() {
    const data = await this.getData();
    const todayKey = this.getTodayKey();
    const todayEntry = data.entries.find(e => e.date.startsWith(todayKey));

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'mg-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 350px;">
        <div class="modal-header">
          <h2 class="modal-title">📈 Log Progress</h2>
          <button class="modal-close" data-dismiss="mg-modal">&times;</button>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; text-align: center;">
          Compare yourself to who you were yesterday, not to who someone else is today.
        </p>
        <div class="input-group">
          <label class="input-label">${data.metric.name} (${data.metric.unit})</label>
          <input type="number" class="input" id="mg-value" placeholder="0" value="${todayEntry?.value || ''}" min="0" style="font-size: 24px; text-align: center;">
        </div>
        <button class="btn btn-primary" id="mg-save-btn" style="width: 100%; margin-top: 16px;">Save</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="mg-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#mg-save-btn').addEventListener('click', async () => {
      const value = parseInt(modal.querySelector('#mg-value').value) || 0;
      await this.logValue(value);
      window.showToast?.('Progress logged!', 'success');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async showMetricModal() {
    const data = await this.getData();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'mg-metric-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 350px;">
        <div class="modal-header">
          <h2 class="modal-title">📊 Change Metric</h2>
          <button class="modal-close" data-dismiss="mg-metric-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">What are you tracking?</label>
          <input type="text" class="input" id="mg-metric-name" value="${data.metric.name}" placeholder="e.g., Lines of Code">
        </div>
        <div class="input-group">
          <label class="input-label">Unit</label>
          <input type="text" class="input" id="mg-metric-unit" value="${data.metric.unit}" placeholder="e.g., lines">
        </div>
        <div style="margin-top: 12px;">
          <label class="input-label">Quick presets:</label>
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
            ${[
              { name: 'Lines of Code', unit: 'lines' },
              { name: 'Pages Read', unit: 'pages' },
              { name: 'Words Written', unit: 'words' },
              { name: 'Minutes Focused', unit: 'minutes' },
              { name: 'Tasks Completed', unit: 'tasks' }
            ].map(p => `
              <button class="btn btn-sm btn-secondary mg-preset" data-name="${p.name}" data-unit="${p.unit}">${p.name}</button>
            `).join('')}
          </div>
        </div>
        <button class="btn btn-primary" id="mg-metric-save" style="width: 100%; margin-top: 16px;">Save Metric</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="mg-metric-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelectorAll('.mg-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelector('#mg-metric-name').value = btn.dataset.name;
        modal.querySelector('#mg-metric-unit').value = btn.dataset.unit;
      });
    });

    modal.querySelector('#mg-metric-save').addEventListener('click', async () => {
      const name = modal.querySelector('#mg-metric-name').value.trim() || 'Progress';
      const unit = modal.querySelector('#mg-metric-unit').value.trim() || 'points';
      await this.setMetric(name, unit);
      window.showToast?.('Metric updated!', 'success');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  /**
   * Render expanded view with full mastery tracking
   */
  async renderExpanded() {
    const container = document.getElementById('mastery-graph-content');
    if (!container) return;

    const data = await this.getData();
    const today = this.getTodayValue(data.entries);
    const yesterday = this.getYesterdayValue(data.entries);
    const diff = today - yesterday;
    const totalAll = data.entries.reduce((sum, e) => sum + e.value, 0);
    const avgDaily = data.entries.length > 0 ? Math.round(totalAll / data.entries.length) : 0;

    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const entry = data.entries.find(e => e.date === dateKey);
      last14Days.push({ date: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), value: entry?.value || 0 });
    }
    const maxVal = Math.max(...last14Days.map(d => d.value)) || 1;

    container.innerHTML = `
      <div class="expanded-content">
        <div class="expanded-header">
          <div class="expanded-title"><span class="expanded-title-icon">📉</span>${data.metric.name}</div>
          <div class="expanded-stats">
            <div class="expanded-stat"><div class="expanded-stat-value">${today}</div><div class="expanded-stat-label">Today</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value" style="color: ${diff >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">${diff >= 0 ? '+' : ''}${diff}</div><div class="expanded-stat-label">vs Yesterday</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value">${avgDaily}</div><div class="expanded-stat-label">Daily Avg</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value">${totalAll.toLocaleString()}</div><div class="expanded-stat-label">Total ${data.metric.unit}</div></div>
          </div>
        </div>

        <div style="margin-bottom: 24px; display: flex; gap: 8px;">
          <button class="btn btn-primary" id="mg-exp-log">+ Log Today's ${data.metric.name}</button>
          <button class="btn btn-secondary" id="mg-exp-metric">⚙️ Change Metric</button>
        </div>

        <div class="expanded-section" style="margin-bottom: 24px;">
          <div class="expanded-section-title"><span>📊</span> Today vs Yesterday</div>
          <div style="display: flex; gap: 24px; justify-content: center; padding: 24px;">
            <div style="text-align: center;">
              <div style="font-size: 64px; font-weight: 700; color: var(--accent-primary);">${today}</div>
              <div style="font-size: 14px; color: var(--text-muted);">Today</div>
            </div>
            <div style="display: flex; align-items: center; font-size: 40px; color: ${diff >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">
              ${diff >= 0 ? '↑' : '↓'}
            </div>
            <div style="text-align: center;">
              <div style="font-size: 64px; font-weight: 700; color: var(--text-muted);">${yesterday}</div>
              <div style="font-size: 14px; color: var(--text-muted);">Yesterday</div>
            </div>
          </div>
        </div>

        <div class="expanded-section">
          <div class="expanded-section-title"><span>📈</span> Last 14 Days</div>
          <div style="display: flex; align-items: flex-end; gap: 6px; height: 200px; padding: 10px 0;">
            ${last14Days.map(day => `
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%;">
                <div style="flex: 1; display: flex; align-items: flex-end; width: 100%;">
                  <div style="width: 100%; height: ${(day.value / maxVal) * 100}%; background: var(--accent-primary); border-radius: 4px 4px 0 0; min-height: 2px;" title="${day.value} ${data.metric.unit}"></div>
                </div>
                <div style="font-size: 8px; color: var(--text-muted); margin-top: 4px; transform: rotate(-45deg); white-space: nowrap;">${day.date}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    const logBtn = container.querySelector('#mg-exp-log');
    if (logBtn) logBtn.onclick = () => this.showLogModal();

    const metricBtn = container.querySelector('#mg-exp-metric');
    if (metricBtn) metricBtn.onclick = () => this.showMetricModal();
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = `metric,${data.metric.name},${data.metric.unit}\n`;
    csv += 'date,value\n';
    data.entries.forEach(e => {
      csv += `"${e.date}",${e.value}\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const entries = [];
      for (let i = 2; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 2) {
          entries.push({ date: parts[0], value: parseInt(parts[1]) });
        }
      }
      const data = await this.getData();
      data.entries = merge ? [...data.entries, ...entries] : entries;
      await this.saveData(data);
      await this.render();
      return { success: true, count: entries.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => MasteryGraph.init());
} else {
  MasteryGraph.init();
}
