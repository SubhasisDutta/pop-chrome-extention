/**
 * POP Sample Data
 * Default example data for all utilities to showcase features
 */

const POPSampleData = {
  /**
   * Initialize all sample data for first-time users
   */
  async initializeAll() {
    const isInitialized = await this.checkInitialized();
    if (!isInitialized) {
      await Promise.all([
        this.initCognitiveOffload(),
        this.initCashFlow(),
        this.initNetWorth(),
        this.initStockWatchlist(),
        this.initPurposeGatekeeper(),
        this.initDailyNegotiator(),
        this.initQuestionPrimer(),
        this.initFlowThermometer(),
        this.initTruthLogger(),
        this.initTabSnoozer(),
        this.initMasteryGraph(),
        this.initDigitalCleaner(),
        this.initWeeklyReview(),
        this.initLifeCalculator()
      ]);
      await this.markInitialized();
    }
  },

  async checkInitialized() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['pop_initialized'], (result) => {
        resolve(result.pop_initialized === true);
      });
    });
  },

  async markInitialized() {
    return new Promise((resolve) => {
      chrome.storage.local.set({ pop_initialized: true }, resolve);
    });
  },

  // Cognitive Offload Sample Data
  async initCognitiveOffload() {
    const data = {
      thoughts: [
        {
          id: 'co1',
          text: 'Research the new API design patterns for microservices',
          type: 'actionable',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completed: false
        },
        {
          id: 'co2',
          text: 'The Pareto principle suggests 80% of results come from 20% of efforts',
          type: 'reference',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          completed: false
        },
        {
          id: 'co3',
          text: 'Schedule dentist appointment for next month',
          type: 'actionable',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          completed: true
        },
        {
          id: 'co4',
          text: 'Book recommendation from colleague: "Deep Work" by Cal Newport',
          type: 'reference',
          createdAt: new Date().toISOString(),
          completed: false
        }
      ]
    };
    return this.saveData('pop_cognitive_offload', data);
  },

  // Cash Flow Sample Data
  async initCashFlow() {
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    const data = {
      transactions: [
        { id: 'cf1', date: new Date(thisYear, thisMonth, 1).toISOString(), type: 'income', category: 'Salary', description: 'Monthly Salary', amount: 5000 },
        { id: 'cf2', date: new Date(thisYear, thisMonth, 3).toISOString(), type: 'expense', category: 'Rent', description: 'Monthly Rent', amount: 1500 },
        { id: 'cf3', date: new Date(thisYear, thisMonth, 5).toISOString(), type: 'expense', category: 'Utilities', description: 'Electricity Bill', amount: 120 },
        { id: 'cf4', date: new Date(thisYear, thisMonth, 7).toISOString(), type: 'expense', category: 'Groceries', description: 'Weekly Groceries', amount: 150 },
        { id: 'cf5', date: new Date(thisYear, thisMonth, 10).toISOString(), type: 'expense', category: 'Transportation', description: 'Gas', amount: 60 },
        { id: 'cf6', date: new Date(thisYear, thisMonth, 12).toISOString(), type: 'income', category: 'Freelance', description: 'Side Project Payment', amount: 800 },
        { id: 'cf7', date: new Date(thisYear, thisMonth, 14).toISOString(), type: 'expense', category: 'Entertainment', description: 'Netflix & Spotify', amount: 25 },
        { id: 'cf8', date: new Date(thisYear, thisMonth, 15).toISOString(), type: 'expense', category: 'Dining', description: 'Restaurant dinner', amount: 85 }
      ],
      categories: {
        income: ['Salary', 'Freelance', 'Investments', 'Gifts', 'Other'],
        expense: ['Rent', 'Utilities', 'Groceries', 'Transportation', 'Entertainment', 'Dining', 'Healthcare', 'Shopping', 'Other']
      }
    };
    return this.saveData('pop_cash_flow', data);
  },

  // Net Worth Sample Data
  async initNetWorth() {
    const today = new Date();
    const data = {
      entries: [
        {
          id: 'nw1',
          date: new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString(),
          assets: { cash: 10000, investments: 25000, property: 0, other: 5000 },
          liabilities: { creditCard: 2000, loans: 15000, mortgage: 0, other: 0 },
          totalAssets: 40000,
          totalLiabilities: 17000,
          netWorth: 23000
        },
        {
          id: 'nw2',
          date: new Date(today.getFullYear(), today.getMonth() - 4, 1).toISOString(),
          assets: { cash: 12000, investments: 26500, property: 0, other: 5000 },
          liabilities: { creditCard: 1500, loans: 14000, mortgage: 0, other: 0 },
          totalAssets: 43500,
          totalLiabilities: 15500,
          netWorth: 28000
        },
        {
          id: 'nw3',
          date: new Date(today.getFullYear(), today.getMonth() - 3, 1).toISOString(),
          assets: { cash: 11000, investments: 28000, property: 0, other: 5500 },
          liabilities: { creditCard: 1800, loans: 13000, mortgage: 0, other: 0 },
          totalAssets: 44500,
          totalLiabilities: 14800,
          netWorth: 29700
        },
        {
          id: 'nw4',
          date: new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString(),
          assets: { cash: 13500, investments: 29500, property: 0, other: 5500 },
          liabilities: { creditCard: 1200, loans: 12000, mortgage: 0, other: 0 },
          totalAssets: 48500,
          totalLiabilities: 13200,
          netWorth: 35300
        },
        {
          id: 'nw5',
          date: new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString(),
          assets: { cash: 15000, investments: 31000, property: 0, other: 6000 },
          liabilities: { creditCard: 800, loans: 11000, mortgage: 0, other: 0 },
          totalAssets: 52000,
          totalLiabilities: 11800,
          netWorth: 40200
        },
        {
          id: 'nw6',
          date: new Date(today.getFullYear(), today.getMonth(), 1).toISOString(),
          assets: { cash: 16500, investments: 33000, property: 0, other: 6000 },
          liabilities: { creditCard: 500, loans: 10000, mortgage: 0, other: 0 },
          totalAssets: 55500,
          totalLiabilities: 10500,
          netWorth: 45000
        }
      ],
      assetCategories: ['cash', 'investments', 'property', 'other'],
      liabilityCategories: ['creditCard', 'loans', 'mortgage', 'other']
    };
    return this.saveData('pop_net_worth', data);
  },

  // Stock Watchlist Sample Data
  async initStockWatchlist() {
    const data = {
      watchlists: [
        {
          id: 'wl1',
          name: 'Tech Giants',
          createdAt: new Date().toISOString(),
          stocks: [
            { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', addedAt: new Date().toISOString() },
            { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', addedAt: new Date().toISOString() },
            { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', addedAt: new Date().toISOString() },
            { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', addedAt: new Date().toISOString() }
          ]
        },
        {
          id: 'wl2',
          name: 'Index Funds',
          createdAt: new Date().toISOString(),
          stocks: [
            { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE', addedAt: new Date().toISOString() },
            { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', addedAt: new Date().toISOString() },
            { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'NYSE', addedAt: new Date().toISOString() }
          ]
        },
        {
          id: 'wl3',
          name: 'Growth Stocks',
          createdAt: new Date().toISOString(),
          stocks: [
            { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', addedAt: new Date().toISOString() },
            { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', addedAt: new Date().toISOString() }
          ]
        }
      ]
    };
    return this.saveData('pop_stock_watchlist', data);
  },

  // Purpose Gatekeeper Sample Data
  async initPurposeGatekeeper() {
    const data = {
      purposes: [
        { id: 'p1', name: 'Career Growth', description: 'Advance in my professional career', color: '#667eea' },
        { id: 'p2', name: 'Health & Wellness', description: 'Maintain physical and mental health', color: '#10b981' },
        { id: 'p3', name: 'Financial Freedom', description: 'Build wealth and financial security', color: '#f59e0b' },
        { id: 'p4', name: 'Relationships', description: 'Nurture meaningful connections', color: '#ec4899' },
        { id: 'p5', name: 'Personal Development', description: 'Continuous learning and growth', color: '#8b5cf6' }
      ],
      tasks: [
        { id: 't1', text: 'Complete online certification course', purposeId: 'p1', autonomy: 'choose', completed: false, createdAt: new Date().toISOString() },
        { id: 't2', text: 'Morning exercise routine', purposeId: 'p2', autonomy: 'choose', completed: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 't3', text: 'Review monthly budget', purposeId: 'p3', autonomy: 'choose', completed: false, createdAt: new Date().toISOString() },
        { id: 't4', text: 'Call parents this weekend', purposeId: 'p4', autonomy: 'choose', completed: false, createdAt: new Date().toISOString() },
        { id: 't5', text: 'Read 30 minutes before bed', purposeId: 'p5', autonomy: 'choose', completed: false, createdAt: new Date().toISOString() },
        { id: 't6', text: 'Submit expense report', purposeId: 'p1', autonomy: 'have', completed: false, createdAt: new Date().toISOString() }
      ]
    };
    return this.saveData('pop_purpose_gatekeeper', data);
  },

  // Daily Negotiator Sample Data
  async initDailyNegotiator() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = {
      plans: [
        {
          id: 'dn1',
          date: today.toISOString(),
          idealDay: 'A day where I make meaningful progress on my main project while still having time for exercise and relaxation.',
          tasks: [
            { id: 'dt1', text: 'Deep work on project (2 hours)', isHard: true, completed: false, order: 1 },
            { id: 'dt2', text: 'Coffee break with a good book', isHard: false, reward: true, completed: false, order: 2 },
            { id: 'dt3', text: 'Code review and meetings', isHard: true, completed: false, order: 3 },
            { id: 'dt4', text: 'Lunch walk in the park', isHard: false, reward: true, completed: false, order: 4 },
            { id: 'dt5', text: 'Documentation and emails', isHard: true, completed: false, order: 5 },
            { id: 'dt6', text: 'Evening workout', isHard: false, reward: true, completed: false, order: 6 }
          ]
        }
      ],
      lastPromptDate: null
    };
    return this.saveData('pop_daily_negotiator', data);
  },

  // Question Primer Sample Data
  async initQuestionPrimer() {
    const data = {
      questions: [
        {
          id: 'q1',
          question: 'How can I improve the performance of the database queries?',
          site: 'github.com',
          askedAt: new Date(Date.now() - 172800000).toISOString(),
          answeredAt: new Date(Date.now() - 86400000).toISOString(),
          resolved: true
        },
        {
          id: 'q2',
          question: 'What is the best architecture for this microservice?',
          site: 'docs.google.com',
          askedAt: new Date(Date.now() - 86400000).toISOString(),
          answeredAt: null,
          resolved: false
        },
        {
          id: 'q3',
          question: 'How can I make this component more reusable?',
          site: 'github.com',
          askedAt: new Date().toISOString(),
          answeredAt: null,
          resolved: false
        }
      ],
      deepWorkSites: ['github.com', 'docs.google.com', 'notion.so', 'figma.com', 'gitlab.com', 'stackoverflow.com'],
      enabled: true
    };
    return this.saveData('pop_question_primer', data);
  },

  // Flow Thermometer Sample Data
  async initFlowThermometer() {
    const data = {
      readings: [
        { id: 'f1', timestamp: new Date(Date.now() - 7200000).toISOString(), difficulty: 7, skill: 6, state: 'flow' },
        { id: 'f2', timestamp: new Date(Date.now() - 3600000).toISOString(), difficulty: 4, skill: 8, state: 'boredom' },
        { id: 'f3', timestamp: new Date().toISOString(), difficulty: 8, skill: 5, state: 'anxiety' }
      ],
      intervalMinutes: 30,
      paused: false,
      pausedUntil: null,
      suggestions: {
        anxiety: 'Try breaking this task into smaller, manageable pieces.',
        boredom: 'Add a constraint or challenge to make it more interesting.',
        flow: 'Great! You are in the zone. Keep going!'
      }
    };
    return this.saveData('pop_flow_thermometer', data);
  },

  // Truth Logger Sample Data
  async initTruthLogger() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data = {
      siteCategories: {
        'github.com': 'deep',
        'stackoverflow.com': 'deep',
        'docs.google.com': 'deep',
        'notion.so': 'deep',
        'figma.com': 'deep',
        'twitter.com': 'shallow',
        'facebook.com': 'shallow',
        'reddit.com': 'shallow',
        'youtube.com': 'shallow',
        'gmail.com': 'shallow',
        'mail.google.com': 'shallow'
      },
      timeLog: [
        { date: today.toISOString(), deep: 180, shallow: 120 },
        { date: new Date(today.getTime() - 86400000).toISOString(), deep: 240, shallow: 90 },
        { date: new Date(today.getTime() - 172800000).toISOString(), deep: 150, shallow: 180 }
      ],
      currentSession: {
        startTime: null,
        site: null,
        category: null
      }
    };
    return this.saveData('pop_truth_logger', data);
  },

  // Tab Snoozer Sample Data
  async initTabSnoozer() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const data = {
      snoozedTabs: [
        {
          id: 'ts1',
          url: 'https://example.com/article-to-read',
          title: 'Interesting Article to Read Later',
          snoozedAt: new Date().toISOString(),
          wakeAt: tomorrow.toISOString()
        }
      ],
      idleThresholdMinutes: 5,
      defaultSnoozeHours: 24
    };
    return this.saveData('pop_tab_snoozer', data);
  },

  // Mastery Graph Sample Data
  async initMasteryGraph() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 86400000);

    const data = {
      metric: {
        name: 'Lines of Code Written',
        unit: 'lines'
      },
      entries: [
        { date: yesterday.toISOString(), value: 150 },
        { date: today.toISOString(), value: 180 }
      ],
      streak: 2
    };
    return this.saveData('pop_mastery_graph', data);
  },

  // Digital Cleaner Sample Data
  async initDigitalCleaner() {
    const data = {
      processedBookmarks: [],
      archivedBookmarks: [],
      lastCleanDate: null,
      cleanOnStartup: true
    };
    return this.saveData('pop_digital_cleaner', data);
  },

  // Weekly Review Sample Data
  async initWeeklyReview() {
    const lastFriday = new Date();
    lastFriday.setDate(lastFriday.getDate() - ((lastFriday.getDay() + 2) % 7));

    const data = {
      reviews: [
        {
          id: 'wr1',
          date: lastFriday.toISOString(),
          responses: {
            'What went well this week?': 'Completed the main feature ahead of schedule. Had productive deep work sessions.',
            'What could have gone better?': 'Spent too much time in meetings. Need to protect my calendar better.',
            'What is the 80/20 of next week?': 'Focus on the API integration - it will unlock 80% of the remaining work.',
            'What am I avoiding?': 'The difficult conversation with the stakeholder about timeline.',
            'What would make next week great?': '3 hours of uninterrupted deep work each morning.'
          }
        }
      ],
      questions: [
        'What went well this week?',
        'What could have gone better?',
        'What is the 80/20 of next week?',
        'What am I avoiding?',
        'What would make next week great?'
      ],
      schedule: {
        day: 5, // Friday
        hour: 16,
        minute: 0,
        dismissible: true,
        durationMinutes: 15
      },
      lastPromptDate: null
    };
    return this.saveData('pop_weekly_review', data);
  },

  // Life Calculator Sample Data
  async initLifeCalculator() {
    const data = {
      dob: '1990-01-15',
      expectedLifespan: 85,
      weeklyHours: 112, // 16 hours/day * 7 days
      netWorth: 45000,
      monthlySpending: 3500,
      monthlySavings: 1500,
      showInputs: true
    };
    return this.saveData('pop_life_calculator', data);
  },

  // Helper to save data
  async saveData(key, data) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: data }, resolve);
    });
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = POPSampleData;
}
