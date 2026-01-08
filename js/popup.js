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
