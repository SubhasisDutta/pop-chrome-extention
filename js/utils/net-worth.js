/**
 * Net Worth Logger Utility
 * Monitor assets over time
 * Hotkey: Alt+N
 */

const NetWorth = {
  STORAGE_KEY: 'pop_net_worth',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          entries: [],
          assetCategories: ['cash', 'investments', 'property', 'other'],
          liabilityCategories: ['creditCard', 'loans', 'mortgage', 'other']
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async addEntry(entry) {
    const data = await this.getData();
    entry.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    entry.date = new Date().toISOString();
    entry.totalAssets = Object.values(entry.assets).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    entry.totalLiabilities = Object.values(entry.liabilities).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    entry.netWorth = entry.totalAssets - entry.totalLiabilities;
    data.entries.unshift(entry);
    await this.saveData(data);
    await this.render();
    return entry;
  },

  async render() {
    const container = document.getElementById('net-worth-content');
    if (!container) return;

    const data = await this.getData();
    const latestEntry = data.entries[0];
    const previousEntry = data.entries[1];

    let change = 0;
    let changePercent = 0;
    if (latestEntry && previousEntry) {
      change = latestEntry.netWorth - previousEntry.netWorth;
      changePercent = previousEntry.netWorth !== 0
        ? ((change / previousEntry.netWorth) * 100).toFixed(1)
        : 0;
    }

    container.innerHTML = `
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 12px; color: var(--text-muted);">Current Net Worth</div>
        <div style="font-size: 32px; font-weight: 700; color: ${(latestEntry?.netWorth || 0) >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">
          $${(latestEntry?.netWorth || 0).toLocaleString()}
        </div>
        ${previousEntry ? `
          <div style="font-size: 14px; color: ${change >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">
            ${change >= 0 ? '↑' : '↓'} $${Math.abs(change).toLocaleString()} (${changePercent}%)
          </div>
        ` : ''}
      </div>
      ${latestEntry ? `
        <div class="stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-bottom: 16px;">
          <div class="stat-item" style="padding: 12px;">
            <div class="stat-value" style="font-size: 16px; color: var(--accent-success);">$${latestEntry.totalAssets.toLocaleString()}</div>
            <div class="stat-label">Assets</div>
          </div>
          <div class="stat-item" style="padding: 12px;">
            <div class="stat-value" style="font-size: 16px; color: var(--accent-danger);">$${latestEntry.totalLiabilities.toLocaleString()}</div>
            <div class="stat-label">Liabilities</div>
          </div>
        </div>
      ` : ''}
      <button class="btn btn-primary btn-sm" id="nw-add-btn" style="width: 100%;">
        + Update Net Worth
      </button>
      ${data.entries.length > 1 ? `
        <div style="margin-top: 16px;">
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">History (Last 6 months)</div>
          <div style="display: flex; align-items: flex-end; gap: 4px; height: 60px;">
            ${data.entries.slice(0, 6).reverse().map((entry, i, arr) => {
              const max = Math.max(...arr.map(e => Math.abs(e.netWorth)));
              const height = max > 0 ? (Math.abs(entry.netWorth) / max * 100) : 0;
              const isPositive = entry.netWorth >= 0;
              return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                  <div style="width: 100%; height: ${height}%; min-height: 4px; background: ${isPositive ? 'var(--accent-success)' : 'var(--accent-danger)'}; border-radius: 4px 4px 0 0; opacity: ${0.4 + (i / arr.length * 0.6)};" title="$${entry.netWorth.toLocaleString()}"></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'nw-add-btn') {
        this.showAddModal();
      }
    });
  },

  async showAddModal() {
    const data = await this.getData();
    const lastEntry = data.entries[0];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'nw-add-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title">📈 Update Net Worth</h2>
          <button class="modal-close" onclick="document.getElementById('nw-add-modal').remove()">&times;</button>
        </div>
        <h4 style="color: var(--accent-success); margin-bottom: 12px;">Assets</h4>
        <div class="input-group">
          <label class="input-label">Cash & Bank Accounts</label>
          <input type="number" class="input" id="nw-cash" placeholder="0" value="${lastEntry?.assets?.cash || ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Investments (Stocks, Bonds, Crypto)</label>
          <input type="number" class="input" id="nw-investments" placeholder="0" value="${lastEntry?.assets?.investments || ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Property Value</label>
          <input type="number" class="input" id="nw-property" placeholder="0" value="${lastEntry?.assets?.property || ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Other Assets</label>
          <input type="number" class="input" id="nw-other-assets" placeholder="0" value="${lastEntry?.assets?.other || ''}">
        </div>
        <h4 style="color: var(--accent-danger); margin: 16px 0 12px;">Liabilities</h4>
        <div class="input-group">
          <label class="input-label">Credit Card Debt</label>
          <input type="number" class="input" id="nw-credit" placeholder="0" value="${lastEntry?.liabilities?.creditCard || ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Loans</label>
          <input type="number" class="input" id="nw-loans" placeholder="0" value="${lastEntry?.liabilities?.loans || ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Mortgage</label>
          <input type="number" class="input" id="nw-mortgage" placeholder="0" value="${lastEntry?.liabilities?.mortgage || ''}">
        </div>
        <div class="input-group">
          <label class="input-label">Other Liabilities</label>
          <input type="number" class="input" id="nw-other-liab" placeholder="0" value="${lastEntry?.liabilities?.other || ''}">
        </div>
        <button class="btn btn-primary" id="nw-save-btn" style="width: 100%; margin-top: 16px;">Save Entry</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#nw-save-btn').addEventListener('click', async () => {
      const entry = {
        assets: {
          cash: parseFloat(modal.querySelector('#nw-cash').value) || 0,
          investments: parseFloat(modal.querySelector('#nw-investments').value) || 0,
          property: parseFloat(modal.querySelector('#nw-property').value) || 0,
          other: parseFloat(modal.querySelector('#nw-other-assets').value) || 0
        },
        liabilities: {
          creditCard: parseFloat(modal.querySelector('#nw-credit').value) || 0,
          loans: parseFloat(modal.querySelector('#nw-loans').value) || 0,
          mortgage: parseFloat(modal.querySelector('#nw-mortgage').value) || 0,
          other: parseFloat(modal.querySelector('#nw-other-liab').value) || 0
        }
      };

      await this.addEntry(entry);
      window.showToast?.('Net worth updated!', 'success');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'id,date,cash,investments,property,otherAssets,creditCard,loans,mortgage,otherLiabilities,totalAssets,totalLiabilities,netWorth\n';
    data.entries.forEach(e => {
      csv += `"${e.id}","${e.date}",${e.assets.cash},${e.assets.investments},${e.assets.property},${e.assets.other},${e.liabilities.creditCard},${e.liabilities.loans},${e.liabilities.mortgage},${e.liabilities.other},${e.totalAssets},${e.totalLiabilities},${e.netWorth}\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const entries = [];
      for (let i = 1; i < lines.length; i++) {
        const p = lines[i].split(',').map(v => v.replace(/"/g, ''));
        if (p.length >= 13) {
          entries.push({
            id: p[0], date: p[1],
            assets: { cash: parseFloat(p[2]), investments: parseFloat(p[3]), property: parseFloat(p[4]), other: parseFloat(p[5]) },
            liabilities: { creditCard: parseFloat(p[6]), loans: parseFloat(p[7]), mortgage: parseFloat(p[8]), other: parseFloat(p[9]) },
            totalAssets: parseFloat(p[10]), totalLiabilities: parseFloat(p[11]), netWorth: parseFloat(p[12])
          });
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
  document.addEventListener('DOMContentLoaded', () => NetWorth.init());
} else {
  NetWorth.init();
}
