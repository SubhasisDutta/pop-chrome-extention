/**
 * Life Expectancy Calculator Utility
 * Calculate remaining time and financial freedom metrics
 * Hotkey: Alt+L
 */

const LifeCalculator = {
  STORAGE_KEY: 'pop_life_calculator',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          dob: '',
          expectedLifespan: 85,
          weeklyHours: 112,
          netWorth: 0,
          monthlySpending: 0,
          monthlySavings: 0,
          showInputs: true
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async updateData(updates) {
    const data = await this.getData();
    Object.assign(data, updates);
    await this.saveData(data);
    await this.render();
  },

  calculateMetrics(data) {
    if (!data.dob) {
      return null;
    }

    const now = new Date();
    const dob = new Date(data.dob);
    const expectedEnd = new Date(dob);
    expectedEnd.setFullYear(expectedEnd.getFullYear() + data.expectedLifespan);

    // Time calculations
    const ageMs = now - dob;
    const ageYears = ageMs / (1000 * 60 * 60 * 24 * 365.25);
    const remainingMs = expectedEnd - now;
    const remainingWeeks = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24 * 7)));
    const remainingHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));
    const usableHours = remainingWeeks * data.weeklyHours;

    // Life progress
    const lifeProgress = Math.min(100, (ageYears / data.expectedLifespan) * 100);

    // Financial calculations
    const hourWorth = data.netWorth > 0 && usableHours > 0 ? data.netWorth / usableHours : 0;
    const monthlyExpense = Math.max(0, data.monthlySpending - data.monthlySavings);
    const annualReturn = 0.01; // 1% conservative return
    const autoIncome = (data.netWorth * annualReturn) / 12;
    const freedomAim = monthlyExpense > 0 ? (monthlyExpense * 12) / annualReturn : 0;
    const freedomProgress = freedomAim > 0 ? Math.min(100, (data.netWorth / freedomAim) * 100) : 0;

    return {
      ageYears: Math.floor(ageYears),
      remainingWeeks,
      remainingHours,
      usableHours,
      lifeProgress,
      hourWorth,
      monthlyExpense,
      autoIncome,
      freedomAim,
      freedomProgress,
      expectedEnd,
      daysUntilEnd: Math.floor(remainingMs / (1000 * 60 * 60 * 24))
    };
  },

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  },

  async render() {
    const container = document.getElementById('life-calculator-content');
    if (!container) return;

    const data = await this.getData();
    const metrics = this.calculateMetrics(data);

    if (!metrics) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px;">
          <div style="font-size: 48px; margin-bottom: 16px;">⏳</div>
          <h3 style="margin-bottom: 8px;">Life Calculator</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
            Set up your life metrics to see your remaining time and financial freedom progress.
          </p>
          <button class="btn btn-primary" id="lc-setup">Set Up Now</button>
        </div>
      `;
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div style="font-size: 12px; color: var(--text-muted);">📅 ${today}</div>
        <button class="btn btn-sm btn-secondary" id="lc-toggle-inputs" style="padding: 4px 8px; font-size: 10px;">
          ${data.showInputs ? '👁️ Hide Inputs' : '⚙️ Show Inputs'}
        </button>
      </div>

      ${data.showInputs ? `
        <div class="glass-card-flat" style="padding: 12px; margin-bottom: 16px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            <div class="input-group" style="margin-bottom: 8px;">
              <label class="input-label" style="font-size: 10px;">Date of Birth</label>
              <input type="date" class="input lc-input" data-field="dob" value="${data.dob}" style="padding: 8px; font-size: 12px;">
            </div>
            <div class="input-group" style="margin-bottom: 8px;">
              <label class="input-label" style="font-size: 10px;">Expected Lifespan</label>
              <input type="number" class="input lc-input" data-field="expectedLifespan" value="${data.expectedLifespan}" placeholder="85" style="padding: 8px; font-size: 12px;">
            </div>
            <div class="input-group" style="margin-bottom: 8px;">
              <label class="input-label" style="font-size: 10px;">Net Worth ($)</label>
              <input type="number" class="input lc-input" data-field="netWorth" value="${data.netWorth}" placeholder="0" style="padding: 8px; font-size: 12px;">
            </div>
            <div class="input-group" style="margin-bottom: 8px;">
              <label class="input-label" style="font-size: 10px;">Weekly Hours</label>
              <input type="number" class="input lc-input" data-field="weeklyHours" value="${data.weeklyHours}" placeholder="112" style="padding: 8px; font-size: 12px;">
            </div>
            <div class="input-group" style="margin-bottom: 0;">
              <label class="input-label" style="font-size: 10px;">Monthly Spending ($)</label>
              <input type="number" class="input lc-input" data-field="monthlySpending" value="${data.monthlySpending}" placeholder="0" style="padding: 8px; font-size: 12px;">
            </div>
            <div class="input-group" style="margin-bottom: 0;">
              <label class="input-label" style="font-size: 10px;">Monthly Savings ($)</label>
              <input type="number" class="input lc-input" data-field="monthlySavings" value="${data.monthlySavings}" placeholder="0" style="padding: 8px; font-size: 12px;">
            </div>
          </div>
        </div>
      ` : ''}

      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 12px; color: var(--text-muted);">Age ${metrics.ageYears} • Life Progress</div>
        <div class="progress-bar" style="height: 12px; margin: 8px 0;">
          <div class="progress-fill ${metrics.lifeProgress > 75 ? 'danger' : metrics.lifeProgress > 50 ? 'warning' : 'success'}" style="width: ${metrics.lifeProgress}%;"></div>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${metrics.lifeProgress.toFixed(1)}% of expected lifespan</div>
      </div>

      <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 16px;">
        <div class="stat-item" style="padding: 12px;">
          <div class="stat-value" style="font-size: 20px; color: var(--accent-primary);">${this.formatNumber(metrics.remainingWeeks)}</div>
          <div class="stat-label">Weeks Left</div>
        </div>
        <div class="stat-item" style="padding: 12px;">
          <div class="stat-value" style="font-size: 20px; color: var(--accent-primary);">${this.formatNumber(metrics.usableHours)}</div>
          <div class="stat-label">Usable Hours</div>
        </div>
        <div class="stat-item" style="padding: 12px;">
          <div class="stat-value" style="font-size: 20px; color: var(--accent-success);">$${metrics.hourWorth.toFixed(2)}</div>
          <div class="stat-label">Hour Worth</div>
        </div>
        <div class="stat-item" style="padding: 12px;">
          <div class="stat-value" style="font-size: 20px; color: var(--accent-success);">$${this.formatNumber(Math.round(metrics.autoIncome))}</div>
          <div class="stat-label">Auto Income/mo</div>
        </div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
          <span>Freedom Progress</span>
          <span>$${this.formatNumber(data.netWorth)} / $${this.formatNumber(Math.round(metrics.freedomAim))}</span>
        </div>
        <div class="progress-bar" style="height: 16px;">
          <div class="progress-fill success" style="width: ${metrics.freedomProgress}%;"></div>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px; text-align: center;">
          ${metrics.freedomProgress.toFixed(1)}% to Financial Freedom (1% return covers $${this.formatNumber(Math.round(metrics.monthlyExpense))}/mo expenses)
        </div>
      </div>

      <div class="glass-card-flat" style="padding: 12px; text-align: center;">
        <div style="font-size: 11px; color: var(--text-muted);">Expected End Date</div>
        <div style="font-size: 14px; font-weight: 600;">
          ${metrics.expectedEnd.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${this.formatNumber(metrics.daysUntilEnd)} days remaining</div>
      </div>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'lc-setup') {
        this.showSetupModal();
      }

      if (e.target.id === 'lc-toggle-inputs') {
        const data = await this.getData();
        await this.updateData({ showInputs: !data.showInputs });
      }
    });

    document.addEventListener('change', async (e) => {
      if (e.target.classList.contains('lc-input')) {
        const field = e.target.dataset.field;
        let value = e.target.value;

        if (field !== 'dob') {
          value = parseFloat(value) || 0;
        }

        await this.updateData({ [field]: value });
      }
    });
  },

  showSetupModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'lc-setup-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 450px;">
        <div class="modal-header">
          <h2 class="modal-title">⏳ Life Calculator Setup</h2>
          <button class="modal-close" data-dismiss="lc-setup-modal">&times;</button>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          Enter your information to calculate your remaining time and financial freedom metrics.
        </p>
        <div class="input-group">
          <label class="input-label">Date of Birth</label>
          <input type="date" class="input" id="lc-dob">
        </div>
        <div class="input-group">
          <label class="input-label">Expected Lifespan (years)</label>
          <input type="number" class="input" id="lc-lifespan" value="85" min="1" max="120">
        </div>
        <div class="input-group">
          <label class="input-label">Weekly Usable Hours (awake, productive)</label>
          <input type="number" class="input" id="lc-hours" value="112" min="1" max="168">
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Default: 16 hours/day × 7 days = 112</div>
        </div>
        <div class="input-group">
          <label class="input-label">Current Net Worth ($)</label>
          <input type="number" class="input" id="lc-networth" value="0" min="0">
        </div>
        <div class="input-group">
          <label class="input-label">Monthly Spending ($)</label>
          <input type="number" class="input" id="lc-spending" value="0" min="0">
        </div>
        <div class="input-group">
          <label class="input-label">Monthly Savings ($)</label>
          <input type="number" class="input" id="lc-savings" value="0" min="0">
        </div>
        <button class="btn btn-primary" id="lc-save-setup" style="width: 100%; margin-top: 16px;">Calculate My Life</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="lc-setup-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#lc-save-setup').addEventListener('click', async () => {
      const dob = modal.querySelector('#lc-dob').value;
      if (!dob) {
        window.showToast?.('Please enter your date of birth', 'error');
        return;
      }

      await this.updateData({
        dob,
        expectedLifespan: parseInt(modal.querySelector('#lc-lifespan').value) || 85,
        weeklyHours: parseInt(modal.querySelector('#lc-hours').value) || 112,
        netWorth: parseFloat(modal.querySelector('#lc-networth').value) || 0,
        monthlySpending: parseFloat(modal.querySelector('#lc-spending').value) || 0,
        monthlySavings: parseFloat(modal.querySelector('#lc-savings').value) || 0
      });

      window.showToast?.('Life calculator set up!', 'success');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  /**
   * Render expanded view with detailed life metrics
   */
  async renderExpanded() {
    const container = document.getElementById('life-calculator-content');
    if (!container) return;

    const data = await this.getData();
    const metrics = this.calculateMetrics(data);

    if (!metrics) {
      container.innerHTML = `
        <div class="expanded-content">
          <div style="text-align: center; padding: 80px 40px;">
            <div style="font-size: 80px; margin-bottom: 24px;">⏳</div>
            <h2 style="margin-bottom: 12px;">Life Calculator</h2>
            <p style="font-size: 16px; color: var(--text-muted); margin-bottom: 24px;">Set up your life metrics to see your remaining time and financial freedom progress.</p>
            <button class="btn btn-primary btn-lg" id="lc-exp-setup">Set Up Now</button>
          </div>
        </div>
      `;
      const setupBtn = container.querySelector('#lc-exp-setup');
      if (setupBtn) setupBtn.onclick = () => this.showSetupModal();
      return;
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    container.innerHTML = `
      <div class="expanded-content">
        <div class="expanded-header">
          <div class="expanded-title"><span class="expanded-title-icon">⏳</span>Life Calculator</div>
          <div class="expanded-stats">
            <div class="expanded-stat"><div class="expanded-stat-value">${metrics.ageYears}</div><div class="expanded-stat-label">Current Age</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value">${this.formatNumber(metrics.remainingWeeks)}</div><div class="expanded-stat-label">Weeks Left</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value">$${metrics.hourWorth.toFixed(2)}</div><div class="expanded-stat-label">Hour Worth</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value" style="color: ${metrics.freedomProgress >= 100 ? 'var(--accent-success)' : 'var(--accent-warning)'};">${metrics.freedomProgress.toFixed(1)}%</div><div class="expanded-stat-label">Financial Freedom</div></div>
          </div>
        </div>

        <div style="margin-bottom: 24px;"><button class="btn btn-secondary" id="lc-exp-edit">⚙️ Edit Settings</button></div>

        <div class="expanded-grid-2" style="margin-bottom: 24px;">
          <div class="expanded-section">
            <div class="expanded-section-title"><span>⏱️</span> Time Remaining</div>
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 12px; color: var(--text-muted);">Life Progress (Age ${metrics.ageYears} of ${data.expectedLifespan})</div>
              <div class="progress-bar" style="height: 24px; margin: 12px 0;">
                <div class="progress-fill ${metrics.lifeProgress > 75 ? 'danger' : metrics.lifeProgress > 50 ? 'warning' : 'success'}" style="width: ${metrics.lifeProgress}%;"></div>
              </div>
              <div style="font-size: 28px; font-weight: 700; color: var(--accent-primary);">${metrics.lifeProgress.toFixed(1)}%</div>
            </div>
            <div class="expanded-grid-2" style="gap: 12px;">
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">📅</div><div class="stat-value" style="font-size: 24px;">${this.formatNumber(metrics.remainingWeeks)}</div><div class="stat-label">Weeks</div></div>
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">⏰</div><div class="stat-value" style="font-size: 24px;">${this.formatNumber(metrics.usableHours)}</div><div class="stat-label">Usable Hours</div></div>
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">🌅</div><div class="stat-value" style="font-size: 24px;">${this.formatNumber(metrics.daysUntilEnd)}</div><div class="stat-label">Days</div></div>
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">🎂</div><div class="stat-value" style="font-size: 24px;">${data.expectedLifespan - metrics.ageYears}</div><div class="stat-label">Years</div></div>
            </div>
          </div>

          <div class="expanded-section">
            <div class="expanded-section-title"><span>💰</span> Financial Freedom</div>
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="font-size: 12px; color: var(--text-muted);">Progress to Financial Independence</div>
              <div class="progress-bar" style="height: 24px; margin: 12px 0;">
                <div class="progress-fill ${metrics.freedomProgress >= 100 ? 'success' : metrics.freedomProgress >= 50 ? 'warning' : ''}" style="width: ${Math.min(100, metrics.freedomProgress)}%;"></div>
              </div>
              <div style="font-size: 16px; color: var(--text-muted);">$${this.formatNumber(data.netWorth)} / $${this.formatNumber(Math.round(metrics.freedomAim))}</div>
            </div>
            <div class="expanded-grid-2" style="gap: 12px;">
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">💵</div><div class="stat-value" style="font-size: 20px;">$${this.formatNumber(data.netWorth)}</div><div class="stat-label">Net Worth</div></div>
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">🎯</div><div class="stat-value" style="font-size: 20px;">$${this.formatNumber(Math.round(metrics.freedomAim))}</div><div class="stat-label">Freedom Target</div></div>
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">📈</div><div class="stat-value" style="font-size: 20px; color: var(--accent-success);">$${this.formatNumber(Math.round(metrics.autoIncome))}</div><div class="stat-label">Auto Income/mo</div></div>
              <div class="stat-card-large" style="padding: 16px;"><div class="stat-icon">💳</div><div class="stat-value" style="font-size: 20px; color: var(--accent-danger);">$${this.formatNumber(Math.round(metrics.monthlyExpense))}</div><div class="stat-label">Monthly Expenses</div></div>
            </div>
          </div>
        </div>

        <div class="expanded-section">
          <div class="expanded-section-title"><span>📊</span> Key Metrics</div>
          <div class="expanded-grid-4">
            <div class="stat-card-large"><div class="stat-icon">🕐</div><div class="stat-value" style="font-size: 24px;">$${metrics.hourWorth.toFixed(2)}</div><div class="stat-label">Value per Hour</div></div>
            <div class="stat-card-large"><div class="stat-icon">📅</div><div class="stat-value" style="font-size: 24px;">${metrics.expectedEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div><div class="stat-label">Expected End</div></div>
            <div class="stat-card-large"><div class="stat-icon">⏰</div><div class="stat-value" style="font-size: 24px;">${data.weeklyHours}</div><div class="stat-label">Weekly Hours</div></div>
            <div class="stat-card-large"><div class="stat-icon">💰</div><div class="stat-value" style="font-size: 24px;">$${this.formatNumber(data.monthlySavings)}</div><div class="stat-label">Monthly Savings</div></div>
          </div>
        </div>
      </div>
    `;

    const editBtn = container.querySelector('#lc-exp-edit');
    if (editBtn) editBtn.onclick = () => this.showSetupModal();
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'field,value\n';
    Object.entries(data).forEach(([k, v]) => {
      csv += `"${k}","${v}"\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const updates = {};
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 2) {
          const [field, value] = parts;
          if (field === 'dob') {
            updates[field] = value;
          } else if (field === 'showInputs') {
            updates[field] = value === 'true';
          } else {
            updates[field] = parseFloat(value) || 0;
          }
        }
      }
      await this.updateData(updates);
      return { success: true, count: Object.keys(updates).length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LifeCalculator.init());
} else {
  LifeCalculator.init();
}
