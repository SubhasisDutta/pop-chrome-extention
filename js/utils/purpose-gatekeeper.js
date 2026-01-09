/**
 * Purpose Gatekeeper Utility
 * Link tasks to higher-level "Why" purposes
 * Hotkey: Alt+G
 */

const PurposeGatekeeper = {
  STORAGE_KEY: 'pop_purpose_gatekeeper',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          purposes: [],
          tasks: []
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async addPurpose(purpose) {
    const data = await this.getData();
    purpose.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    data.purposes.push(purpose);
    await this.saveData(data);
    await this.render();
    return purpose;
  },

  async addTask(task) {
    const data = await this.getData();
    task.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    task.createdAt = new Date().toISOString();
    task.completed = false;
    data.tasks.unshift(task);
    await this.saveData(data);
    await this.render();
    return task;
  },

  async toggleTask(id) {
    const data = await this.getData();
    const task = data.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      await this.saveData(data);
      await this.render();
    }
  },

  async deleteTask(id) {
    const data = await this.getData();
    data.tasks = data.tasks.filter(t => t.id !== id);
    await this.saveData(data);
    await this.render();
  },

  async render() {
    const container = document.getElementById('purpose-gatekeeper-content');
    if (!container) return;

    const data = await this.getData();
    const activeTasks = data.tasks.filter(t => !t.completed);
    const autonomousTasks = activeTasks.filter(t => t.autonomy === 'choose').length;
    const controlledTasks = activeTasks.filter(t => t.autonomy === 'have').length;
    const total = autonomousTasks + controlledTasks;
    const autonomyPercent = total > 0 ? Math.round((autonomousTasks / total) * 100) : 0;

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px; color: var(--text-muted);">Autonomy Score</span>
          <span style="font-size: 14px; font-weight: 600; color: ${autonomyPercent >= 50 ? 'var(--accent-success)' : 'var(--accent-warning)'};">${autonomyPercent}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${autonomyPercent >= 50 ? 'success' : 'warning'}" style="width: ${autonomyPercent}%;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); margin-top: 4px;">
          <span>🎯 Choose: ${autonomousTasks}</span>
          <span>⚡ Have to: ${controlledTasks}</span>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="pg-add-task" style="width: 100%; margin-bottom: 12px;">+ Add Task with Purpose</button>
      <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Active Tasks</div>
      <ul class="item-list" style="max-height: 180px;">
        ${activeTasks.slice(0, 5).length === 0 ? `
          <li style="justify-content: center; color: var(--text-muted);">No tasks yet. Add one with a purpose!</li>
        ` : activeTasks.slice(0, 5).map(task => {
          const purpose = data.purposes.find(p => p.id === task.purposeId);
          return `
            <li data-id="${task.id}">
              <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0;">
                <input type="checkbox" class="pg-checkbox" ${task.completed ? 'checked' : ''}>
                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${purpose?.color || 'var(--text-muted)'}; flex-shrink: 0;"></div>
                <div style="flex: 1; min-width: 0;">
                  <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px;">
                    ${this.escapeHtml(task.text)}
                  </div>
                  <div style="font-size: 10px; color: var(--text-muted);">
                    ${purpose?.name || 'No purpose'} • ${task.autonomy === 'choose' ? '🎯 Choose' : '⚡ Have to'}
                  </div>
                </div>
              </div>
              <button class="btn btn-icon btn-sm pg-delete" style="opacity: 0.5; width: 24px; height: 24px;">×</button>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'pg-add-task') {
        this.showAddTaskModal();
      }

      if (e.target.classList.contains('pg-delete')) {
        const li = e.target.closest('li');
        if (li) await this.deleteTask(li.dataset.id);
      }
    });

    document.addEventListener('change', async (e) => {
      if (e.target.classList.contains('pg-checkbox')) {
        const li = e.target.closest('li');
        if (li) await this.toggleTask(li.dataset.id);
      }
    });
  },

  async showAddTaskModal() {
    const data = await this.getData();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'pg-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 450px;">
        <div class="modal-header">
          <h2 class="modal-title">🎯 Add Task with Purpose</h2>
          <button class="modal-close" data-dismiss="pg-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">What do you want to do?</label>
          <input type="text" class="input" id="pg-task-text" placeholder="Enter your task...">
        </div>
        <div class="input-group">
          <label class="input-label">Why? Link to a purpose</label>
          <select class="input" id="pg-purpose">
            <option value="">Select a purpose...</option>
            ${data.purposes.map(p => `<option value="${p.id}" style="color: ${p.color};">${this.escapeHtml(p.name)}</option>`).join('')}
            <option value="new">+ Create new purpose</option>
          </select>
        </div>
        <div id="pg-new-purpose-fields" style="display: none;">
          <div class="input-group">
            <label class="input-label">New Purpose Name</label>
            <input type="text" class="input" id="pg-new-purpose-name" placeholder="e.g., Career Growth">
          </div>
          <div class="input-group">
            <label class="input-label">Color</label>
            <input type="color" class="input" id="pg-new-purpose-color" value="#667eea" style="height: 40px; padding: 4px;">
          </div>
        </div>
        <div class="input-group">
          <label class="input-label">Are you doing this because you...</label>
          <div style="display: flex; gap: 12px; margin-top: 8px;">
            <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--glass-bg); border-radius: 10px; cursor: pointer; border: 2px solid transparent;" class="pg-autonomy-option" data-value="choose">
              <input type="radio" name="pg-autonomy" value="choose" checked>
              <div>
                <div style="font-weight: 600;">🎯 Choose to</div>
                <div style="font-size: 11px; color: var(--text-muted);">I want to do this</div>
              </div>
            </label>
            <label style="flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px; background: var(--glass-bg); border-radius: 10px; cursor: pointer; border: 2px solid transparent;" class="pg-autonomy-option" data-value="have">
              <input type="radio" name="pg-autonomy" value="have">
              <div>
                <div style="font-weight: 600;">⚡ Have to</div>
                <div style="font-size: 11px; color: var(--text-muted);">I must do this</div>
              </div>
            </label>
          </div>
        </div>
        <button class="btn btn-primary" id="pg-save-btn" style="width: 100%; margin-top: 16px;">Add Task</button>
        <p id="pg-challenge" style="display: none; text-align: center; margin-top: 12px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 10px; color: var(--accent-danger); font-size: 13px;">
          ⚠️ You haven't linked this to a purpose. If it doesn't serve a higher goal, consider deleting it.
        </p>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="pg-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    const purposeSelect = modal.querySelector('#pg-purpose');
    const newPurposeFields = modal.querySelector('#pg-new-purpose-fields');
    const challengeText = modal.querySelector('#pg-challenge');

    purposeSelect.addEventListener('change', () => {
      if (purposeSelect.value === 'new') {
        newPurposeFields.style.display = 'block';
      } else {
        newPurposeFields.style.display = 'none';
      }
      challengeText.style.display = !purposeSelect.value ? 'block' : 'none';
    });

    modal.querySelector('#pg-save-btn').addEventListener('click', async () => {
      const text = modal.querySelector('#pg-task-text').value.trim();
      let purposeId = purposeSelect.value;
      const autonomy = modal.querySelector('input[name="pg-autonomy"]:checked').value;

      if (!text) {
        window.showToast?.('Please enter a task', 'error');
        return;
      }

      // Create new purpose if needed
      if (purposeId === 'new') {
        const name = modal.querySelector('#pg-new-purpose-name').value.trim();
        const color = modal.querySelector('#pg-new-purpose-color').value;
        if (name) {
          const newPurpose = await this.addPurpose({ name, color, description: '' });
          purposeId = newPurpose.id;
        } else {
          purposeId = '';
        }
      }

      await this.addTask({ text, purposeId, autonomy });
      window.showToast?.('Task added!', 'success');
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
    let csv = 'id,text,purposeId,purposeName,autonomy,completed,createdAt\n';
    data.tasks.forEach(t => {
      const purpose = data.purposes.find(p => p.id === t.purposeId);
      csv += `"${t.id}","${t.text.replace(/"/g, '""')}","${t.purposeId || ''}","${purpose?.name || ''}","${t.autonomy}",${t.completed},"${t.createdAt}"\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const tasks = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 7) {
          tasks.push({
            id: parts[0], text: parts[1], purposeId: parts[2],
            autonomy: parts[4], completed: parts[5] === 'true', createdAt: parts[6]
          });
        }
      }
      const data = await this.getData();
      data.tasks = merge ? [...data.tasks, ...tasks] : tasks;
      await this.saveData(data);
      await this.render();
      return { success: true, count: tasks.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PurposeGatekeeper.init());
} else {
  PurposeGatekeeper.init();
}
