/**
 * POP Content Script
 * Injects overlays and widgets into web pages
 */

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.POPContentLoaded) return;
  window.POPContentLoaded = true;

  // Quick Capture Overlay
  function showQuickCapture() {
    if (document.getElementById('pop-quick-capture-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'pop-quick-capture-overlay';
    overlay.className = 'pop-quick-capture-overlay';
    overlay.innerHTML = `
      <div class="pop-quick-capture-modal">
        <div class="pop-quick-capture-title">Quick Capture</div>
        <input type="text" class="pop-quick-capture-input" id="pop-capture-input" placeholder="What's on your mind?" autofocus>
        <div class="pop-quick-capture-tags">
          <button class="pop-quick-capture-tag actionable" data-type="actionable">✓ Actionable</button>
          <button class="pop-quick-capture-tag reference" data-type="reference">📚 Reference</button>
        </div>
        <div class="pop-quick-capture-hint">Press Enter to save as Actionable, or click a tag</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });

    const input = overlay.querySelector('#pop-capture-input');
    input.focus();

    // Tag selection
    let selectedType = null;
    overlay.querySelectorAll('.pop-quick-capture-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        overlay.querySelectorAll('.pop-quick-capture-tag').forEach(t => t.classList.remove('selected'));
        tag.classList.add('selected');
        selectedType = tag.dataset.type;
        saveAndClose();
      });
    });

    // Save and close
    function saveAndClose() {
      const text = input.value.trim();
      if (!text) {
        closeOverlay();
        return;
      }

      chrome.runtime.sendMessage({
        action: 'saveThought',
        text,
        type: selectedType || 'actionable'
      }, (response) => {
        if (response && response.success) {
          showToast('Thought captured!', 'success');
        }
        closeOverlay();
      });
    }

    // Close overlay
    function closeOverlay() {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 200);
    }

    // Event listeners
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        selectedType = 'actionable';
        saveAndClose();
      }
      if (e.key === 'Escape') {
        closeOverlay();
      }
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });
  }

  // Flow Check Widget
  function showFlowCheck() {
    if (document.getElementById('pop-flow-widget')) {
      const panel = document.querySelector('.pop-flow-panel');
      if (panel) panel.classList.toggle('active');
      return;
    }

    const widget = document.createElement('div');
    widget.id = 'pop-flow-widget';
    widget.className = 'pop-flow-widget';
    widget.innerHTML = `
      <button class="pop-flow-btn" title="Flow Check">🌡️</button>
      <div class="pop-flow-panel">
        <h3>Flow State Check</h3>
        <div class="pop-flow-slider-group">
          <div class="pop-flow-slider-label">
            <span>Task Difficulty</span>
            <span id="pop-diff-val">5</span>
          </div>
          <input type="range" class="pop-flow-slider" id="pop-difficulty" min="1" max="10" value="5">
        </div>
        <div class="pop-flow-slider-group">
          <div class="pop-flow-slider-label">
            <span>Your Skill Level</span>
            <span id="pop-skill-val">5</span>
          </div>
          <input type="range" class="pop-flow-slider" id="pop-skill" min="1" max="10" value="5">
        </div>
        <div class="pop-flow-result" id="pop-flow-result">
          🎯 Flow State
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    const btn = widget.querySelector('.pop-flow-btn');
    const panel = widget.querySelector('.pop-flow-panel');
    const diffSlider = widget.querySelector('#pop-difficulty');
    const skillSlider = widget.querySelector('#pop-skill');
    const diffVal = widget.querySelector('#pop-diff-val');
    const skillVal = widget.querySelector('#pop-skill-val');
    const result = widget.querySelector('#pop-flow-result');

    btn.addEventListener('click', () => {
      panel.classList.toggle('active');
    });

    function updateResult() {
      const diff = parseInt(diffSlider.value);
      const skill = parseInt(skillSlider.value);
      diffVal.textContent = diff;
      skillVal.textContent = skill;

      const delta = diff - skill;
      result.className = 'pop-flow-result';

      if (delta > 2) {
        result.classList.add('anxiety');
        result.textContent = '😰 Anxiety Zone - Break it down!';
      } else if (delta < -2) {
        result.classList.add('boredom');
        result.textContent = '😴 Boredom Zone - Add challenge!';
      } else {
        result.classList.add('flow');
        result.textContent = '🎯 Flow State - Keep going!';
      }
    }

    diffSlider.addEventListener('input', updateResult);
    skillSlider.addEventListener('input', updateResult);
  }

  // Truth Logger Badge
  function showTruthBadge(category, domain) {
    // Remove existing badge
    const existing = document.getElementById('pop-truth-badge');
    if (existing) existing.remove();

    const badge = document.createElement('div');
    badge.id = 'pop-truth-badge';
    badge.className = `pop-truth-badge ${category}`;
    badge.textContent = `${category === 'deep' ? '🎯 Deep Work' : '📧 Shallow'}: ${domain}`;
    document.body.appendChild(badge);

    badge.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openDashboard', hash: 'truth-logger' });
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      badge.style.opacity = '0';
      setTimeout(() => badge.remove(), 300);
    }, 5000);
  }

  // Categorize Site Modal
  function showCategorizeSite(domain) {
    if (document.getElementById('pop-categorize-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'pop-categorize-overlay';
    overlay.className = 'pop-quick-capture-overlay active';
    overlay.innerHTML = `
      <div class="pop-quick-capture-modal" style="text-align: center;">
        <div class="pop-quick-capture-title" style="margin-bottom: 16px;">Categorize: ${domain}</div>
        <p style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 16px;">
          Is this a Deep Work or Shallow site?
        </p>
        <div class="pop-quick-capture-tags">
          <button class="pop-quick-capture-tag actionable" data-category="deep">🎯 Deep Work</button>
          <button class="pop-quick-capture-tag reference" data-category="shallow">📧 Shallow</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.pop-quick-capture-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;
        chrome.runtime.sendMessage({
          action: 'categorizeSite',
          domain,
          category
        }, () => {
          showToast(`${domain} marked as ${category}`, 'success');
          showTruthBadge(category, domain);
          overlay.remove();
        });
      });
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  // Capture Selection Modal
  function showCaptureSelection(text) {
    const overlay = document.createElement('div');
    overlay.className = 'pop-quick-capture-overlay active';
    overlay.innerHTML = `
      <div class="pop-quick-capture-modal">
        <div class="pop-quick-capture-title">Save Selection</div>
        <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 16px; font-size: 13px; max-height: 100px; overflow-y: auto;">
          "${text.substring(0, 200)}${text.length > 200 ? '...' : ''}"
        </div>
        <div class="pop-quick-capture-tags">
          <button class="pop-quick-capture-tag actionable" data-type="actionable">✓ Actionable</button>
          <button class="pop-quick-capture-tag reference" data-type="reference">📚 Reference</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.pop-quick-capture-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        chrome.runtime.sendMessage({
          action: 'saveThought',
          text,
          type: btn.dataset.type
        }, (response) => {
          if (response && response.success) {
            showToast('Selection captured!', 'success');
          }
          overlay.remove();
        });
      });
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.pop-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `pop-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
  }

  // Tab Snoozer Indicator
  let idleTimeout = null;
  function startIdleTracking() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
      showTabSnoozerIndicator();
    }, 5 * 60 * 1000); // 5 minutes
  }

  function showTabSnoozerIndicator() {
    if (document.getElementById('pop-tab-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'pop-tab-indicator';
    indicator.className = 'pop-tab-indicator';
    indicator.innerHTML = `
      <button class="pop-tab-indicator-btn">⏰ Tab Idle</button>
      <div class="pop-tab-menu">
        <button class="pop-tab-menu-item do">✓ Do It (< 2min)</button>
        <button class="pop-tab-menu-item snooze">😴 Snooze for Tomorrow</button>
        <button class="pop-tab-menu-item trash">🗑️ Trash It</button>
      </div>
    `;
    document.body.appendChild(indicator);

    const btn = indicator.querySelector('.pop-tab-indicator-btn');
    const menu = indicator.querySelector('.pop-tab-menu');

    btn.addEventListener('click', () => {
      menu.classList.toggle('active');
    });

    indicator.querySelector('.do').addEventListener('click', () => {
      showToast('Do it now!', 'success');
      indicator.remove();
    });

    indicator.querySelector('.snooze').addEventListener('click', () => {
      // Snooze for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      chrome.runtime.sendMessage({
        action: 'snoozeTab',
        url: window.location.href,
        title: document.title,
        wakeAt: tomorrow.toISOString()
      });

      showToast('Tab snoozed until tomorrow', 'success');
      // Close tab after short delay
      setTimeout(() => window.close(), 1000);
    });

    indicator.querySelector('.trash').addEventListener('click', () => {
      showToast('Moving on!', 'info');
      window.close();
    });
  }

  // Reset idle timer on activity
  ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
    document.addEventListener(event, () => {
      const indicator = document.getElementById('pop-tab-indicator');
      if (indicator) indicator.remove();
      startIdleTracking();
    }, { passive: true });
  });

  // Message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'showQuickCapture':
        showQuickCapture();
        break;
      case 'showFlowCheck':
        showFlowCheck();
        break;
      case 'showTruthBadge':
        showTruthBadge(request.category, request.domain);
        break;
      case 'categorizesite':
        showCategorizeSite(request.domain);
        break;
      case 'captureSelection':
        showCaptureSelection(request.text);
        break;
    }
  });

  // Initialize
  startIdleTracking();

  console.log('POP Content Script loaded');
})();
