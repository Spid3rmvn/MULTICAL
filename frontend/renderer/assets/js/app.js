/**
 * Main Application Entry Point
 */

// DOM Elements
const appVersion = document.getElementById('app-version');
const appPlatform = document.getElementById('app-platform');
const backendStatus = document.getElementById('backend-status');
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const settingsForm = document.getElementById('settings-form');

/**
 * Initialize the application
 */
async function init() {
  // Load app info
  await loadAppInfo();
  
  // Check backend health
  await checkBackendHealth();
  
  // Setup navigation
  setupNavigation();
  
  // Setup forms
  setupForms();
  
  // Listen for menu events
  setupMenuListeners();
  
  console.log('MULTICAL initialized');
}

/**
 * Load application information
 */
async function loadAppInfo() {
  try {
    if (window.electronAPI) {
      const version = await window.electronAPI.getAppVersion();
      const platform = window.electronAPI.getPlatform();
      
      appVersion.textContent = version || '1.0.0';
      appPlatform.textContent = formatPlatform(platform);
    } else {
      appVersion.textContent = '1.0.0 (Web)';
      appPlatform.textContent = navigator.platform;
    }
  } catch (error) {
    console.error('Failed to load app info:', error);
    appVersion.textContent = 'Unknown';
    appPlatform.textContent = 'Unknown';
  }
}

/**
 * Check backend health status
 */
async function checkBackendHealth() {
  try {
    const result = await window.electronAPI.checkBackendHealth();
    
    if (result.status === 'healthy') {
      updateBackendStatus('healthy', 'Connected');
    } else {
      updateBackendStatus('error', 'Disconnected');
    }
  } catch (error) {
    console.error('Backend health check failed:', error);
    updateBackendStatus('error', 'Disconnected');
  }
}

/**
 * Update backend status indicator
 */
function updateBackendStatus(status, text) {
  backendStatus.className = `status-indicator status--${status}`;
  backendStatus.textContent = text;
}

/**
 * Setup page navigation
 */
function setupNavigation() {
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = link.dataset.page;
      navigateToPage(targetPage);
    });
  });
}

/**
 * Navigate to a specific page
 */
function navigateToPage(pageName) {
  // Update nav links
  navLinks.forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageName);
  });
  
  // Update pages
  pages.forEach(page => {
    page.classList.toggle('active', page.id === `page-${pageName}`);
  });
}

/**
 * Setup form handlers
 */
function setupForms() {
  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSettings();
    });
  }
}

/**
 * Save settings
 */
function saveSettings() {
  const formData = new FormData(settingsForm);
  const settings = Object.fromEntries(formData.entries());
  
  // Save to localStorage (or send to backend)
  localStorage.setItem('multical-settings', JSON.stringify(settings));
  
  // Apply settings
  applySettings(settings);
  
  console.log('Settings saved:', settings);
}

/**
 * Apply settings
 */
function applySettings(settings) {
  // Apply theme (example)
  if (settings.theme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
}

/**
 * Setup menu event listeners
 */
function setupMenuListeners() {
  if (window.electronAPI) {
    window.electronAPI.receive('menu:settings', () => {
      navigateToPage('settings');
    });
    
    window.electronAPI.receive('menu:about', () => {
      alert('MULTICAL v1.0.0\nAn offline desktop application.');
    });
  }
}

/**
 * Format platform name
 */
function formatPlatform(platform) {
  const platforms = {
    'darwin': 'macOS',
    'win32': 'Windows',
    'linux': 'Linux'
  };
  return platforms[platform] || platform;
}

// Periodic health check
setInterval(checkBackendHealth, 30000); // Every 30 seconds

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
