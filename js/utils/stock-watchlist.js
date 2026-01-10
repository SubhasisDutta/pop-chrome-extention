/**
 * Stock Watchlist Utility
 * Create multiple watchlists with stock symbols
 * Hotkey: Alt+S
 */

const StockWatchlist = {
  STORAGE_KEY: 'pop_stock_watchlist',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || { watchlists: [] });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  getGoogleFinanceUrl(symbol, exchange = 'NASDAQ') {
    return `https://www.google.com/finance/quote/${symbol}:${exchange}`;
  },

  getYahooFinanceUrl(symbol) {
    return `https://finance.yahoo.com/quote/${symbol}`;
  },

  getRobinhoodUrl(symbol) {
    return `https://robinhood.com/us/en/stocks/${symbol}/`;
  },

  async createWatchlist(name) {
    const data = await this.getData();
    const watchlist = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      createdAt: new Date().toISOString(),
      stocks: []
    };
    data.watchlists.push(watchlist);
    await this.saveData(data);
    await this.render();
    return watchlist;
  },

  async deleteWatchlist(id) {
    const data = await this.getData();
    data.watchlists = data.watchlists.filter(w => w.id !== id);
    await this.saveData(data);
    await this.render();
  },

  async addStock(watchlistId, stock) {
    const data = await this.getData();
    const watchlist = data.watchlists.find(w => w.id === watchlistId);
    if (watchlist) {
      if (!watchlist.stocks.find(s => s.symbol === stock.symbol)) {
        watchlist.stocks.push({
          ...stock,
          addedAt: new Date().toISOString()
        });
        await this.saveData(data);
        await this.render();
      }
    }
  },

  async removeStock(watchlistId, symbol) {
    const data = await this.getData();
    const watchlist = data.watchlists.find(w => w.id === watchlistId);
    if (watchlist) {
      watchlist.stocks = watchlist.stocks.filter(s => s.symbol !== symbol);
      await this.saveData(data);
      await this.render();
    }
  },

  async render() {
    const container = document.getElementById('stock-watchlist-content');
    if (!container) return;

    const data = await this.getData();

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%; overflow: hidden;">
        <div style="display: flex; gap: 6px; margin-bottom: 12px; flex-shrink: 0;">
          <button class="btn btn-primary btn-sm" id="sw-add-watchlist" style="flex: 1; padding: 8px;">+ Watchlist</button>
          <button class="btn btn-secondary btn-sm" id="sw-add-stock" style="flex: 1; padding: 8px;">+ Stock</button>
        </div>
        ${data.watchlists.length === 0 ? `
          <div class="empty-state" style="padding: 20px;">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-text" style="font-size: 12px;">Create a watchlist to track stocks</div>
          </div>
        ` : `
          <div class="nav-tabs" style="margin-bottom: 10px; flex-shrink: 0;">
            ${data.watchlists.map((w, i) => `
              <button class="nav-tab ${i === 0 ? 'active' : ''}" data-watchlist="${w.id}" style="padding: 8px 14px; font-size: 12px;">${this.escapeHtml(w.name)} (${w.stocks.length})</button>
            `).join('')}
          </div>
          <div id="sw-stocks-container" style="flex: 1; overflow-y: auto; overflow-x: hidden; min-height: 0;">
            ${this.renderStocksList(data.watchlists[0])}
          </div>
        `}
      </div>
    `;
  },

  renderStocksList(watchlist) {
    if (!watchlist || watchlist.stocks.length === 0) {
      return '<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 12px;">No stocks in this watchlist</div>';
    }

    return `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px;">
        ${watchlist.stocks.map(stock => `
          <div class="glass-card-flat" style="padding: 10px; position: relative;" data-symbol="${stock.symbol}">
            <button class="btn btn-icon btn-sm sw-remove-stock" style="position: absolute; top: 2px; right: 2px; opacity: 0.5; width: 20px; height: 20px; font-size: 11px; padding: 0;" data-watchlist="${watchlist.id}" data-symbol="${stock.symbol}">×</button>
            <div style="font-weight: 700; font-size: 14px; color: var(--accent-primary); margin-bottom: 2px;">${stock.symbol}</div>
            <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${this.escapeHtml(stock.name || stock.symbol)}
            </div>
            <div style="display: flex; gap: 3px;">
              <a href="${this.getGoogleFinanceUrl(stock.symbol, stock.exchange || 'NASDAQ')}" target="_blank" class="btn btn-sm btn-secondary" style="padding: 3px 6px; font-size: 9px; flex: 1;" title="Google Finance">G</a>
              <a href="${this.getYahooFinanceUrl(stock.symbol)}" target="_blank" class="btn btn-sm btn-secondary" style="padding: 3px 6px; font-size: 9px; flex: 1;" title="Yahoo Finance">Y</a>
              <a href="${this.getRobinhoodUrl(stock.symbol)}" target="_blank" class="btn btn-sm btn-secondary" style="padding: 3px 6px; font-size: 9px; flex: 1;" title="Robinhood">R</a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'sw-add-watchlist') {
        this.showAddWatchlistModal();
      }

      if (e.target.id === 'sw-add-stock') {
        this.showAddStockModal();
      }

      if (e.target.classList.contains('sw-remove-stock')) {
        const watchlistId = e.target.dataset.watchlist;
        const symbol = e.target.dataset.symbol;
        await this.removeStock(watchlistId, symbol);
      }

      // Tab switching
      if (e.target.classList.contains('nav-tab') && e.target.dataset.watchlist) {
        const tabs = e.target.parentElement.querySelectorAll('.nav-tab');
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        const data = await this.getData();
        const watchlist = data.watchlists.find(w => w.id === e.target.dataset.watchlist);
        const container = document.getElementById('sw-stocks-container');
        if (container && watchlist) {
          container.innerHTML = this.renderStocksList(watchlist);
        }
      }
    });
  },

  showAddWatchlistModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'sw-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">📊 New Watchlist</h2>
          <button class="modal-close" data-dismiss="sw-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">Watchlist Name</label>
          <input type="text" class="input" id="sw-name" placeholder="e.g., Tech Stocks">
        </div>
        <button class="btn btn-primary" id="sw-create-btn" style="width: 100%; margin-top: 16px;">Create Watchlist</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="sw-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#sw-create-btn').addEventListener('click', async () => {
      const name = modal.querySelector('#sw-name').value.trim();
      if (name) {
        await this.createWatchlist(name);
        window.showToast?.('Watchlist created!', 'success');
        modal.remove();
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async showAddStockModal() {
    const data = await this.getData();
    if (data.watchlists.length === 0) {
      window.showToast?.('Create a watchlist first', 'error');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'sw-stock-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">📈 Add Stock</h2>
          <button class="modal-close" data-dismiss="sw-stock-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">Stock Symbol</label>
          <input type="text" class="input" id="sw-symbol" placeholder="e.g., AAPL" style="text-transform: uppercase;">
        </div>
        <div class="input-group">
          <label class="input-label">Company Name (optional)</label>
          <input type="text" class="input" id="sw-company" placeholder="e.g., Apple Inc.">
        </div>
        <div class="input-group">
          <label class="input-label">Exchange</label>
          <select class="input" id="sw-exchange">
            <option value="NASDAQ">NASDAQ</option>
            <option value="NYSE">NYSE</option>
            <option value="AMEX">AMEX</option>
            <option value="LSE">LSE</option>
            <option value="TSE">TSE</option>
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Add to Watchlist</label>
          <select class="input" id="sw-watchlist">
            ${data.watchlists.map(w => `<option value="${w.id}">${this.escapeHtml(w.name)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" id="sw-add-stock-btn" style="width: 100%; margin-top: 16px;">Add Stock</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="sw-stock-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#sw-add-stock-btn').addEventListener('click', async () => {
      const symbol = modal.querySelector('#sw-symbol').value.trim().toUpperCase();
      const name = modal.querySelector('#sw-company').value.trim();
      const exchange = modal.querySelector('#sw-exchange').value;
      const watchlistId = modal.querySelector('#sw-watchlist').value;

      if (symbol) {
        await this.addStock(watchlistId, { symbol, name: name || symbol, exchange });
        window.showToast?.(`${symbol} added to watchlist!`, 'success');
        modal.remove();
      }
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

  /**
   * Render expanded view with all watchlists
   */
  async renderExpanded() {
    const container = document.getElementById('stock-watchlist-content');
    if (!container) return;

    const data = await this.getData();
    const totalStocks = data.watchlists.reduce((sum, w) => sum + w.stocks.length, 0);

    container.innerHTML = `
      <div class="expanded-content">
        <div class="expanded-header">
          <div class="expanded-title">
            <span class="expanded-title-icon">📊</span>
            Stock Watchlist
          </div>
          <div class="expanded-stats">
            <div class="expanded-stat">
              <div class="expanded-stat-value">${data.watchlists.length}</div>
              <div class="expanded-stat-label">Watchlists</div>
            </div>
            <div class="expanded-stat">
              <div class="expanded-stat-value">${totalStocks}</div>
              <div class="expanded-stat-label">Total Stocks</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 24px; display: flex; gap: 8px;">
          <button class="btn btn-primary" id="sw-expanded-add-list">+ New Watchlist</button>
          <button class="btn btn-secondary" id="sw-expanded-add-stock">+ Add Stock</button>
        </div>

        <div class="expanded-grid-3">
          ${data.watchlists.length === 0 ? `
            <div class="expanded-section" style="grid-column: span 3; text-align: center; padding: 60px;">
              <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
              <div style="font-size: 16px; color: var(--text-muted);">No watchlists yet. Create one to start tracking stocks!</div>
            </div>
          ` : data.watchlists.map(watchlist => `
            <div class="expanded-section">
              <div class="expanded-section-title">
                <span>📋</span> ${this.escapeHtml(watchlist.name)} (${watchlist.stocks.length})
              </div>
              <ul class="item-list" style="max-height: 350px;">
                ${watchlist.stocks.length === 0 ? `
                  <li style="justify-content: center; color: var(--text-muted);">No stocks in this list</li>
                ` : watchlist.stocks.map(stock => `
                  <li data-symbol="${stock.symbol}" data-list="${watchlist.id}">
                    <div style="flex: 1;">
                      <div style="font-weight: 600; font-size: 16px;">${stock.symbol}</div>
                      <div style="font-size: 11px; color: var(--text-muted);">${stock.exchange || 'NASDAQ'}</div>
                    </div>
                    <div style="display: flex; gap: 4px;">
                      <a href="https://finance.yahoo.com/quote/${stock.symbol}" target="_blank" class="btn btn-sm btn-secondary" title="Yahoo Finance" style="padding: 6px;">📈</a>
                      <a href="https://www.tradingview.com/symbols/${stock.exchange || 'NASDAQ'}-${stock.symbol}/" target="_blank" class="btn btn-sm btn-secondary" title="TradingView" style="padding: 6px;">📊</a>
                      <a href="https://www.google.com/finance/quote/${stock.symbol}:${stock.exchange || 'NASDAQ'}" target="_blank" class="btn btn-sm btn-secondary" title="Google Finance" style="padding: 6px;">🔍</a>
                    </div>
                  </li>
                `).join('')}
              </ul>
              <div style="margin-top: 12px;">
                <button class="btn btn-sm btn-secondary sw-exp-add-to-list" data-list="${watchlist.id}" style="width: 100%;">+ Add Stock to ${this.escapeHtml(watchlist.name)}</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="expanded-section" style="margin-top: 24px;">
          <div class="expanded-section-title">
            <span>🔗</span> Quick Research Links
          </div>
          <div class="expanded-grid-4">
            <a href="https://finance.yahoo.com/markets/" target="_blank" class="stat-card-large" style="text-decoration: none; cursor: pointer;">
              <div class="stat-icon">📈</div>
              <div style="font-size: 14px; font-weight: 600;">Yahoo Finance</div>
              <div class="stat-label">Market Overview</div>
            </a>
            <a href="https://www.tradingview.com/markets/" target="_blank" class="stat-card-large" style="text-decoration: none; cursor: pointer;">
              <div class="stat-icon">📊</div>
              <div style="font-size: 14px; font-weight: 600;">TradingView</div>
              <div class="stat-label">Charts & Analysis</div>
            </a>
            <a href="https://finviz.com/screener.ashx" target="_blank" class="stat-card-large" style="text-decoration: none; cursor: pointer;">
              <div class="stat-icon">🔎</div>
              <div style="font-size: 14px; font-weight: 600;">Finviz</div>
              <div class="stat-label">Stock Screener</div>
            </a>
            <a href="https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent" target="_blank" class="stat-card-large" style="text-decoration: none; cursor: pointer;">
              <div class="stat-icon">📄</div>
              <div style="font-size: 14px; font-weight: 600;">SEC EDGAR</div>
              <div class="stat-label">Company Filings</div>
            </a>
          </div>
        </div>
      </div>
    `;

    // Bind buttons
    const addListBtn = container.querySelector('#sw-expanded-add-list');
    const addStockBtn = container.querySelector('#sw-expanded-add-stock');
    if (addListBtn) addListBtn.onclick = () => this.showAddWatchlistModal();
    if (addStockBtn) addStockBtn.onclick = () => this.showAddStockModal();

    container.querySelectorAll('.sw-exp-add-to-list').forEach(btn => {
      btn.onclick = () => {
        this.showAddStockModal();
        // Pre-select the watchlist in modal after it opens
        setTimeout(() => {
          const select = document.querySelector('#sw-watchlist');
          if (select) select.value = btn.dataset.list;
        }, 100);
      };
    });
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'watchlistId,watchlistName,symbol,name,exchange,addedAt\n';
    data.watchlists.forEach(w => {
      w.stocks.forEach(s => {
        csv += `"${w.id}","${w.name}","${s.symbol}","${(s.name || '').replace(/"/g, '""')}","${s.exchange || ''}","${s.addedAt}"\n`;
      });
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const watchlistsMap = {};

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 6) {
          const [wId, wName, symbol, name, exchange, addedAt] = parts;
          if (!watchlistsMap[wId]) {
            watchlistsMap[wId] = { id: wId, name: wName, createdAt: new Date().toISOString(), stocks: [] };
          }
          watchlistsMap[wId].stocks.push({ symbol, name, exchange, addedAt });
        }
      }

      const watchlists = Object.values(watchlistsMap);
      const data = await this.getData();
      data.watchlists = merge ? [...data.watchlists, ...watchlists] : watchlists;
      await this.saveData(data);
      await this.render();
      return { success: true, count: watchlists.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => StockWatchlist.init());
} else {
  StockWatchlist.init();
}
