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
  services: 'ServicesPage',
  debts: 'DebtsPage'
};

/**
 * Initialize the application
 */
async function init() {
  // Wait for Store to initialize (loads data from database)
  await Store.init();
  
  setupNavigation();
  loadPage('dashboard');
  console.log('MULTIPRINTS initialized');
}

/**
 * Setup sidebar navigation
 */
function setupNavigation() {
  // Handle sidebar navigation
  const navItems = document.querySelectorAll('.nav-item-monochrome, .nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageName = item.dataset.page;
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
}

/**
 * Navigate to a specific page
 */
function navigateToPage(pageName) {
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
