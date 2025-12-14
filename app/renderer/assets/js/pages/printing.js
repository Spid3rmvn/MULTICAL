/**
 * Printing Services Page Controller
 * Handles printing jobs for one-way vision, banners, satin, and reflective materials
 */

const PrintingPage = {
  materialDropdown: null,
  paymentDropdown: null,

  init() {
    this.initCustomDropdowns();
    this.bindEvents();
    this.render();
    this.updateStats();
    
    // Subscribe to store changes
    Store.subscribe('serviceTransactions', () => {
      this.render();
      this.updateStats();
    });
    Store.subscribe('printingMaterials', () => {
      this.renderPrintingMaterials();
      this.initMaterialDropdown();
    });
  },

  initCustomDropdowns() {
    // Material Dropdown
    this.initMaterialDropdown();

    // Payment Method Dropdown
    const paymentContainer = document.getElementById('print-payment-dropdown');
    if (paymentContainer) {
      this.paymentDropdown = new CustomDropdown(paymentContainer, {
        placeholder: 'Cash',
        items: [
          { value: 'cash', label: 'Cash' },
          { value: 'mpesa', label: 'M-Pesa' },
          { value: 'till', label: 'Till Number' }
        ],
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('print-payment-input');
          if (hiddenInput) hiddenInput.value = selected.value;
        }
      });
      // Auto-select first item
      this.paymentDropdown.selectItem(paymentContainer.querySelector('.dropdown-item'));
    }
  },

  initMaterialDropdown() {
    const materialContainer = document.getElementById('print-material-dropdown');
    if (materialContainer) {
      // Only show printing materials (Banner, Satin, Canvas, etc.) - NOT stock
      const printingMaterials = Store.getAvailablePrintingMaterials();
      
      const allMaterials = printingMaterials.map(m => ({
        value: `pm_${m.id}`,
        label: m.name,
        type: 'printing_material',
        id: m.id,
        width: m.width,
        material_type: m.material_type,
        color: m.color,
        remaining: m.remaining,
        badge: `${m.remaining.toFixed(1)}m`
      }));
      
      this.materialDropdown = new CustomDropdown(materialContainer, {
        placeholder: allMaterials.length > 0 ? 'Select material' : 'No materials available',
        items: allMaterials,
        onSelect: (selected) => {
          const hiddenInput = document.getElementById('print-stock-id-input');
          if (hiddenInput) hiddenInput.value = selected.value;
          this.updateMaterialInfo(selected);
          this.updatePrintingCalculations();
        }
      });
    }
  },

  refreshMaterialDropdown() {
    // Reset the current material selection
    if (this.materialDropdown) {
      this.materialDropdown.reset();
    }
    
    // Clear material info
    const infoEl = document.getElementById('print-material-info');
    if (infoEl) infoEl.textContent = '';
    
    // Reinitialize
    this.initMaterialDropdown();
  },

  bindEvents() {
    // Open/Close Modal
    const modal = document.getElementById('modal-record-printing');
    const btnOpen = document.getElementById('btn-record-printing');
    const btnClose = document.getElementById('btn-close-printing-modal');
    const btnCancel = document.getElementById('btn-cancel-printing');
    const form = document.getElementById('record-printing-form');

    const openModal = () => {
      if (modal) {
        this.initMaterialDropdown();
        modal.classList.add('open');
      }
    };

    const closeModal = () => {
      if (modal) {
        modal.classList.remove('open');
        form?.reset();
        this.materialDropdown?.reset();
        this.paymentDropdown?.reset();
        // Re-select payment default
        const paymentContainer = document.getElementById('print-payment-dropdown');
        if (paymentContainer && this.paymentDropdown) {
          this.paymentDropdown.selectItem(paymentContainer.querySelector('.dropdown-item'));
        }
        this.updatePrintingCalculations();
      }
    };

    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRecordPrintingJob(new FormData(form));
        closeModal();
      });

      // Real-time calculation updates
      const metresPrintedInput = document.getElementById('metres-printed');
      const totalPriceInput = document.getElementById('print-total-price');

      [metresPrintedInput, totalPriceInput].forEach(input => {
        if (input) {
          input.addEventListener('input', () => this.updatePrintingCalculations());
        }
      });
    }
    
    // Add Material Modal
    const materialModal = document.getElementById('modal-add-material');
    const btnAddMaterial = document.getElementById('btn-add-material');
    const btnCloseMaterial = document.getElementById('btn-close-material-modal');
    const btnCancelMaterial = document.getElementById('btn-cancel-material');
    const materialForm = document.getElementById('add-material-form');

    const openMaterialModal = () => {
      if (materialModal) materialModal.classList.add('open');
    };

    const closeMaterialModal = () => {
      if (materialModal) {
        materialModal.classList.remove('open');
        materialForm?.reset();
      }
    };

    if (btnAddMaterial) btnAddMaterial.addEventListener('click', openMaterialModal);
    if (btnCloseMaterial) btnCloseMaterial.addEventListener('click', closeMaterialModal);
    if (btnCancelMaterial) btnCancelMaterial.addEventListener('click', closeMaterialModal);
    
    if (materialModal) {
      materialModal.addEventListener('click', (e) => {
        if (e.target === materialModal) closeMaterialModal();
      });
    }

    if (materialForm) {
      materialForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddMaterial(new FormData(materialForm));
        closeMaterialModal();
      });
    }
  },

  updateMaterialInfo(selected) {
    const infoEl = document.getElementById('print-material-info');
    if (!infoEl || !selected) return;
    
    const remaining = parseFloat(selected.remaining);
    let info = '';
    
    if (selected.type === 'printing_material') {
      const color = selected.color ? ` ${selected.color}` : '';
      info = `${selected.material_type}${color} - ${selected.width}m width (${remaining.toFixed(1)}m available)`;
    } else {
      // Stock material
      const size = selected.size || '1';
      const stickerType = selected.stickerType || 'colored';
      info = `${selected.color} - ${size}m ${stickerType} (${remaining.toFixed(1)}m available)`;
    }
    
    infoEl.textContent = info;
  },

  updatePrintingCalculations() {
    const totalPriceInput = document.getElementById('print-total-price');
    const totalDisplay = document.getElementById('printing-total');

    if (!totalPriceInput) return;

    const totalPrice = parseFloat(totalPriceInput.value) || 0;

    if (totalDisplay) totalDisplay.textContent = `KSh ${totalPrice.toFixed(2)}`;
  },

  async handleRecordPrintingJob(formData) {
    const metresPrinted = parseFloat(formData.get('metres_printed'));
    const totalPrice = parseFloat(formData.get('total_price'));
    const materialValue = formData.get('stock_id');

    // Validations
    if (!materialValue) {
      Toast.error('Missing Material', 'Please select material from available stock');
      return;
    }

    if (!metresPrinted || metresPrinted <= 0) {
      Toast.error('Invalid Metres', 'Please enter valid metres printed');
      return;
    }

    if (!totalPrice || totalPrice <= 0) {
      Toast.error('Invalid Price', 'Please enter valid total price');
      return;
    }

    // Parse material ID (format: pm_123)
    const [materialType, materialId] = materialValue.split('_');
    const id = parseInt(materialId);
    
    // Get printing material
    const stockItem = Store.getPrintingMaterial(id);
    if (!stockItem) {
      Toast.error('Material Not Found', 'Selected printing material not found');
      return;
    }
    
    const remaining = stockItem.total_metres - stockItem.metres_used;
    if (metresPrinted > remaining) {
      Toast.error('Insufficient Material', `Only ${remaining.toFixed(1)}m available. You need ${metresPrinted.toFixed(1)}m`);
      return;
    }

    // Create transaction
    const transaction = {
      service_id: null,
      service_name: `${stockItem.name} - ${metresPrinted}m`,
      quantity: 1,
      price: totalPrice,
      amount: totalPrice,
      payment_method: formData.get('payment_method') || 'cash',
      customer_name: formData.get('customer_name') || 'Walk-in',
      notes: formData.get('notes') || `Printing - ${metresPrinted}m`,
      stock_id: null,
      stock_metres_used: metresPrinted,
      material_size: stockItem.width,
      material_type: stockItem.material_type || 'Custom',
      printing_material_id: id // Save the material ID for reversal when deleting
    };

    const result = await Store.addServiceTransaction(transaction);
    
    if (result && result.success === false) {
      Toast.error('Job Failed', result.error);
      return;
    }
    
    // Deduct from printing material
    await Store.deductPrintingMaterial(id, metresPrinted);
    
    Toast.success('Job Recorded', `${stockItem.name} - KSh ${totalPrice.toLocaleString()} (${metresPrinted.toFixed(1)}m used)`);
  },

  render() {
    this.renderPrintingJobs();
    this.renderPrintingMaterials();
  },

  async handleAddMaterial(formData) {
    const name = formData.get('name');
    const width = parseFloat(formData.get('width'));
    const rolls = parseInt(formData.get('rolls'));
    const metresPerRoll = parseFloat(formData.get('metres_per_roll')) || 50;
    const color = formData.get('color') || null;

    if (!name || !width || !rolls) {
      Toast.error('Missing Information', 'Please fill in all required fields');
      return;
    }

    const material = {
      name,
      material_type: 'Custom', // Default type since user enters custom name
      width,
      rolls,
      metres_per_roll: metresPerRoll,
      color
    };

    await Store.addPrintingMaterial(material);
    Toast.success('Material Added', `${material.name} has been added successfully`);
  },

  renderPrintingMaterials() {
    const container = document.getElementById('printing-materials-list');
    if (!container) return;

    if (Store.printingMaterials.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <p>No materials added yet</p>
        </div>
      `;
      return;
    }

    container.innerHTML = Store.printingMaterials.map(material => {
      const remaining = material.total_metres - material.metres_used;
      const metresPerRoll = material.metres_per_roll; // length per roll in metres
      const rollsRemaining = (remaining / metresPerRoll).toFixed(1);
      const percentage = (remaining / material.total_metres) * 100;
      const statusColor = percentage > 20 ? 'text-green-600' : percentage > 10 ? 'text-yellow-600' : 'text-red-600';
      
      return `
        <div class="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h4 class="font-medium text-gray-900">${material.name}</h4>
            </div>
            <div class="flex items-center gap-4 mt-2 text-xs text-gray-600">
              <span>Width: ${material.width}m</span>
              <span>Total Rolls: ${material.rolls}</span>
              <span class="${statusColor} font-medium">${rollsRemaining} rolls left (${remaining.toFixed(1)}m)</span>
            </div>
          </div>
          <button onclick="PrintingPage.deleteMaterial(${material.id})" 
            class="text-gray-400 hover:text-red-600 transition-colors ml-4">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  },

  async deleteMaterial(id) {
    const material = Store.getPrintingMaterial(id);
    if (!material) return;
    
    ConfirmModal.show({
      title: 'Delete Material?',
      message: 'Are you sure you want to delete this material? This action cannot be undone.',
      itemName: material.name,
      itemDetails: `${material.width}m ${material.material_type}`,
      onConfirm: async () => {
        await Store.deletePrintingMaterial(id);
        Toast.success('Material Deleted', `${material.name} has been removed`);
      }
    });
  },

  renderPrintingJobs() {
    const tbody = document.getElementById('printing-jobs-table-body');
    if (!tbody) return;

    // Get today's transactions that are printing related (have stock_metres_used)
    const todayTransactions = Store.getTodayServiceTransactions()
      .filter(t => t.stock_metres_used > 0);

    if (todayTransactions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="px-5 py-8 text-center text-gray-500">No printing jobs today.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = todayTransactions.map(t => {
      const transactionDate = new Date(t.timestamp);
      const today = new Date();
      const isToday = transactionDate.toDateString() === today.toDateString();
      
      // Show time if today, show date + time if older
      const timeDisplay = isToday 
        ? transactionDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'})
        : transactionDate.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) + ' ' + 
          transactionDate.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
      
      const material = t.material_size ? `${t.material_size}m ${t.material_type || ''}` : 'N/A';
      const paymentLabel = t.payment_method === 'mpesa' ? 'M-Pesa' : 
                           t.payment_method === 'till' ? 'Till Number' : 'Cash';
      
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-5 py-4 text-sm text-gray-500">${timeDisplay}</td>
          <td class="px-5 py-4">
            <p class="text-sm font-medium text-gray-900">${t.service_name}</p>
          </td>
          <td class="px-5 py-4 text-sm text-gray-600">${t.stock_metres_used.toFixed(1)}m</td>
          <td class="px-5 py-4 text-sm text-gray-600">${material}</td>
          <td class="px-5 py-4 text-sm font-medium text-gray-900">KSh ${t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
          <td class="px-5 py-4 text-sm text-gray-600">${paymentLabel}</td>
          <td class="px-5 py-4 text-sm text-gray-600">${t.customer_name}</td>
          <td class="px-5 py-4">
            <button onclick="PrintingPage.deletePrintingJob(${t.id})" 
              class="text-gray-400 hover:text-red-600 transition-colors" 
              title="Delete job">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  async deletePrintingJob(id) {
    const transaction = Store.serviceTransactions.find(t => t.id === id);
    if (!transaction) return;
    
    ConfirmModal.show({
      title: 'Delete Printing Job?',
      message: 'Are you sure you want to delete this printing job? The material will be returned to inventory.',
      itemName: transaction.service_name,
      itemDetails: `${transaction.stock_metres_used.toFixed(1)}m - KSh ${transaction.amount.toLocaleString()}`,
      onConfirm: async () => {
        // Return metres to printing material before deleting
        if (transaction.printing_material_id && transaction.stock_metres_used > 0) {
          const material = Store.getPrintingMaterial(transaction.printing_material_id);
          if (material) {
            const newMetresUsed = Math.max(0, material.metres_used - transaction.stock_metres_used);
            await Store.updatePrintingMaterial(transaction.printing_material_id, {
              metres_used: newMetresUsed
            });
          }
        }
        
        await Store.deleteServiceTransaction(id);
        Toast.success('Job Deleted', `${transaction.service_name} removed and material returned`);
        
        // Update stats and refresh views
        this.updateStats();
        this.renderPrintingJobs();
        this.renderPrintingMaterials();
      }
    });
  },

  updateStats() {
    const todayEl = document.getElementById('stat-today-printing');
    const totalJobsEl = document.getElementById('stat-total-jobs');
    const materialUsedEl = document.getElementById('stat-material-used');
    const totalEl = document.getElementById('stat-total-printing');

    // Get all printing transactions (those with stock usage)
    const allPrintingJobs = Store.serviceTransactions.filter(t => t.stock_metres_used > 0);
    const todayPrintingJobs = Store.getTodayServiceTransactions().filter(t => t.stock_metres_used > 0);

    const todayEarnings = todayPrintingJobs.reduce((sum, t) => sum + t.amount, 0);
    const totalEarnings = allPrintingJobs.reduce((sum, t) => sum + t.amount, 0);
    const totalMaterialUsed = allPrintingJobs.reduce((sum, t) => sum + t.stock_metres_used, 0);

    if (todayEl) todayEl.textContent = `KSh ${todayEarnings.toLocaleString()}`;
    if (totalJobsEl) totalJobsEl.textContent = allPrintingJobs.length;
    if (materialUsedEl) materialUsedEl.textContent = `${totalMaterialUsed.toFixed(1)}m`;
    if (totalEl) totalEl.textContent = `KSh ${totalEarnings.toLocaleString()}`;
  }
};

window.PrintingPage = PrintingPage;
