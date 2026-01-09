// Setup OS-specific shortcuts
function setupShortcuts() {
    const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);

    // Update input placeholder with OS-specific shortcut
    const input = document.getElementById('quickInput');
    if (input) {
        const shortcut = isMac ? 'MacCtrl+C' : 'Alt+C';
        input.placeholder = `Capture a thought... (${shortcut})`;
    }

    // Update Daily Plan shortcut (only one with a shortcut in the menu)
    const dailyPlanBtn = document.querySelector('[data-action="daily-negotiator"]');
    if (dailyPlanBtn) {
        const hotkeyEl = dailyPlanBtn.querySelector('.hotkey');
        if (hotkeyEl) {
            const shortcut = isMac ? 'MacCtrl+D' : 'Alt+D';
            hotkeyEl.textContent = shortcut;
        }
    }

    // Update Open Dashboard shortcut
    const dashboardBtn = document.getElementById('openDashboard');
    if (dashboardBtn) {
        const hotkeyEl = dashboardBtn.querySelector('.hotkey-inline');
        if (hotkeyEl) {
            const shortcut = isMac ? 'MacCtrl+P' : 'Alt+P';
            hotkeyEl.textContent = `(${shortcut})`;
        }
    }
}

// Initialize shortcuts on load
setupShortcuts();

// Quick capture functionality
const input = document.getElementById('quickInput');
const actionableBtn = document.getElementById('actionableBtn');
const referenceBtn = document.getElementById('referenceBtn');
const toast = document.getElementById('toast');

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

function saveThought(type) {
    const text = input.value.trim();
    if (!text) return;

    chrome.runtime.sendMessage({
        action: 'saveThought',
        text,
        type
    }, (response) => {
        if (response && response.success) {
            showToast(`Captured as ${type}!`);
            input.value = '';
        }
    });
}

if (actionableBtn) {
    actionableBtn.addEventListener('click', () => saveThought('actionable'));
}
if (referenceBtn) {
    referenceBtn.addEventListener('click', () => saveThought('reference'));
}

if (input) {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveThought('actionable');
        }
    });
    // Focus input on open
    input.focus();
}

// Menu item clicks
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        chrome.runtime.sendMessage({
            action: 'openDashboard',
            hash: action
        });
        window.close();
    });
});

// Open dashboard button
const openDashboardBtn = document.getElementById('openDashboard');
if (openDashboardBtn) {
    openDashboardBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openDashboard' });
        window.close();
    });
}
