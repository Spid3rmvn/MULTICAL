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
    this.initializeDropdowns();
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
  },

  switchTab(tabId) {
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

    const activePanel = document.getElementById(`panel-${tabId}`);
    if (activePanel) {
      activePanel.classList.remove('hidden');
    }

    this.currentTab = tabId;
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
  }
};

window.SettingsPage = SettingsPage;
