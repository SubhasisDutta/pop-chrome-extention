/**
 * Expand Manager
 * Handles expand/minimize functionality for all utilities
 */

const ExpandManager = {
  currentExpanded: null,

  // Utility metadata for sidebar
  utilities: [
    { id: 'cognitiveOffload', bubbleId: 'bubble-cognitive-offload', icon: '💡', name: 'Cognitive' },
    { id: 'cashFlow', bubbleId: 'bubble-cash-flow', icon: '💰', name: 'Cash Flow' },
    { id: 'netWorth', bubbleId: 'bubble-net-worth', icon: '📈', name: 'Net Worth' },
    { id: 'stockWatchlist', bubbleId: 'bubble-stock-watchlist', icon: '📊', name: 'Stocks' },
    { id: 'purposeGatekeeper', bubbleId: 'bubble-purpose-gatekeeper', icon: '🎯', name: 'Purpose' },
    { id: 'dailyNegotiator', bubbleId: 'bubble-daily-negotiator', icon: '☀️', name: 'Daily' },
    { id: 'questionPrimer', bubbleId: 'bubble-question-primer', icon: '❓', name: 'Questions' },
    { id: 'flowThermometer', bubbleId: 'bubble-flow-thermometer', icon: '🌡️', name: 'Flow' },
    { id: 'truthLogger', bubbleId: 'bubble-truth-logger', icon: '⏱️', name: 'Truth' },
    { id: 'tabSnoozer', bubbleId: 'bubble-tab-snoozer', icon: '😴', name: 'Snoozer' },
    { id: 'masteryGraph', bubbleId: 'bubble-mastery-graph', icon: '📉', name: 'Mastery' },
    { id: 'digitalCleaner', bubbleId: 'bubble-digital-cleaner', icon: '🧹', name: 'Cleaner' },
    { id: 'weeklyReview', bubbleId: 'bubble-weekly-review', icon: '📋', name: 'Weekly' },
    { id: 'lifeCalculator', bubbleId: 'bubble-life-calculator', icon: '⏳', name: 'Life Calc' }
  ],

  /**
   * Initialize the expand manager
   */
  init() {
    this.createSidebar();
    this.addExpandButtons();
    this.bindEvents();
  },

  /**
   * Create the sidebar for expanded view navigation
   */
  createSidebar() {
    const mainGrid = document.getElementById('mainGrid');
    if (!mainGrid) return;

    // Create container for sidebar and grid
    const container = document.createElement('div');
    container.className = 'expand-container';
    container.id = 'expandContainer';

    // Create sidebar element
    const sidebar = document.createElement('div');
    sidebar.className = 'expand-sidebar';
    sidebar.id = 'expandSidebar';

    // Grid view button
    sidebar.innerHTML = `
      <div class="sidebar-grid-btn" id="backToGrid" title="Back to Grid View">
        <span class="icon-emoji">⊞</span>
        <span class="icon-label">Grid</span>
      </div>
    `;

    // Add utility icons
    this.utilities.forEach(util => {
      const iconDiv = document.createElement('div');
      iconDiv.className = 'sidebar-icon';
      iconDiv.dataset.utility = util.id;
      iconDiv.dataset.bubbleId = util.bubbleId;
      iconDiv.title = util.name;
      iconDiv.innerHTML = `
        <span class="icon-emoji">${util.icon}</span>
        <span class="icon-label">${util.name}</span>
      `;
      iconDiv.id = `sidebar-icon-${util.id}`;
      sidebar.appendChild(iconDiv);
    });

    // Move grid into container and add sidebar
    mainGrid.parentNode.insertBefore(container, mainGrid);
    container.appendChild(sidebar);
    container.appendChild(mainGrid);
  },

  /**
   * Add expand buttons to all bubble headers
   */
  addExpandButtons() {
    this.utilities.forEach(util => {
      const bubble = document.getElementById(util.bubbleId);
      if (!bubble) return;

      const header = bubble.querySelector('.bubble-header');
      if (!header) return;

      // Check if button already exists
      if (header.querySelector('.bubble-expand-btn')) return;

      const expandBtn = document.createElement('button');
      expandBtn.className = 'bubble-expand-btn';
      expandBtn.dataset.utility = util.id;
      expandBtn.title = 'Expand';
      expandBtn.innerHTML = '⛶';

      header.appendChild(expandBtn);
    });
  },

  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Expand button clicks
    document.addEventListener('click', (e) => {
      // Expand button in bubble header
      if (e.target.classList.contains('bubble-expand-btn')) {
        const utilityId = e.target.dataset.utility;
        if (this.currentExpanded === utilityId) {
          this.collapseAll();
        } else {
          this.expandUtility(utilityId);
        }
      }

      // Sidebar icon clicks
      if (e.target.closest('.sidebar-icon')) {
        const icon = e.target.closest('.sidebar-icon');
        const utilityId = icon.dataset.utility;
        this.expandUtility(utilityId);
      }

      // Back to grid button
      if (e.target.closest('#backToGrid')) {
        this.collapseAll();
      }
    });

    // ESC key to collapse
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.currentExpanded) {
        this.collapseAll();
      }
    });
  },

  /**
   * Expand a specific utility
   */
  expandUtility(utilityId) {
    const util = this.utilities.find(u => u.id === utilityId);
    if (!util) return;

    const bubble = document.getElementById(util.bubbleId);
    if (!bubble || bubble.classList.contains('bubble-hidden')) return;

    // Collapse any currently expanded and re-render it for grid view
    if (this.currentExpanded && this.currentExpanded !== utilityId) {
      const prevUtilityId = this.currentExpanded;
      const prevBubble = document.getElementById(
        this.utilities.find(u => u.id === prevUtilityId)?.bubbleId
      );
      if (prevBubble) {
        prevBubble.classList.remove('expanded');

        // Reset previous bubble's expand button
        const prevExpandBtn = prevBubble.querySelector('.bubble-expand-btn');
        if (prevExpandBtn) {
          prevExpandBtn.innerHTML = '⛶';
          prevExpandBtn.title = 'Expand';
        }

        // Re-render previous bubble for grid view (minimal design)
        this.triggerGridRender(prevUtilityId);
      }
    }

    // Update body class
    document.body.classList.add('has-expanded-utility');

    // Expand the bubble
    bubble.classList.add('expanded');
    this.currentExpanded = utilityId;

    // Update sidebar active state
    this.updateSidebarActive(utilityId);

    // Trigger re-render for expanded view if utility supports it
    this.triggerExpandedRender(utilityId);

    // Update expand button icon
    const expandBtn = bubble.querySelector('.bubble-expand-btn');
    if (expandBtn) {
      expandBtn.innerHTML = '⊟';
      expandBtn.title = 'Minimize';
    }
  },

  /**
   * Collapse all utilities back to grid view
   */
  collapseAll() {
    if (!this.currentExpanded) return;

    const util = this.utilities.find(u => u.id === this.currentExpanded);
    if (util) {
      const bubble = document.getElementById(util.bubbleId);
      if (bubble) {
        bubble.classList.remove('expanded');

        // Reset expand button
        const expandBtn = bubble.querySelector('.bubble-expand-btn');
        if (expandBtn) {
          expandBtn.innerHTML = '⛶';
          expandBtn.title = 'Expand';
        }
      }
    }

    // Remove body class
    document.body.classList.remove('has-expanded-utility');
    this.currentExpanded = null;

    // Clear sidebar active state
    this.updateSidebarActive(null);

    // Trigger re-render for grid view
    if (util) {
      this.triggerGridRender(util.id);
    }
  },

  /**
   * Update sidebar active state
   */
  updateSidebarActive(activeId) {
    const sidebar = document.getElementById('expandSidebar');
    if (!sidebar) return;

    sidebar.querySelectorAll('.sidebar-icon').forEach(icon => {
      if (icon.dataset.utility === activeId) {
        icon.classList.add('active');
      } else {
        icon.classList.remove('active');
      }
    });
  },

  /**
   * Trigger expanded view render for a utility
   */
  triggerExpandedRender(utilityId) {
    const moduleMap = {
      cognitiveOffload: { module: typeof CognitiveOffload !== 'undefined' ? CognitiveOffload : null, contentId: 'cognitive-offload-content' },
      cashFlow: { module: typeof CashFlow !== 'undefined' ? CashFlow : null, contentId: 'cash-flow-content' },
      netWorth: { module: typeof NetWorth !== 'undefined' ? NetWorth : null, contentId: 'net-worth-content' },
      stockWatchlist: { module: typeof StockWatchlist !== 'undefined' ? StockWatchlist : null, contentId: 'stock-watchlist-content' },
      purposeGatekeeper: { module: typeof PurposeGatekeeper !== 'undefined' ? PurposeGatekeeper : null, contentId: 'purpose-gatekeeper-content' },
      dailyNegotiator: { module: typeof DailyNegotiator !== 'undefined' ? DailyNegotiator : null, contentId: 'daily-negotiator-content' },
      questionPrimer: { module: typeof QuestionPrimer !== 'undefined' ? QuestionPrimer : null, contentId: 'question-primer-content' },
      flowThermometer: { module: typeof FlowThermometer !== 'undefined' ? FlowThermometer : null, contentId: 'flow-thermometer-content' },
      truthLogger: { module: typeof TruthLogger !== 'undefined' ? TruthLogger : null, contentId: 'truth-logger-content' },
      tabSnoozer: { module: typeof TabSnoozer !== 'undefined' ? TabSnoozer : null, contentId: 'tab-snoozer-content' },
      masteryGraph: { module: typeof MasteryGraph !== 'undefined' ? MasteryGraph : null, contentId: 'mastery-graph-content' },
      digitalCleaner: { module: typeof DigitalCleaner !== 'undefined' ? DigitalCleaner : null, contentId: 'digital-cleaner-content' },
      weeklyReview: { module: typeof WeeklyReview !== 'undefined' ? WeeklyReview : null, contentId: 'weekly-review-content' },
      lifeCalculator: { module: typeof LifeCalculator !== 'undefined' ? LifeCalculator : null, contentId: 'life-calculator-content' }
    };

    const entry = moduleMap[utilityId];
    if (entry && entry.module && typeof entry.module.renderExpanded === 'function') {
      entry.module.renderExpanded();
    }
  },

  /**
   * Trigger grid view render for a utility
   */
  triggerGridRender(utilityId) {
    const moduleMap = {
      cognitiveOffload: typeof CognitiveOffload !== 'undefined' ? CognitiveOffload : null,
      cashFlow: typeof CashFlow !== 'undefined' ? CashFlow : null,
      netWorth: typeof NetWorth !== 'undefined' ? NetWorth : null,
      stockWatchlist: typeof StockWatchlist !== 'undefined' ? StockWatchlist : null,
      purposeGatekeeper: typeof PurposeGatekeeper !== 'undefined' ? PurposeGatekeeper : null,
      dailyNegotiator: typeof DailyNegotiator !== 'undefined' ? DailyNegotiator : null,
      questionPrimer: typeof QuestionPrimer !== 'undefined' ? QuestionPrimer : null,
      flowThermometer: typeof FlowThermometer !== 'undefined' ? FlowThermometer : null,
      truthLogger: typeof TruthLogger !== 'undefined' ? TruthLogger : null,
      tabSnoozer: typeof TabSnoozer !== 'undefined' ? TabSnoozer : null,
      masteryGraph: typeof MasteryGraph !== 'undefined' ? MasteryGraph : null,
      digitalCleaner: typeof DigitalCleaner !== 'undefined' ? DigitalCleaner : null,
      weeklyReview: typeof WeeklyReview !== 'undefined' ? WeeklyReview : null,
      lifeCalculator: typeof LifeCalculator !== 'undefined' ? LifeCalculator : null
    };

    const module = moduleMap[utilityId];
    if (module && typeof module.render === 'function') {
      module.render();
    }
  },

  /**
   * Check if a utility is currently expanded
   */
  isExpanded(utilityId) {
    return this.currentExpanded === utilityId;
  },

  /**
   * Get the currently expanded utility ID
   */
  getExpanded() {
    return this.currentExpanded;
  },

  /**
   * Update sidebar icon visibility based on bubble visibility
   */
  updateSidebarVisibility() {
    this.utilities.forEach(util => {
      const bubble = document.getElementById(util.bubbleId);
      const sidebarIcon = document.getElementById(`sidebar-icon-${util.id}`);

      if (bubble && sidebarIcon) {
        if (bubble.classList.contains('bubble-hidden')) {
          sidebarIcon.classList.add('bubble-hidden');
        } else {
          sidebarIcon.classList.remove('bubble-hidden');
        }
      }
    });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ExpandManager.init());
} else {
  ExpandManager.init();
}
