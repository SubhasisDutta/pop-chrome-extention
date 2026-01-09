/**
 * Month Cash Flow Utility
 * Track income and expenses
 * Hotkey: Alt+M
 */

const CashFlow = {
  STORAGE_KEY: 'pop_cash_flow',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          transactions: [],
          categories: {
            income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'],
            expense: ['Rent', 'Utilities', 'Groceries', 'Transportation', 'Entertainment', 'Dining', 'Healthcare', 'Shopping', 'Other']
          }
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async addTransaction(transaction) {
    const data = await this.getData();
    transaction.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    transaction.date = transaction.date || new Date().toISOString();
    data.transactions.unshift(transaction);
    await this.saveData(data);
    await this.render();
    return transaction;
  },

  async deleteTransaction(id) {
    const data = await this.getData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    await this.saveData(data);
    await this.render();
  },

  getCurrentMonthData(transactions) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  },

  async render() {
    const container = document.getElementById('cash-flow-content');
    if (!container) return;

    const data = await this.getData();
    const monthTransactions = this.getCurrentMonthData(data.transactions);

    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = totalIncome - totalExpense;
    const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">${monthName}</div>
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-item" style="padding: 12px;">
            <div class="stat-value" style="font-size: 18px; color: var(--accent-success);">$${totalIncome.toLocaleString()}</div>
            <div class="stat-label">Income</div>
          </div>
          <div class="stat-item" style="padding: 12px;">
            <div class="stat-value" style="font-size: 18px; color: var(--accent-danger);">$${totalExpense.toLocaleString()}</div>
            <div class="stat-label">Expenses</div>
          </div>
          <div class="stat-item" style="padding: 12px;">
            <div class="stat-value" style="font-size: 18px; color: ${balance >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)'};">
              ${balance >= 0 ? '+' : ''}$${balance.toLocaleString()}
            </div>
            <div class="stat-label">Balance</div>
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="cf-add-btn" style="width: 100%; margin-bottom: 12px;">
        + Add Transaction
      </button>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Recent Transactions</div>
      <ul class="item-list" style="max-height: 150px;">
        ${monthTransactions.slice(0, 5).length === 0 ? `
          <li style="justify-content: center; color: var(--text-muted);">
            No transactions this month
          </li>
        ` : monthTransactions.slice(0, 5).map(t => `
          <li data-id="${t.id}">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
              <span style="font-size: 16px;">${t.type === 'income' ? '💵' : '💸'}</span>
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${this.escapeHtml(t.description || t.category)}
                </div>
                <div style="font-size: 11px; color: var(--text-muted);">${t.category}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 600; color: ${t.type === 'income' ? 'var(--accent-success)' : 'var(--accent-danger)'};">
                ${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString()}
              </div>
              <div style="font-size: 10px; color: var(--text-muted);">
                ${new Date(t.date).toLocaleDateString()}
              </div>
            </div>
          </li>
        `).join('')}
      </ul>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'cf-add-btn') {
        this.showAddModal();
      }
    });
  },

  async showAddModal() {
    const data = await this.getData();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'cf-add-modal';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">💰 Add Transaction</h2>
          <button class="modal-close" data-dismiss="cf-add-modal">&times;</button>
        </div>
        <div class="nav-tabs" style="margin-bottom: 16px;">
          <button class="nav-tab active" data-type="expense">💸 Expense</button>
          <button class="nav-tab" data-type="income">💵 Income</button>
        </div>
        <div class="input-group">
          <label class="input-label">Amount ($)</label>
          <input type="number" class="input" id="cf-amount" placeholder="0.00" step="0.01" min="0">
        </div>
        <div class="input-group">
          <label class="input-label">Category</label>
          <select class="input" id="cf-category">
            ${data.categories.expense.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Description (optional)</label>
          <input type="text" class="input" id="cf-description" placeholder="What was this for?">
        </div>
        <div class="input-group">
          <label class="input-label">Date</label>
          <input type="date" class="input" id="cf-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <button class="btn btn-primary" id="cf-save-btn" style="width: 100%; margin-top: 16px;">Save Transaction</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Add close button listener
    modal.querySelector('[data-dismiss="cf-add-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    let currentType = 'expense';

    // Type tabs
    modal.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        modal.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentType = tab.dataset.type;
        const select = modal.querySelector('#cf-category');
        select.innerHTML = data.categories[currentType].map(c => `<option value="${c}">${c}</option>`).join('');
      });
    });

    // Save
    modal.querySelector('#cf-save-btn').addEventListener('click', async () => {
      const amount = modal.querySelector('#cf-amount').value;
      const category = modal.querySelector('#cf-category').value;
      const description = modal.querySelector('#cf-description').value;
      const date = modal.querySelector('#cf-date').value;

      if (!amount || parseFloat(amount) <= 0) {
        window.showToast?.('Please enter a valid amount', 'error');
        return;
      }

      await this.addTransaction({
        type: currentType,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(date).toISOString()
      });

      window.showToast?.('Transaction added!', 'success');
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
    let csv = 'id,date,type,category,description,amount\n';
    data.transactions.forEach(t => {
      csv += `"${t.id}","${t.date}","${t.type}","${t.category}","${(t.description || '').replace(/"/g, '""')}",${t.amount}\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) throw new Error('Invalid CSV');

      const transactions = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = this.parseCSVLine(lines[i]);
        if (parts.length >= 6) {
          transactions.push({
            id: parts[0] || Date.now().toString(36),
            date: parts[1],
            type: parts[2],
            category: parts[3],
            description: parts[4],
            amount: parseFloat(parts[5])
          });
        }
      }

      const data = await this.getData();
      if (merge) {
        data.transactions = [...data.transactions, ...transactions];
      } else {
        data.transactions = transactions;
      }
      await this.saveData(data);
      await this.render();
      return { success: true, count: transactions.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"' && line[i + 1] === '"') {
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
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => CashFlow.init());
} else {
  CashFlow.init();
}
