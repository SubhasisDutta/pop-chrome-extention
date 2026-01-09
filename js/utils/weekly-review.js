/**
 * Weekly Review Dashboard Utility
 * GTD-style weekly reflection with catalytic questions
 * Hotkey: Alt+W
 */

const WeeklyReview = {
  STORAGE_KEY: 'pop_weekly_review',

  async init() {
    await this.render();
    this.bindEvents();
  },

  async getData() {
    return new Promise((resolve) => {
      chrome.storage.local.get([this.STORAGE_KEY], (result) => {
        resolve(result[this.STORAGE_KEY] || {
          reviews: [],
          questions: [
            'What went well this week?',
            'What could have gone better?',
            'What is the 80/20 of next week?',
            'What am I avoiding?',
            'What would make next week great?'
          ],
          schedule: {
            day: 5,
            hour: 16,
            minute: 0,
            dismissible: true,
            durationMinutes: 15
          },
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

  async saveReview(responses) {
    const data = await this.getData();
    const review = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      responses
    };
    data.reviews.unshift(review);
    data.lastPromptDate = new Date().toISOString().split('T')[0];
    await this.saveData(data);
    await this.render();
    return review;
  },

  async updateSchedule(schedule) {
    const data = await this.getData();
    data.schedule = { ...data.schedule, ...schedule };
    await this.saveData(data);
  },

  getNextReviewDate(data) {
    const now = new Date();
    const targetDay = data.schedule.day;
    const targetHour = data.schedule.hour;
    const targetMinute = data.schedule.minute;

    const next = new Date(now);
    next.setHours(targetHour, targetMinute, 0, 0);

    // Find next occurrence of target day
    const daysUntilTarget = (targetDay - now.getDay() + 7) % 7;
    if (daysUntilTarget === 0 && now > next) {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + daysUntilTarget);
    }

    return next;
  },

  formatTimeUntil(date) {
    const now = new Date();
    const diff = date - now;

    if (diff <= 0) return 'Now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  },

  async render() {
    const container = document.getElementById('weekly-review-content');
    if (!container) return;

    const data = await this.getData();
    const lastReview = data.reviews[0];
    const nextReview = this.getNextReviewDate(data);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    container.innerHTML = `
      <div style="display: flex; gap: 16px; margin-bottom: 16px;">
        <div style="flex: 1; text-align: center; padding: 16px; background: var(--glass-bg); border-radius: 12px;">
          <div style="font-size: 12px; color: var(--text-muted);">Reviews Completed</div>
          <div style="font-size: 32px; font-weight: 700; color: var(--accent-primary);">${data.reviews.length}</div>
        </div>
        <div style="flex: 1; text-align: center; padding: 16px; background: var(--glass-bg); border-radius: 12px;">
          <div style="font-size: 12px; color: var(--text-muted);">Next Review</div>
          <div style="font-size: 18px; font-weight: 600;">${dayNames[data.schedule.day]}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${this.formatTimeUntil(nextReview)}</div>
        </div>
      </div>
      <button class="btn btn-primary btn-sm" id="wr-start-review" style="width: 100%; margin-bottom: 12px;">
        📋 Start Weekly Review
      </button>
      ${lastReview ? `
        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
          Last Review: ${new Date(lastReview.date).toLocaleDateString()}
        </div>
        <div class="glass-card-flat" style="padding: 12px; max-height: 150px; overflow-y: auto;">
          ${Object.entries(lastReview.responses).slice(0, 2).map(([q, a]) => `
            <div style="margin-bottom: 8px;">
              <div style="font-size: 11px; color: var(--text-muted);">${q}</div>
              <div style="font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${this.escapeHtml(a)}
              </div>
            </div>
          `).join('')}
          <button class="btn btn-sm btn-secondary" id="wr-view-last" style="width: 100%; margin-top: 8px;">View Full Review</button>
        </div>
      ` : `
        <div style="text-align: center; padding: 20px; color: var(--text-muted);">
          <div style="font-size: 32px; margin-bottom: 8px;">📋</div>
          <div style="font-size: 13px;">No reviews yet. Start your first one!</div>
        </div>
      `}
      <div style="margin-top: 12px;">
        <button class="btn btn-secondary btn-sm" id="wr-settings" style="width: 100%;">⚙️ Review Settings</button>
      </div>
    `;
  },

  bindEvents() {
    document.addEventListener('click', async (e) => {
      if (e.target.id === 'wr-start-review') {
        this.showReviewModal();
      }

      if (e.target.id === 'wr-view-last') {
        this.showLastReviewModal();
      }

      if (e.target.id === 'wr-settings') {
        this.showSettingsModal();
      }
    });
  },

  async showReviewModal() {
    const data = await this.getData();

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'wr-review-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2 class="modal-title">📋 Weekly Review</h2>
          <button class="modal-close" data-dismiss="wr-review-modal">&times;</button>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">
          Take 15 minutes to reflect on your week. Answer each question thoughtfully.
        </p>
        ${data.questions.map((q, i) => `
          <div class="input-group">
            <label class="input-label">${i + 1}. ${q}</label>
            <textarea class="input wr-response" data-question="${q}" placeholder="Your thoughts..." rows="2"></textarea>
          </div>
        `).join('')}
        <div style="display: flex; gap: 12px; margin-top: 20px;">
          <button class="btn btn-primary" id="wr-save-review" style="flex: 1;">Save Review</button>
          <button class="btn btn-secondary" id="wr-download-review" style="flex: 1;">📥 Download as Text</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add close button listener
    modal.querySelector('[data-dismiss="wr-review-modal"]').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#wr-save-review').addEventListener('click', async () => {
      const responses = {};
      modal.querySelectorAll('.wr-response').forEach(ta => {
        responses[ta.dataset.question] = ta.value.trim();
      });

      if (Object.values(responses).every(v => !v)) {
        window.showToast?.('Please answer at least one question', 'error');
        return;
      }

      await this.saveReview(responses);
      window.showToast?.('Review saved!', 'success');
      modal.remove();
    });

    modal.querySelector('#wr-download-review').addEventListener('click', () => {
      const responses = {};
      modal.querySelectorAll('.wr-response').forEach(ta => {
        responses[ta.dataset.question] = ta.value.trim();
      });

      let text = `Weekly Review - ${new Date().toLocaleDateString()}\n${'='.repeat(40)}\n\n`;
      Object.entries(responses).forEach(([q, a]) => {
        text += `${q}\n${'-'.repeat(q.length)}\n${a || '(No response)'}\n\n`;
      });

      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-review-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async showLastReviewModal() {
    const data = await this.getData();
    const lastReview = data.reviews[0];
    if (!lastReview) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'wr-last-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px;">
        <div class="modal-header">
          <h2 class="modal-title">📋 Review from ${new Date(lastReview.date).toLocaleDateString()}</h2>
          <button class="modal-close" data-dismiss="wr-last-modal">&times;</button>
        </div>
        ${Object.entries(lastReview.responses).map(([q, a]) => `
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 600; color: var(--accent-primary); margin-bottom: 4px;">${q}</div>
            <div style="font-size: 14px; color: var(--text-secondary); padding: 12px; background: var(--glass-bg); border-radius: 8px;">
              ${this.escapeHtml(a) || '<em style="color: var(--text-muted);">No response</em>'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    document.body.appendChild(modal);

    // Add close button listener
    modal.querySelector('[data-dismiss="wr-last-modal"]').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  },

  async showSettingsModal() {
    const data = await this.getData();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'wr-settings-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">⚙️ Review Settings</h2>
          <button class="modal-close" data-dismiss="wr-settings-modal">&times;</button>
        </div>
        <div class="input-group">
          <label class="input-label">Review Day</label>
          <select class="input" id="wr-day">
            ${dayNames.map((d, i) => `<option value="${i}" ${i === data.schedule.day ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </div>
        <div class="input-group">
          <label class="input-label">Review Time</label>
          <input type="time" class="input" id="wr-time" value="${String(data.schedule.hour).padStart(2, '0')}:${String(data.schedule.minute).padStart(2, '0')}">
        </div>
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 16px;">
          <label class="toggle-switch">
            <input type="checkbox" id="wr-dismissible" ${data.schedule.dismissible ? 'checked' : ''}>
            <span class="toggle-slider-input"></span>
          </label>
          <span style="font-size: 14px; color: var(--text-secondary);">Allow dismissing/rescheduling</span>
        </div>
        <button class="btn btn-primary" id="wr-save-settings" style="width: 100%; margin-top: 20px;">Save Settings</button>
      </div>
    `;
    document.body.appendChild(modal);

    // Add close button listener
    modal.querySelector('[data-dismiss="wr-settings-modal"]').addEventListener('click', () => {
      modal.remove();
    });

    modal.querySelector('#wr-save-settings').addEventListener('click', async () => {
      const day = parseInt(modal.querySelector('#wr-day').value);
      const [hour, minute] = modal.querySelector('#wr-time').value.split(':').map(Number);
      const dismissible = modal.querySelector('#wr-dismissible').checked;

      await this.updateSchedule({ day, hour, minute, dismissible });
      window.showToast?.('Settings saved!', 'success');
      modal.remove();
      await this.render();
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

  /**
   * Render expanded view with all reviews
   */
  async renderExpanded() {
    const container = document.getElementById('weekly-review-content');
    if (!container) return;

    const data = await this.getData();
    const lastReview = data.reviews[0];
    const nextReview = this.getNextReviewDate(data);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    container.innerHTML = `
      <div class="expanded-content">
        <div class="expanded-header">
          <div class="expanded-title"><span class="expanded-title-icon">📋</span>Weekly Review</div>
          <div class="expanded-stats">
            <div class="expanded-stat"><div class="expanded-stat-value">${data.reviews.length}</div><div class="expanded-stat-label">Reviews</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value">${dayNames[data.schedule.day]}</div><div class="expanded-stat-label">Review Day</div></div>
            <div class="expanded-stat"><div class="expanded-stat-value">${this.formatTimeUntil(nextReview)}</div><div class="expanded-stat-label">Next Review</div></div>
          </div>
        </div>

        <div style="margin-bottom: 24px; display: flex; gap: 8px;">
          <button class="btn btn-primary" id="wr-exp-start">📋 Start Weekly Review</button>
          <button class="btn btn-secondary" id="wr-exp-settings">⚙️ Settings</button>
        </div>

        <div class="expanded-grid-2" style="margin-bottom: 24px;">
          <div class="expanded-section">
            <div class="expanded-section-title"><span>❓</span> Review Questions (${data.questions.length})</div>
            <ul class="item-list">
              ${data.questions.map((q, i) => `<li><span style="font-weight: 600; color: var(--accent-primary);">${i + 1}.</span><span style="margin-left: 8px;">${q}</span></li>`).join('')}
            </ul>
          </div>

          <div class="expanded-section">
            <div class="expanded-section-title"><span>📅</span> Schedule</div>
            <div style="text-align: center; padding: 24px;">
              <div style="font-size: 48px; margin-bottom: 12px;">📋</div>
              <div style="font-size: 20px; font-weight: 700;">${dayNames[data.schedule.day]}s</div>
              <div style="font-size: 16px; color: var(--text-muted);">at ${String(data.schedule.hour).padStart(2, '0')}:${String(data.schedule.minute).padStart(2, '0')}</div>
              <div style="font-size: 14px; color: var(--accent-primary); margin-top: 12px;">Next: ${nextReview.toLocaleDateString()} (${this.formatTimeUntil(nextReview)})</div>
            </div>
          </div>
        </div>

        <div class="expanded-section">
          <div class="expanded-section-title"><span>📜</span> Past Reviews (${data.reviews.length})</div>
          ${data.reviews.length === 0 ? '<div style="text-align: center; color: var(--text-muted); padding: 40px;">No reviews yet. Start your first one!</div>' : `
            <div class="expanded-list" style="max-height: 400px; overflow-y: auto;">
              ${data.reviews.slice(0, 12).map(review => `
                <div style="background: var(--glass-bg); border-radius: 12px; padding: 16px; margin-bottom: 12px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="font-weight: 600;">📅 ${new Date(review.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  ${Object.entries(review.responses).map(([q, a]) => `
                    <div style="margin-bottom: 8px;">
                      <div style="font-size: 12px; color: var(--accent-primary); font-weight: 500;">${q}</div>
                      <div style="font-size: 13px; color: var(--text-secondary); padding: 8px; background: rgba(0,0,0,0.05); border-radius: 8px; margin-top: 4px;">${this.escapeHtml(a) || '<em style="color: var(--text-muted);">No response</em>'}</div>
                    </div>
                  `).join('')}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    const startBtn = container.querySelector('#wr-exp-start');
    if (startBtn) startBtn.onclick = () => this.showReviewModal();

    const settingsBtn = container.querySelector('#wr-exp-settings');
    if (settingsBtn) settingsBtn.onclick = () => this.showSettingsModal();
  },

  async exportToCSV() {
    const data = await this.getData();
    let csv = 'date,question,response\n';
    data.reviews.forEach(r => {
      Object.entries(r.responses).forEach(([q, a]) => {
        csv += `"${r.date}","${q}","${(a || '').replace(/"/g, '""')}"\n`;
      });
    });
    return csv;
  },

  async importFromCSV(csvContent, merge = false) {
    try {
      const lines = csvContent.trim().split('\n');
      const reviewsMap = {};
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(v => v.replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          const [date, question, response] = parts;
          if (!reviewsMap[date]) {
            reviewsMap[date] = { id: Date.now().toString(36), date, responses: {} };
          }
          reviewsMap[date].responses[question] = response;
        }
      }
      const reviews = Object.values(reviewsMap);
      const data = await this.getData();
      data.reviews = merge ? [...data.reviews, ...reviews] : reviews;
      await this.saveData(data);
      await this.render();
      return { success: true, count: reviews.length };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WeeklyReview.init());
} else {
  WeeklyReview.init();
}
