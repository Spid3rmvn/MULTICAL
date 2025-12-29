/**
 * MULTICAL Main Application
 * Handles navigation and page loading
 */

// Current page name
let currentPage = 'dashboard';

// Page controllers map
const pageControllers = {
  dashboard: 'DashboardPage',
  products: 'ProductsPage',
  stock: 'StockPage',
  sales: 'SalesPage',
  printing: 'PrintingPage',
  debts: 'DebtsPage',
  settings: 'SettingsPage'
};

/**
 * Initialize the application
 */
async function init() {
  // Check if user is authenticated
  const sessionToken = localStorage.getItem('sessionToken');
  if (!sessionToken) {
    // Redirect to login
    window.location.href = './pages/login.html';
    return;
  }

  try {
    // Validate session
    const isValid = await window.api.validateSession();
    if (!isValid) {
      // Invalid session, redirect to login
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('currentUser');
      window.location.href = './pages/login.html';
      return;
    }
  } catch (error) {
    console.error('Session validation error:', error);
    window.location.href = './pages/login.html';
    return;
  }
  
  // Wait for Store to initialize (loads data from database)
  await Store.init();
  
  setupNavigation();
  
  // Hide notification icon for employees
  const role = getCurrentUserRole();
  if (role === 'employee') {
    const notificationContainer = document.getElementById('notification-container');
    if (notificationContainer) {
      notificationContainer.style.display = 'none';
    }
  }
  
  // Load appropriate page based on user role
  const startPage = role === 'employee' ? 'sales' : 'dashboard';
  loadPage(startPage);
  
  console.log('MULTIPRINTS initialized');
}

/**
 * Get current user role
 */
function getCurrentUserRole() {
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.role || 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
}

/**
 * Check if user has access to page
 */
function canAccessPage(pageName) {
  const role = getCurrentUserRole();
  
  // Employee can only access printing, sales and settings
  if (role === 'employee') {
    return pageName === 'printing' || pageName === 'sales' || pageName === 'settings';
  }
  
  // Admin and other authenticated users can access everything
  return true;
}

/**
 * Setup sidebar navigation
 */
function setupNavigation() {
  const role = getCurrentUserRole();
  
  // Hide nav items based on role
  const navItems = document.querySelectorAll('.nav-item-monochrome, .nav-item');
  
  navItems.forEach(item => {
    const pageName = item.dataset.page;
    
    // Hide nav items that employee can't access
    if (role === 'employee' && pageName && !canAccessPage(pageName)) {
      item.closest('li').style.display = 'none';
    } else if (role === 'employee' && pageName === 'settings') {
      // Ensure settings is visible for employees
      item.closest('li').style.display = 'block';
    }
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      if (pageName) {
        navigateToPage(pageName);
      }
    });
  });

  // Handle header tab navigation
  const headerTabs = document.querySelectorAll('.header-tab');
  
  headerTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const pageName = tab.dataset.page;
      if (pageName) {
        navigateToPage(pageName);
      }
    });
  });

  // Handle logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
}

/**
 * Handle logout
 */
async function handleLogout() {
  try {
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      await window.api.logout(sessionToken);
    }

    // Clear session storage
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('currentUser');

    // Redirect to login
    window.location.href = './pages/login.html';
  } catch (error) {
    console.error('Logout error:', error);
    Toast.error('Logout Failed', 'Could not logout properly');
  }
}

/**
 * Navigate to a specific page
 */
function navigateToPage(pageName) {
  // Check if user has access to this page
  if (!canAccessPage(pageName)) {
    Toast.error('Access Denied', 'You do not have permission to access this page');
    return;
  }
  
  // Update active sidebar nav item
  const navItems = document.querySelectorAll('.nav-item-monochrome, .nav-item');
  navItems.forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });
  
  // Update active header tab
  const headerTabs = document.querySelectorAll('.header-tab');
  headerTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === pageName);
  });
  
  // Load the page
  loadPage(pageName);
}

/**
 * Load a page dynamically
 */
async function loadPage(pageName) {
  currentPage = pageName;
  const container = document.getElementById('page-container');
  
  if (!container) {
    console.error('Page container not found');
    return;
  }

  try {
    // Fetch the page HTML
    const response = await fetch(`pages/${pageName}.html`);
    if (!response.ok) {
      throw new Error(`Failed to load page: ${pageName}`);
    }
    
    const html = await response.text();
    container.innerHTML = html;
    
    // Initialize the page controller if it exists
    const controllerName = pageControllers[pageName];
    if (controllerName && window[controllerName]) {
      window[controllerName].init();
    }
    
    console.log('Loaded page:', pageName);
  } catch (error) {
    console.error('Error loading page:', error);
    container.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
          <p class="text-gray-500">The page "${pageName}" could not be loaded.</p>
          <p class="text-red-500 text-xs mt-2">${error.message}</p>
        </div>
      </div>
    `;
  }
}

// Make navigateToPage globally available for inline onclick handlers
window.navigateToPage = navigateToPage;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
