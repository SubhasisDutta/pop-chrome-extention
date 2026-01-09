/**
 * Question Primer Utility
 * Set core questions before deep work sessions
 * Hotkey: Alt+Q
 */

const QuestionPrimer = {
  STORAGE_KEY: 'pop_question_primer',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          questions: [],
          deepWorkSites: ['github.com', 'docs.google.com', 'notion.so', 'figma.com', 'gitlab.com', 'stackoverflow.com'],
          enabled: true
        });
      });
    });
  },

  async saveData(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [this.STORAGE_KEY]: data }, resolve);
    });
  },

  async addQuestion(question, site) {
    const data = await this.getData();
    const q = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      question,
      site,
      askedAt: new Date().toISOString(),
      answeredAt: null,
      resolved: false
    };
    data.questions.unshift(q);
    await this.saveData(data);
    await this.render();
    return q;
  },

  async resolveQuestion(id) {
    const data = await this.getData();
    const question = data.questions.find(q => q.id === id);
    if (question) {
      question.resolved = !question.resolved;
      question.answeredAt = question.resolved ? new Date().toISOString() : null;
      await this.saveData(data);
      await this.render();
    }
  },

  async deleteQuestion(id) {
    const data = await this.getData();
    data.questions = data.questions.filter(q => q.id !== id);
    await this.saveData(data);
    await this.render();
  },

  findStuckQuestions(questions) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return questions.filter(q => {
      if (q.resolved) return false;
      const askedDate = new Date(q.askedAt);
      return askedDate < threeDaysAgo;
    });
  },

  async render() {
    const container = document.getElementById('question-primer-content');
    if (!container) return;

    const data = await this.getData();
    const activeQuestions = data.questions.filter(q => !q.resolved);
    const stuckQuestions = this.findStuckQuestions(data.questions);
    const resolvedCount = data.questions.filter(q => q.resolved).length;

    container.innerHTML = `
      <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px;">
        <div class="stat-item" style="padding: 10px;">
          <div class="stat-value" style="font-size: 20px;">${activeQuestions.length}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-item" style="padding: 10px;">
          <div class="stat-value" style="font-size: 20px; color: ${stuckQuestions.length > 0 ? 'var(--accent-warning)' : 'var(--accent-success)'};">${stuckQuestions.length}</div>
          <div class="stat-label">Stuck (3d+)</div>
        </div>
        <div class="stat-item" style="padding: 10px;">
          <div class="stat-value" style="font-size: 20px; color: var(--accent-success);">${resolvedCount}</div>
          <div class="stat-label">Resolved</div>
        </div>
      </div>
      ${stuckQuestions.length > 0 ? `
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 10px; padding: 10px; margin-bottom: 12px;">
          <p style="font-size: 12px; color: var(--accent-warning); margin: 0;">
            💡 You have ${stuckQuestions.length} question${stuckQuestions.length > 1 ? 's' : ''} asked 3+ days ago. Consider reframing!
          </p>
        </div>
      ` : ''}
      <button class="btn btn-primary btn-sm" id="qp-add-btn" style="width: 100%; margin-bottom: 12px;">+ Set Core Question</button>
      <ul class="item-list" style="max-height: 180px;">
        ${activeQuestions.slice(0, 5).length === 0 ? `
          <li style="justify-content: center; color: var(--text-muted);">No active questions</li>
        ` : activeQuestions.slice(0, 5).map(q => {
          const isStuck = stuckQuestions.find(sq => sq.id === q.id);
          return `
            <li data-id="${q.id}" style="${isStuck ? 'border-left: 3px solid var(--accent-warning);' : ''}">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  ${this.escapeHtml(q.question)}
                </div>
                <div style="font-size: 10px; color: var(--text-muted);">
                  ${q.site} • ${this.timeAgo(q.askedAt)}
                </div>
              </div>
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-icon btn-sm qp-resolve" style="background: rgba(16, 185, 129, 0.2); color: var(--accent-success); width: 28px; height: 28px;" title="Mark resolved">✓</button>
                <button class="btn btn-icon btn-sm qp-delete" style="opacity: 0.5; width: 28px; height: 28px;">×</button>
              </div>
            </li>
          `;
        }).join('')}
      </ul>
    `;
  },

  timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'qp-add-btn') {
        this.showAddModal();
      }

      if (e.target.classList.contains('qp-resolve')) {
        const li = e.target.closest('li');
        if (li) await this.resolveQuestion(li.dataset.id);
      }

      if (e.target.classList.contains('qp-delete')) {
        const li = e.target.closest('li');
        if (li) await this.deleteQuestion(li.dataset.id);
      }
    });
  },

  async showAddModal() {
    const data = await this.getData();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'qp-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <h2 class="modal-title">❓ Set Core Question</h2>
          <button class="modal-close" data-dismiss="qp-modal">&times;</button>
        </div>
        <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
          Before diving into deep work, clarify what you're trying to answer. This focuses your efforts.
        </p>
        <div class="input-group">
          <label class="input-label">What is the ONE core question you're trying to answer?</label>
          <textarea class="input" id="qp-question" placeholder="e.g., How can I improve the performance of..." rows="3"></textarea>
        </div>
        <div class="input-group">
          <label class="input-label">Related site/context</label>
          <select class="input" id="qp-site">
            ${data.deepWorkSites.map(s => `<option value="${s}">${s}</option>`).join('')}
            <option value="other">Other</option>
          </select>
        </div>
        <button class="btn btn-primary" id="qp-save-btn" style="width: 100%; margin-top: 16px;">Set Question & Focus</button>
      </div>
    `;
    document.body.appendChild(modal);
    // Add close button listener
    modal.querySelector('[data-dismiss="qp-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#qp-save-btn').addEventListener('click', async () => {
      const question = modal.querySelector('#qp-question').value.trim();
      const site = modal.querySelector('#qp-site').value;

      if (!question) {
        window.showToast?.('Please enter a question', 'error');
        return;
      }

      await this.addQuestion(question, site);
      window.showToast?.('Question set! Stay focused.', 'success');
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
    let csv = 'id,question,site,askedAt,answeredAt,resolved\n';
    data.questions.forEach(q => {
      csv += `"${q.id}","${q.question.replace(/"/g, '""')}","${q.site}","${q.askedAt}","${q.answeredAt || ''}",${q.resolved}\n`;
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const questions = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 6) {
          questions.push({
            id: parts[0], question: parts[1], site: parts[2],
            askedAt: parts[3], answeredAt: parts[4] || null, resolved: parts[5] === 'true'
          });
        }
      }
      const data = await this.getData();
      data.questions = merge ? [...data.questions, ...questions] : questions;
      await this.saveData(data);
      await this.render();
      return { success: true, count: questions.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => QuestionPrimer.init());
} else {
  QuestionPrimer.init();
}
