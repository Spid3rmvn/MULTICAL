/**
 * Debts Page Controller
 */

const DebtsPage = {
  init() {
    this.bindEvents();
    this.render();
    this.updateSummary();
    
    // Subscribe to store changes
    Store.subscribe('debts', () => {
      this.render();
      this.updateSummary();
    });
  },

  bindEvents() {
    const modal = document.getElementById('modal-add-debt');

    const btnAdd = document.getElementById('btn-add-debt');
    const btnClose = document.getElementById('btn-close-debt-modal');
    const btnCancel = document.getElementById('btn-cancel-debt');
    const addForm = document.getElementById('add-debt-form');

    // Open Modal
    if (btnAdd && modal) {
      btnAdd.addEventListener('click', () => {
        modal.classList.add('open');
      });
    }

    // Close Modal Helper
    const closeModal = () => {
        if (modal) {
            modal.classList.remove('open');
            addForm?.reset();
        }
    };

    // Close Button Actions
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    // Close on Click Outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    // Handle Form Submit
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmit(new FormData(addForm));
        closeModal();
      });
    }
  },

  handleSubmit(formData) {
    const debt = {
      customer_name: formData.get('customer_name'),
      phone: formData.get('phone'),
      amount: parseFloat(formData.get('amount')),
      due_date: formData.get('due_date'),
      description: formData.get('description')
    };
    Store.addDebt(debt);
  },

  render() {
    const tbody = document.getElementById('debts-table-body');
    if (!tbody) return;

    const pendingDebts = Store.getPendingDebts();

    if (pendingDebts.length === 0) {
      tbody.innerHTML = `
        <tr class="text-center">
            <td colspan="6" class="px-5 py-8 text-gray-500">
                <div class="flex flex-col items-center justify-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <p>No debts recorded.</p>
                </div>
            </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pendingDebts.map(debt => {
      const isOverdue = debt.due_date && new Date(debt.due_date) < new Date();
      return `
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-5 py-4 text-sm font-medium text-gray-900">${debt.customer_name}</td>
          <td class="px-5 py-4 text-sm text-gray-600">${debt.phone || '-'}</td>
          <td class="px-5 py-4 text-sm font-medium text-red-600">KSh ${debt.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
          <td class="px-5 py-4 text-sm text-gray-600">${debt.due_date || '-'}</td>
          <td class="px-5 py-4">
            <span class="status-badge ${isOverdue ? 'status-badge--error' : 'status-badge--pending'}">${isOverdue ? 'Overdue' : 'Pending'}</span>
          </td>
          <td class="px-5 py-4 flex gap-2">
            <button onclick="DebtsPage.markPaid(${debt.id})" class="text-green-600 hover:text-green-800 text-sm font-medium">Mark Paid</button>
            <button onclick="DebtsPage.delete(${debt.id})" class="text-gray-400 hover:text-red-600 transition-colors">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  updateSummary() {
    const totalEl = document.getElementById('total-debt');
    const paidEl = document.getElementById('paid-month');
    const overdueEl = document.getElementById('overdue-count');

    if (totalEl) totalEl.textContent = `KSh ${Store.getTotalOutstanding().toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if (paidEl) paidEl.textContent = `KSh ${Store.getPaidThisMonth().toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    if (overdueEl) overdueEl.textContent = Store.getOverdueDebts().length;
  },

  markPaid(id) {
    Store.markDebtPaid(id);
  },

  delete(id) {
    if (confirm('Are you sure you want to delete this debt record?')) {
      Store.deleteDebt(id);
    }
  }
};

window.DebtsPage = DebtsPage;
