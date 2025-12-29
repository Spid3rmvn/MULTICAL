/**
 * Settings Page Controller
 */

const SettingsPage = {
  currentTab: 'general',
  dropdowns: {},
  isInitializing: true, // Flag to prevent toast spam during initialization
  settings: {
    currency: 'KES',
    currencySymbol: 'KSh',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    showDecimals: true,
    lowStockAlerts: true,
    businessName: '',
    businessPhone: '',
    businessEmail: '',
    businessPIN: '',
    businessAddress: '',
    defaultStickerPrice: 10,
    defaultPrintingPrice: 100,
    lifeSaverMarkup: 30,
    chevronMarkup: 30,
    stripesMarkup: 30
  },

  init() {
    this.isInitializing = true;
    this.loadSettings();
    
    // Role-based restrictions
    const role = window.Permissions?.getCurrentRole();
    if (role === 'employee') {
      // Hide non-account tabs for employees
      document.querySelectorAll('.settings-tab').forEach(tab => {
        if (tab.id !== 'tab-account') {
          tab.classList.add('hidden');
        }
      });
      // Automatically switch to account tab
      this.switchTab('account');
    } else {
      this.initializeDropdowns();
    }

    this.bindEvents();
    this.loadAppVersion();
    this.loadPlatformInfo();
    // Mark initialization as complete - toasts will now be shown
    // Use setTimeout to ensure all initialization is truly complete
    setTimeout(() => {
      this.isInitializing = false;
    }, 100);
  },

  initializeDropdowns() {
    // Currency dropdown
    this.dropdowns.currency = new Dropdown('currency-dropdown', {
      items: [
        { value: 'KES', label: 'Kenyan Shilling (KSh)' },
        { value: 'USD', label: 'US Dollar ($)' },
        { value: 'EUR', label: 'Euro (€)' },
        { value: 'GBP', label: 'British Pound (£)' }
      ],
      selected: this.settings.currency,
      placeholder: 'Select Currency',
      onChange: (value) => this.updateCurrency(value)
    });

    // Date format dropdown
    this.dropdowns.dateFormat = new Dropdown('date-format-dropdown', {
      items: [
        { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
      ],
      selected: this.settings.dateFormat,
      placeholder: 'Select Date Format',
      onChange: (value) => {
        this.settings.dateFormat = value;
        this.saveSettings();
      }
    });

    // Time format dropdown
    this.dropdowns.timeFormat = new Dropdown('time-format-dropdown', {
      items: [
        { value: '12h', label: '12 Hour (AM/PM)' },
        { value: '24h', label: '24 Hour' }
      ],
      selected: this.settings.timeFormat,
      placeholder: 'Select Time Format',
      onChange: (value) => {
        this.settings.timeFormat = value;
        this.saveSettings();
      }
    });
  },

  bindEvents() {
    // Tab switching
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabId = e.currentTarget.id.replace('tab-', '');
        this.switchTab(tabId);
      });
    });

    // Display options toggles
    document.getElementById('show-decimals')?.addEventListener('change', (e) => {
      this.settings.showDecimals = e.target.checked;
      this.saveSettings();
    });

    document.getElementById('low-stock-alerts')?.addEventListener('change', (e) => {
      this.settings.lowStockAlerts = e.target.checked;
      this.saveSettings();
    });

    // Business info form
    const businessForm = document.getElementById('business-info-form');
    if (businessForm) {
      businessForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveBusinessInfo();
      });
    }

    // Pricing save
    document.getElementById('save-pricing')?.addEventListener('click', () => {
      this.savePricing();
    });

    // Backup & Data actions
    document.getElementById('btn-export-data')?.addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('btn-import-data')?.addEventListener('click', () => {
      this.importData();
    });

    document.getElementById('btn-clear-data')?.addEventListener('click', () => {
      this.clearAllData();
    });

    // Account panel
    document.getElementById('changeUsernameForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleChangeUsername();
    });

    document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleChangePassword();
    });

    document.getElementById('logoutButton')?.addEventListener('click', () => {
      this.handleLogout();
    });
  },


  updateCurrency(currencyCode) {
    const currencyMap = {
      'KES': 'KSh',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };

    this.settings.currency = currencyCode;
    this.settings.currencySymbol = currencyMap[currencyCode] || 'KSh';

    const symbolInput = document.getElementById('currency-symbol');
    if (symbolInput) {
      symbolInput.value = this.settings.currencySymbol;
    }

    this.saveSettings();
  },

  loadSettings() {
    try {
      const saved = localStorage.getItem('app_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
      this.applySettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  applySettings() {
    // Update dropdowns with saved values
    if (this.dropdowns.currency) {
      this.dropdowns.currency.setValue(this.settings.currency);
    }
    if (this.dropdowns.dateFormat) {
      this.dropdowns.dateFormat.setValue(this.settings.dateFormat);
    }
    if (this.dropdowns.timeFormat) {
      this.dropdowns.timeFormat.setValue(this.settings.timeFormat);
    }

    // Currency symbol
    const currencySymbol = document.getElementById('currency-symbol');
    if (currencySymbol) currencySymbol.value = this.settings.currencySymbol;

    // Display options
    const showDecimals = document.getElementById('show-decimals');
    if (showDecimals) showDecimals.checked = this.settings.showDecimals;
    
    const lowStockAlerts = document.getElementById('low-stock-alerts');
    if (lowStockAlerts) lowStockAlerts.checked = this.settings.lowStockAlerts;

    // Business info
    const businessName = document.getElementById('business-name');
    if (businessName) businessName.value = this.settings.businessName || '';
    
    const businessPhone = document.getElementById('business-phone');
    if (businessPhone) businessPhone.value = this.settings.businessPhone || '';
    
    const businessEmail = document.getElementById('business-email');
    if (businessEmail) businessEmail.value = this.settings.businessEmail || '';
    
    const businessPIN = document.getElementById('business-pin');
    if (businessPIN) businessPIN.value = this.settings.businessPIN || '';
    
    const businessAddress = document.getElementById('business-address');
    if (businessAddress) businessAddress.value = this.settings.businessAddress || '';

    // Pricing
    const stickerPrice = document.getElementById('default-sticker-price');
    if (stickerPrice) stickerPrice.value = this.settings.defaultStickerPrice || 10;
    
    const printingPrice = document.getElementById('default-printing-price');
    if (printingPrice) printingPrice.value = this.settings.defaultPrintingPrice || 100;
    
    const lifeSaverMarkup = document.getElementById('life-saver-markup');
    if (lifeSaverMarkup) lifeSaverMarkup.value = this.settings.lifeSaverMarkup || 30;
    
    const chevronMarkup = document.getElementById('chevron-markup');
    if (chevronMarkup) chevronMarkup.value = this.settings.chevronMarkup || 30;
    
    const stripesMarkup = document.getElementById('stripes-markup');
    if (stripesMarkup) stripesMarkup.value = this.settings.stripesMarkup || 30;
  },

  saveSettings() {
    try {
      localStorage.setItem('app_settings', JSON.stringify(this.settings));
      // Only show toast after initialization is complete
      if (!this.isInitializing) {
        Toast.success('Settings Saved', 'Your preferences have been updated');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (!this.isInitializing) {
        Toast.error('Save Failed', 'Could not save settings');
      }
    }
  },

  saveBusinessInfo() {
    this.settings.businessName = document.getElementById('business-name')?.value || '';
    this.settings.businessPhone = document.getElementById('business-phone')?.value || '';
    this.settings.businessEmail = document.getElementById('business-email')?.value || '';
    this.settings.businessPIN = document.getElementById('business-pin')?.value || '';
    this.settings.businessAddress = document.getElementById('business-address')?.value || '';

    this.saveSettings();
  },

  savePricing() {
    this.settings.defaultStickerPrice = parseFloat(document.getElementById('default-sticker-price')?.value) || 10;
    this.settings.defaultPrintingPrice = parseFloat(document.getElementById('default-printing-price')?.value) || 100;
    this.settings.lifeSaverMarkup = parseFloat(document.getElementById('life-saver-markup')?.value) || 30;
    this.settings.chevronMarkup = parseFloat(document.getElementById('chevron-markup')?.value) || 30;
    this.settings.stripesMarkup = parseFloat(document.getElementById('stripes-markup')?.value) || 30;

    this.saveSettings();
  },

  async loadAppVersion() {
    try {
      if (window.app && window.app.getVersion) {
        const version = await window.app.getVersion();
        const versionEl = document.getElementById('app-version');
        if (versionEl) versionEl.textContent = version;
      }
    } catch (error) {
      console.error('Failed to load app version:', error);
    }
  },

  async loadPlatformInfo() {
    try {
      const platformEl = document.getElementById('platform-info');
      if (platformEl && window.app && window.app.getPlatform) {
        const platform = await window.app.getPlatform();
        platformEl.textContent = platform;
      } else if (platformEl) {
        platformEl.textContent = 'Desktop Application';
      }
    } catch (error) {
      console.error('Failed to load platform info:', error);
      const platformEl = document.getElementById('platform-info');
      if (platformEl) platformEl.textContent = 'Desktop Application';
    }
  },

  async exportData() {
    try {
      const data = {
        products: Store.products,
        stock: Store.stock,
        sales: Store.sales,
        debts: Store.debts,
        services: Store.services,
        serviceTransactions: Store.serviceTransactions,
        printingMaterials: Store.printingMaterials,
        settings: this.settings,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `multical-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update last backup date
      const lastBackupEl = document.getElementById('last-backup');
      if (lastBackupEl) {
        lastBackupEl.textContent = new Date().toLocaleString();
      }

      Toast.success('Export Complete', 'Database backup downloaded successfully');
    } catch (error) {
      console.error('Export failed:', error);
      Toast.error('Export Failed', 'Could not export data');
    }
  },

  async importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Validate data structure
        if (!data.version || !data.exportDate) {
          throw new Error('Invalid backup file format');
        }

        ConfirmModal.show({
          title: 'Import Database?',
          message: 'This will replace all current data with the backup. This action cannot be undone.',
          itemName: 'Database Import',
          itemDetails: `Backup from ${new Date(data.exportDate).toLocaleDateString()}`,
          onConfirm: async () => {
            await this.performImport(data);
          }
        });
      } catch (error) {
        console.error('Import failed:', error);
        Toast.error('Import Failed', 'Invalid backup file or corrupt data');
      }
    };

    input.click();
  },

  async performImport(data) {
    try {
      // Import products
      if (data.products && data.products.length > 0) {
        for (const product of data.products) {
          await Store.addProduct(product);
        }
      }

      // Import stock
      if (data.stock && data.stock.length > 0) {
        for (const stockItem of data.stock) {
          await Store.addStock(stockItem);
        }
      }

      // Import other data...
      if (data.settings) {
        this.settings = { ...this.settings, ...data.settings };
        localStorage.setItem('app_settings', JSON.stringify(this.settings));
        this.applySettings();
      }

      Toast.success('Import Complete', 'Database restored successfully');
      
      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Import failed:', error);
      Toast.error('Import Failed', 'Could not restore data');
    }
  },

  clearAllData() {
    ConfirmModal.show({
      title: 'Clear All Data?',
      message: 'This will permanently delete ALL products, sales, debts, and stock data. This action CANNOT be undone!',
      itemName: 'All Business Data',
      itemDetails: 'Make sure you have a backup before proceeding',
      onConfirm: async () => {
        try {
          // Clear all store data
          Store.products = [];
          Store.stock = [];
          Store.sales = [];
          Store.debts = [];
          Store.services = [];
          Store.serviceTransactions = [];
          Store.printingMaterials = [];

          // Notify all subscriptions
          Store.notify('products');
          Store.notify('stock');
          Store.notify('sales');
          Store.notify('debts');
          Store.notify('services');
          Store.notify('serviceTransactions');
          Store.notify('printingMaterials');

          Toast.success('Data Cleared', 'All business data has been deleted');
          
          // Reload after a moment
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } catch (error) {
          console.error('Clear data failed:', error);
          Toast.error('Clear Failed', 'Could not clear all data');
        }
      }
    });
  },

  /**
   * Load current user info when account tab is selected
   */
  switchTab(tabId) {
    // Call original switchTab logic first
    const originalSwitch = SettingsPage.constructor.prototype.switchTab || function() {};
    
    // Update active tab
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('active', 'border-black', 'text-gray-900');
      tab.classList.add('border-transparent', 'text-gray-500');
    });

    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) {
      activeTab.classList.add('active', 'border-black', 'text-gray-900');
      activeTab.classList.remove('border-transparent', 'text-gray-500');
    }

    // Show corresponding panel
    document.querySelectorAll('.settings-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    const panel = document.getElementById(`panel-${tabId}`);
    if (panel) {
      panel.classList.remove('hidden');
    }

    this.currentTab = tabId;

    // Load user info if account tab
    if (tabId === 'account') {
      this.loadCurrentUserInfo();
    }
  },

  /**
   * Handle username change
   */
  async handleChangeUsername() {
    const newUsername = document.getElementById('newUsername').value;
    const errorElement = document.getElementById('usernameError');

    if (!newUsername) {
      errorElement.textContent = 'Username is required';
      errorElement.classList.remove('hidden');
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const result = await window.api.updateUsername(currentUser.username, newUsername);

      if (result.success) {
        Toast.success('Username Updated', 'Your username has been changed successfully');
        
        // Update local storage
        currentUser.username = newUsername;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update display
        this.loadCurrentUserInfo();
        document.getElementById('changeUsernameForm').reset();
        errorElement.classList.add('hidden');
      } else {
        errorElement.textContent = result.error || 'Failed to update username';
        errorElement.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Username change error:', error);
      errorElement.textContent = 'An error occurred while updating username';
      errorElement.classList.remove('hidden');
    }
  },

  /**
   * Load current user information
   */
  loadCurrentUserInfo() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      document.getElementById('current-username').textContent = currentUser.username || 'Unknown';
      document.getElementById('current-role').textContent = currentUser.role || 'User';
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  },

  /**
   * Handle password change
   */
  async handleChangePassword() {
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('passwordError');

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      errorElement.textContent = 'All fields are required';
      errorElement.classList.remove('hidden');
      return;
    }

    if (newPassword !== confirmPassword) {
      errorElement.textContent = 'New passwords do not match';
      errorElement.classList.remove('hidden');
      return;
    }

    if (newPassword.length < 6) {
      errorElement.textContent = 'New password must be at least 6 characters';
      errorElement.classList.remove('hidden');
      return;
    }

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const result = await window.api.updatePassword(currentUser.username, oldPassword, newPassword);

      if (result.success) {
        Toast.success('Password Updated', 'Your password has been changed successfully');
        document.getElementById('changePasswordForm').reset();
        errorElement.classList.add('hidden');
      } else {
        errorElement.textContent = result.error || 'Failed to update password';
        errorElement.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Password change error:', error);
      errorElement.textContent = 'An error occurred while updating password';
      errorElement.classList.remove('hidden');
    }
  },

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(inputId, button) {
    const input = document.getElementById(inputId);
    const svg = button.querySelector('svg');
    
    if (input.type === 'password') {
      input.type = 'text';
      svg.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
      `;
    } else {
      input.type = 'password';
      svg.innerHTML = `
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
      `;
    }
  },

  /**
   * Handle logout
   */
  async handleLogout() {
    // Confirm logout
    const confirmed = await ConfirmModal.show({
      title: 'Logout Confirmation',
      message: 'Are you sure you want to logout?',
      okText: 'Logout',
      cancelText: 'Cancel'
    });

    if (!confirmed) return;

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      if (sessionToken) {
        await window.api.logout(sessionToken);
      }

      // Clear session storage
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('currentUser');

      // Redirect to login (go up two levels from assets/js/pages/ to root)
      window.location.href = '../../pages/login.html';
    } catch (error) {
      console.error('Logout error:', error);
      Toast.error('Logout Failed', 'Could not logout properly');
    }
  }
};

window.SettingsPage = SettingsPage;
