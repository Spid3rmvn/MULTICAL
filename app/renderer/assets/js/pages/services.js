/**
 * Services Page Controller
 * Manages printing services and service transactions
 */

const ServicesPage = {
  serviceDropdown: null,
  paymentDropdown: null,

  init() {
    this.initCustomDropdowns();
    this.bindEvents();
    this.render();
    this.updateStats();
    
    // Subscribe to store changes
    Store.subscribe('services', () => {
      this.render();
      this.updateStats();
      this.updateServiceDropdownItems();
    });
    Store.subscribe('serviceTransactions', () => {
      this.renderTransactions();
      this.updateStats();
    });
  },

  initCustomDropdowns() {
    // Service Dropdown
    const serviceContainer = document.getElementById('service-dropdown');
    if (serviceContainer) {
      const activeServices = Store.services.filter(s => s.is_active === 1);
      
      this.serviceDropdown = new CustomDropdown(serviceContainer, {
        placeholder: activeServices.length > 0 ? 'Choose a service' : 'No active services',
        items: activeServices.map(s => ({
          value: s.id.toString(),
          label: s.name,
          price: s.price,
          unit: s.unit || '',
          badge: `KSh ${s.price.toLocaleString()}`
        })),
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('service-id-input');
          if (hiddenInput) hiddenInput.value = selected.value;
          this.updateServiceHint(selected);
          this.updateTransactionTotal();
        }
      });
    }

    // Payment Method Dropdown
    const paymentContainer = document.getElementById('service-payment-dropdown');
    if (paymentContainer) {
      this.paymentDropdown = new CustomDropdown(paymentContainer, {
        placeholder: 'Cash',
        items: [
          { value: 'cash', label: 'Cash' },
          { value: 'mpesa', label: 'M-Pesa' },
          { value: 'card', label: 'Card' }
        ],
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('service-payment-input');
          if (hiddenInput) hiddenInput.value = selected.value;
        }
      });
      // Auto-select first item
      this.paymentDropdown.selectItem(paymentContainer.querySelector('.dropdown-item'));
    }
  },

  bindEvents() {
    // Add Service Modal
    const modalAddService = document.getElementById('modal-add-service');
    const btnAdd = document.getElementById('btn-add-service');
    const btnClose = document.getElementById('btn-close-service-modal');
    const btnCancel = document.getElementById('btn-cancel-service');
    const addForm = document.getElementById('add-service-form');

    const openAddModal = () => {
      if (modalAddService) modalAddService.classList.add('open');
    };

    const closeAddModal = () => {
      if (modalAddService) {
        modalAddService.classList.remove('open');
        addForm?.reset();
      }
    };

    if (btnAdd) btnAdd.addEventListener('click', openAddModal);
    if (btnClose) btnClose.addEventListener('click', closeAddModal);
    if (btnCancel) btnCancel.addEventListener('click', closeAddModal);
    
    if (modalAddService) {
      modalAddService.addEventListener('click', (e) => {
        if (e.target === modalAddService) closeAddModal();
      });
    }

    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddService(new FormData(addForm));
        closeAddModal();
      });
    }

    // Record Transaction Modal
    const modalTransaction = document.getElementById('modal-record-transaction');
    const btnRecord = document.getElementById('btn-record-service');
    const btnCloseTransaction = document.getElementById('btn-close-transaction-modal');
    const btnCancelTransaction = document.getElementById('btn-cancel-transaction');
    const transactionForm = document.getElementById('record-transaction-form');

    const openTransactionModal = () => {
      if (modalTransaction) {
        this.updateServiceDropdownItems();
        modalTransaction.classList.add('open');
      }
    };

    const closeTransactionModal = () => {
      if (modalTransaction) {
        modalTransaction.classList.remove('open');
        transactionForm?.reset();
        this.updateTransactionTotal();
        const hintEl = document.getElementById('service-price-hint');
        if (hintEl) hintEl.textContent = '';
        // Reset dropdowns
        this.serviceDropdown?.reset();
        this.paymentDropdown?.reset();
        // Re-select payment default
        const paymentContainer = document.getElementById('service-payment-dropdown');
        if (paymentContainer) this.paymentDropdown?.selectItem(paymentContainer.querySelector('.dropdown-item'));
      }
    };

    if (btnRecord) btnRecord.addEventListener('click', openTransactionModal);
    if (btnCloseTransaction) btnCloseTransaction.addEventListener('click', closeTransactionModal);
    if (btnCancelTransaction) btnCancelTransaction.addEventListener('click', closeTransactionModal);
    
    if (modalTransaction) {
      modalTransaction.addEventListener('click', (e) => {
        if (e.target === modalTransaction) closeTransactionModal();
      });
    }

    if (transactionForm) {
      transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRecordTransaction(new FormData(transactionForm));
        closeTransactionModal();
      });

      // Quantity input change
      const quantityInput = document.getElementById('transaction-quantity');
      if (quantityInput) {
        quantityInput.addEventListener('input', () => this.updateTransactionTotal());
      }
    }
  },

  async handleAddService(formData) {
    const service = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      unit: formData.get('unit'),
      is_active: 1
    };

    await Store.addService(service);
    Toast.success('Service Added', `${service.name} has been added successfully`);
  },

  async handleRecordTransaction(formData) {
    const serviceId = parseInt(formData.get('service_id'));
    const quantity = parseFloat(formData.get('quantity'));
    
    if (!serviceId) {
      Toast.error('No Service Selected', 'Please select a service');
      return;
    }

    const service = Store.getService(serviceId);
    if (!service) {
      Toast.error('Service Not Found', 'Selected service not found');
      return;
    }

    const amount = service.price * quantity;
    const transaction = {
      service_id: serviceId,
      service_name: service.name,
      quantity: quantity,
      price: service.price,
      amount: amount,
      payment_method: formData.get('payment_method') || 'cash',
      customer_name: formData.get('customer_name') || 'Walk-in',
      notes: formData.get('notes') || null
    };

    await Store.addServiceTransaction(transaction);
    Toast.success('Transaction Recorded', `${service.name} - KSh ${amount.toLocaleString()}`);
  },

  updateServiceDropdownItems() {
    if (!this.serviceDropdown) return;

    const activeServices = Store.services.filter(s => s.is_active === 1);
    
    this.serviceDropdown.setItems(activeServices.map(s => ({
      value: s.id.toString(),
      label: s.name,
      price: s.price,
      unit: s.unit || '',
      badge: `KSh ${s.price.toLocaleString()}`
    })));
  },

  updateServiceHint(selected) {
    const hintEl = document.getElementById('service-price-hint');
    
    if (!hintEl || !selected) return;

    const price = parseFloat(selected.price);
    const unit = selected.unit;
    hintEl.textContent = `KSh ${price.toLocaleString()}${unit ? ' per ' + unit : ''}`;
  },

  updateTransactionTotal() {
    const serviceIdInput = document.getElementById('service-id-input');
    const quantityInput = document.getElementById('transaction-quantity');
    const totalEl = document.getElementById('transaction-total');

    if (!serviceIdInput || !quantityInput || !totalEl) return;

    const serviceId = serviceIdInput.value ? parseInt(serviceIdInput.value) : null;
    const service = serviceId ? Store.getService(serviceId) : null;
    const price = service?.price || 0;
    const quantity = parseFloat(quantityInput.value) || 0;
    const total = price * quantity;
    
    totalEl.textContent = `KSh ${total.toFixed(2)}`;
  },

  render() {
    this.renderServicesList();
    this.renderTransactions();
  },

  renderServicesList() {
    const container = document.getElementById('services-list');
    if (!container) return;

    if (Store.services.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p>No services added yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = Store.services.map(service => `
      <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h4 class="font-medium text-gray-900">${service.name}</h4>
            ${service.is_active ? 
              '<span class="status-badge status-badge--success text-xs">Active</span>' : 
              '<span class="status-badge status-badge--pending text-xs">Inactive</span>'
            }
          </div>
          ${service.description ? `<p class="text-xs text-gray-500 mt-1">${service.description}</p>` : ''}
          <p class="text-sm font-medium text-gray-900 mt-2">
            KSh ${service.price.toLocaleString()}${service.unit ? ' / ' + service.unit : ''}
          </p>
        </div>
        <div class="flex gap-2">
          <button onclick="ServicesPage.toggleActive(${service.id}, ${service.is_active})" 
            class="text-sm ${service.is_active ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-800'} font-medium">
            ${service.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button onclick="ServicesPage.deleteService(${service.id})" 
            class="text-gray-400 hover:text-red-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  },

  renderTransactions() {
    const tbody = document.getElementById('transactions-table-body');
    if (!tbody) return;

    const todayTransactions = Store.getTodayServiceTransactions();

    if (todayTransactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="px-5 py-8 text-center text-gray-500">No transactions today.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = todayTransactions.map(t => {
      const time = new Date(t.timestamp).toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-5 py-4">
            <div>
              <p class="text-sm font-medium text-gray-900">${t.service_name}</p>
              <p class="text-xs text-gray-500">${time}</p>
            </div>
          </td>
          <td class="px-5 py-4 text-sm text-gray-600">${t.quantity}</td>
          <td class="px-5 py-4 text-sm font-medium text-gray-900">KSh ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
          <td class="px-5 py-4 text-sm text-gray-600">${t.customer_name}</td>
        </tr>
      `;
    }).join('');
  },

  updateStats() {
    const todayEl = document.getElementById('stat-today-earnings');
    const totalEl = document.getElementById('stat-total-earnings');
    const activeEl = document.getElementById('stat-active-services');

    const todayEarnings = Store.getTodayServiceEarnings();
    const totalEarnings = Store.getTotalServiceEarnings();
    const activeServices = Store.services.filter(s => s.is_active === 1).length;

    if (todayEl) todayEl.textContent = `KSh ${todayEarnings.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `KSh ${totalEarnings.toLocaleString()}`;
    if (activeEl) activeEl.textContent = activeServices;
  },

  async toggleActive(id, currentStatus) {
    const newStatus = currentStatus ? 0 : 1;
    await Store.updateService(id, { is_active: newStatus });
    const service = Store.getService(id);
    Toast.success(
      newStatus ? 'Service Activated' : 'Service Deactivated',
      service?.name || 'Service'
    );
  },

  async deleteService(id) {
    const service = Store.getService(id);
    if (!service) return;
    
    ConfirmModal.show({
      title: 'Delete Service?',
      message: 'Are you sure you want to delete this service? This action cannot be undone.',
      itemName: service.name,
      itemDetails: `KSh ${service.price.toLocaleString()}${service.unit ? ' / ' + service.unit : ''}`,
      onConfirm: async () => {
        await Store.deleteService(id);
        Toast.success('Service Deleted', `${service.name} has been removed`);
      }
    });
  }
};

window.ServicesPage = ServicesPage;
