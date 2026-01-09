/**
 * Daily Negotiator Utility (Rule 2)
 * Morning planner with balance between hard tasks and rewards
 * Hotkey: Alt+D
 */

const DailyNegotiator = {
  STORAGE_KEY: 'pop_daily_negotiator',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          plans: [],
          lastPromptDate: null
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

  async getTodayPlan() {
    const data = await this.getData();
    const today = this.getTodayKey();
    return data.plans.find(p => p.date.startsWith(today));
  },

  async createTodayPlan(idealDay) {
    const data = await this.getData();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plan = {
      id: Date.now().toString(36),
      date: today.toISOString(),
      idealDay,
      tasks: []
    };

    data.plans.unshift(plan);
    data.lastPromptDate = this.getTodayKey();
    await this.saveData(data);
    await this.render();
    return plan;
  },

  async addTask(text, isHard = false, isReward = false) {
    const data = await this.getData();
    const todayKey = this.getTodayKey();
    let plan = data.plans.find(p => p.date.startsWith(todayKey));

    if (!plan) {
      plan = await this.createTodayPlan('A productive day');
      data.plans.unshift(plan);
    }

    const task = {
      id: Date.now().toString(36),
      text,
      isHard,
      reward: isReward,
      completed: false,
      order: plan.tasks.length
    };

    plan.tasks.push(task);
    await this.saveData(data);
    await this.render();
    return task;
  },

  async toggleTask(taskId) {
    const data = await this.getData();
    const todayKey = this.getTodayKey();
    const plan = data.plans.find(p => p.date.startsWith(todayKey));
    if (plan) {
      const task = plan.tasks.find(t => t.id === taskId);
      if (task) {
        task.completed = !task.completed;
        await this.saveData(data);
        await this.render();
      }
    }
  },

  async deleteTask(taskId) {
    const data = await this.getData();
    const todayKey = this.getTodayKey();
    const plan = data.plans.find(p => p.date.startsWith(todayKey));
    if (plan) {
      plan.tasks = plan.tasks.filter(t => t.id !== taskId);
      await this.saveData(data);
      await this.render();
    }
  },

  async render() {
    const container = document.getElementById('daily-negotiator-content');
    if (!container) return;

    const plan = await this.getTodayPlan();
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (!plan) {
      container.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 40px; margin-bottom: 12px;">☀️</div>
          <h3 style="margin-bottom: 8px;">Good Morning!</h3>
          <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">
            ${today}
          </p>
          <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 20px; font-style: italic;">
            "What does a day look like that would make you want to wake up tomorrow?"
          </p>
          <button class="btn btn-primary" id="dn-start-planning">Start Planning Your Day</button>
        </div>
      `;
      return;
    }

    const hardTasks = plan.tasks.filter(t => t.isHard && !t.reward);
    const rewardTasks = plan.tasks.filter(t => t.reward);
    const completedCount = plan.tasks.filter(t => t.completed).length;
    const progress = plan.tasks.length > 0 ? Math.round((completedCount / plan.tasks.length) * 100) : 0;

    container.innerHTML = `
      <div style="margin-bottom: 12px;">
        <div style="font-size: 12px; color: var(--text-muted);">${today}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 8px 0;">
          <span style="font-size: 14px;">Progress</span>
          <span style="font-weight: 600;">${progress}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill success" style="width: ${progress}%;"></div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
        <span>⚡ Hard: ${hardTasks.length}</span>
        <span>🎁 Rewards: ${rewardTasks.length}</span>
        ${hardTasks.length > rewardTasks.length ? '<span style="color: var(--accent-warning);">⚠️ Add rewards!</span>' : ''}
      </div>
      <button class="btn btn-sm btn-primary" id="dn-add-task" style="width: 100%; margin-bottom: 12px;">+ Add Task</button>
      <ul class="item-list" style="max-height: 280px;">
        ${plan.tasks.length === 0 ? `
          <li style="justify-content: center; color: var(--text-muted);">No tasks planned yet</li>
        ` : plan.tasks.map(task => `
          <li data-id="${task.id}" style="${task.completed ? 'opacity: 0.5;' : ''}">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <input type="checkbox" class="dn-checkbox" ${task.completed ? 'checked' : ''}>
              <span style="font-size: 14px;">${task.reward ? '🎁' : task.isHard ? '⚡' : '📝'}</span>
              <span style="flex: 1; font-size: 13px; ${task.completed ? 'text-decoration: line-through;' : ''}">
                ${this.escapeHtml(task.text)}
              </span>
            </div>
            <button class="btn btn-icon btn-sm dn-delete" style="opacity: 0.5; width: 24px; height: 24px;">×</button>
          </li>
        `).join('')}
      </ul>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'dn-start-planning') {
        this.showPlanningModal();
      }

      if (e.target.id === 'dn-add-task') {
        this.showAddTaskModal();
      }

      if (e.target.classList.contains('dn-delete')) {
        const li = e.target.closest('li');
        if (li) await this.deleteTask(li.dataset.id);
      }
    });

    document.addEventListener('change', async (e) => {
      if (e.target.classList.contains('dn-checkbox')) {
        const li = e.target.closest('li');
        if (li) await this.toggleTask(li.dataset.id);
      }
    });
  },

  showPlanningModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'dn-plan-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title">☀️ Plan Your Day</h2>
          <button class="modal-close" data-dismiss="dn-plan-modal">&times;</button>
        </div>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
          Treat yourself like someone you are responsible for helping. What would make today meaningful?
        </p>
        <div class="input-group">
          <label class="input-label">Describe your ideal day</label>
          <textarea class="input" id="dn-ideal-day" placeholder="A day where I..." rows="3"></textarea>
        </div>
        <button class="btn btn-primary" id="dn-create-plan" style="width: 100%; margin-top: 16px;">Start Day</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="dn-plan-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#dn-create-plan').addEventListener('click', async () => {
      const idealDay = modal.querySelector('#dn-ideal-day').value.trim() || 'A meaningful and productive day';
      await this.createTodayPlan(idealDay);
      window.showToast?.('Day plan created! Add your tasks.', 'success');
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async showAddTaskModal() {
    const plan = await this.getTodayPlan();
    const hardTasks = plan?.tasks.filter(t => t.isHard && !t.reward).length || 0;
    const rewardTasks = plan?.tasks.filter(t => t.reward).length || 0;
    const needsReward = hardTasks > rewardTasks;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'dn-task-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 450px;">
        <div class="modal-header">
          <h2 class="modal-title">📝 Add Task</h2>
          <button class="modal-close" data-dismiss="dn-task-modal">&times;</button>
        </div>
        ${needsReward ? `
          <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 12px; margin-bottom: 16px;">
            <p style="font-size: 13px; color: var(--accent-warning);">
              🎁 You have more hard tasks than rewards. Consider adding a reward to balance your day!
            </p>
          </div>
        ` : ''}
        <div class="input-group">
          <label class="input-label">Task</label>
          <input type="text" class="input" id="dn-task-text" placeholder="What do you need to do?">
        </div>
        <div class="input-group">
          <label class="input-label">Type</label>
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <label style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; background: var(--glass-bg); border-radius: 10px; cursor: pointer; border: 2px solid transparent;" class="dn-type-option">
              <input type="radio" name="dn-type" value="normal" checked style="display: none;">
              <span style="font-size: 24px;">📝</span>
              <span style="font-size: 12px; margin-top: 4px;">Regular</span>
            </label>
            <label style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; background: var(--glass-bg); border-radius: 10px; cursor: pointer; border: 2px solid transparent;" class="dn-type-option">
              <input type="radio" name="dn-type" value="hard" style="display: none;">
              <span style="font-size: 24px;">⚡</span>
              <span style="font-size: 12px; margin-top: 4px;">Hard Task</span>
            </label>
            <label style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16px; background: var(--glass-bg); border-radius: 10px; cursor: pointer; border: 2px solid transparent;" class="dn-type-option ${needsReward ? 'recommended' : ''}">
              <input type="radio" name="dn-type" value="reward" style="display: none;">
              <span style="font-size: 24px;">🎁</span>
              <span style="font-size: 12px; margin-top: 4px;">Reward</span>
            </label>
          </div>
        </div>
        <button class="btn btn-primary" id="dn-save-task" style="width: 100%; margin-top: 16px;">Add to Day</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="dn-task-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    // Type selection styling
    modal.querySelectorAll('.dn-type-option').forEach(opt => {
      opt.addEventListener('click', () => {
        modal.querySelectorAll('.dn-type-option').forEach(o => o.style.borderColor = 'transparent');
        opt.style.borderColor = 'var(--accent-primary)';
      });
    });

    modal.querySelector('#dn-save-task').addEventListener('click', async () => {
      const text = modal.querySelector('#dn-task-text').value.trim();
      const type = modal.querySelector('input[name="dn-type"]:checked').value;

      if (!text) {
        window.showToast?.('Please enter a task', 'error');
        return;
      }

      await this.addTask(text, type === 'hard', type === 'reward');
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
    let csv = 'planDate,idealDay,taskId,taskText,isHard,isReward,completed\n';
    data.plans.forEach(p => {
      p.tasks.forEach(t => {
        csv += `"${p.date}","${(p.idealDay || '').replace(/"/g, '""')}","${t.id}","${t.text.replace(/"/g, '""')}",${t.isHard},${t.reward},${t.completed}\n`;
      });
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const plansMap = {};
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 7) {
          const [date, idealDay, taskId, taskText, isHard, isReward, completed] = parts;
          if (!plansMap[date]) {
            plansMap[date] = { id: Date.now().toString(36), date, idealDay, tasks: [] };
          }
          plansMap[date].tasks.push({
            id: taskId, text: taskText, isHard: isHard === 'true',
            reward: isReward === 'true', completed: completed === 'true'
          });
        }
      }
      const data = await this.getData();
      data.plans = merge ? [...data.plans, ...Object.values(plansMap)] : Object.values(plansMap);
      await this.saveData(data);
      await this.render();
      return { success: true, count: Object.keys(plansMap).length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => DailyNegotiator.init());
} else {
  DailyNegotiator.init();
}
