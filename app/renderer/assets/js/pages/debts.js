/**
 * Debts Page Controller
 */

const DebtsPage = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: null,
  pickerMonth: new Date().getMonth(),
  pickerYear: new Date().getFullYear(),
  pickerSelectedDate: null,

  init() {
    this.bindEvents();
    this.render();
    this.updateSummary();
    
    // Subscribe to store changes
    Store.subscribe('debts', () => {
      this.render();
      this.updateSummary();
      // Refresh calendar if modal is open
      const calendarModal = document.getElementById('modal-calendar');
      if (calendarModal && calendarModal.classList.contains('open')) {
        this.renderCalendar();
      }
    });
  },

  bindEvents() {
    const modal = document.getElementById('modal-add-debt');
    const calendarModal = document.getElementById('modal-calendar');
    const datePickerModal = document.getElementById('modal-date-picker');

    const btnAdd = document.getElementById('btn-add-debt');
    const btnClose = document.getElementById('btn-close-debt-modal');
    const btnCancel = document.getElementById('btn-cancel-debt');
    const addForm = document.getElementById('add-debt-form');

    // Calendar button
    const btnCalendar = document.getElementById('btn-calendar-view');
    const btnCloseCalendar = document.getElementById('btn-close-calendar-modal');
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');

    // Date picker elements
    const dueDateDisplay = document.getElementById('due-date-display');
    const btnCloseDatePicker = document.getElementById('btn-close-date-picker');
    const btnPickerPrevMonth = document.getElementById('btn-picker-prev-month');
    const btnPickerNextMonth = document.getElementById('btn-picker-next-month');
    const btnClearDate = document.getElementById('btn-clear-date');
    const btnTodayDate = document.getElementById('btn-today-date');

    // Open Add Debt Modal
    if (btnAdd && modal) {
      btnAdd.addEventListener('click', () => {
        modal.classList.add('open');
      });
    }

    // Open Calendar Modal
    if (btnCalendar && calendarModal) {
      btnCalendar.addEventListener('click', () => {
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.selectedDate = null;
        calendarModal.classList.add('open');
        this.renderCalendar();
      });
    }

    // Close Modal Helper
    const closeModal = () => {
        if (modal) {
            modal.classList.remove('open');
            addForm?.reset();
        }
    };

    const closeCalendarModal = () => {
        if (calendarModal) {
            calendarModal.classList.remove('open');
            this.selectedDate = null;
            const detailsSection = document.getElementById('selected-day-details');
            if (detailsSection) detailsSection.classList.add('hidden');
        }
    };

    // Close Button Actions
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);
    if (btnCloseCalendar) btnCloseCalendar.addEventListener('click', closeCalendarModal);

    // Month Navigation
    if (btnPrevMonth) {
      btnPrevMonth.addEventListener('click', () => {
        this.currentMonth--;
        if (this.currentMonth < 0) {
          this.currentMonth = 11;
          this.currentYear--;
        }
        this.renderCalendar();
      });
    }

    if (btnNextMonth) {
      btnNextMonth.addEventListener('click', () => {
        this.currentMonth++;
        if (this.currentMonth > 11) {
          this.currentMonth = 0;
          this.currentYear++;
        }
        this.renderCalendar();
      });
    }

    // Date Picker
    if (dueDateDisplay && datePickerModal) {
      dueDateDisplay.addEventListener('click', () => {
        this.pickerMonth = new Date().getMonth();
        this.pickerYear = new Date().getFullYear();
        this.pickerSelectedDate = null;
        datePickerModal.classList.add('open');
        this.renderDatePicker();
      });
    }

    const closeDatePicker = () => {
      if (datePickerModal) {
        datePickerModal.classList.remove('open');
      }
    };

    if (btnCloseDatePicker) {
      btnCloseDatePicker.addEventListener('click', closeDatePicker);
    }

    if (datePickerModal) {
      datePickerModal.addEventListener('click', (e) => {
        if (e.target === datePickerModal) closeDatePicker();
      });
    }

    // Date picker month navigation
    if (btnPickerPrevMonth) {
      btnPickerPrevMonth.addEventListener('click', () => {
        this.pickerMonth--;
        if (this.pickerMonth < 0) {
          this.pickerMonth = 11;
          this.pickerYear--;
        }
        this.renderDatePicker();
      });
    }

    if (btnPickerNextMonth) {
      btnPickerNextMonth.addEventListener('click', () => {
        this.pickerMonth++;
        if (this.pickerMonth > 11) {
          this.pickerMonth = 0;
          this.pickerYear++;
        }
        this.renderDatePicker();
      });
    }

    // Date picker actions
    if (btnClearDate) {
      btnClearDate.addEventListener('click', () => {
        this.pickerSelectedDate = null;
        const dueDateValue = document.getElementById('due-date-value');
        const dueDateDisplay = document.getElementById('due-date-display');
        if (dueDateValue) dueDateValue.value = '';
        if (dueDateDisplay) dueDateDisplay.value = '';
        closeDatePicker();
      });
    }

    if (btnTodayDate) {
      btnTodayDate.addEventListener('click', () => {
        const today = new Date();
        this.setPickerDate(today);
        closeDatePicker();
      });
    }

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
    Toast.success('Debt Added', `KSh ${debt.amount.toLocaleString()} for ${debt.customer_name}`);
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
    const debt = Store.debts.find(d => d.id === id);
    Store.markDebtPaid(id);
    if (debt) {
      Toast.success('Debt Paid', `KSh ${debt.amount.toLocaleString()} from ${debt.customer_name} marked as paid`);
    }
  },

  delete(id) {
    const debt = Store.debts.find(d => d.id === id);
    if (!debt) return;
    
    ConfirmModal.show({
      title: 'Delete Debt Record?',
      message: 'Are you sure you want to delete this debt record? This action cannot be undone.',
      itemName: debt.customer_name,
      itemDetails: `KSh ${debt.amount.toLocaleString()} • ${debt.description || 'No description'}`,
      onConfirm: () => {
        Store.deleteDebt(id);
        Toast.success('Debt Deleted', `Debt record for ${debt.customer_name} has been removed`);
      }
    });
  },

  renderCalendar() {
    const monthYearEl = document.getElementById('calendar-month-year');
    const gridEl = document.getElementById('calendar-grid');
    
    if (!gridEl) return;

    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (monthYearEl) {
      monthYearEl.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
    }

    // Get first and last day of month
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Get debts for this month
    const debtsThisMonth = Store.debts.filter(d => {
      if (!d.due_date) return false;
      const dueDate = new Date(d.due_date);
      return dueDate.getMonth() === this.currentMonth && dueDate.getFullYear() === this.currentYear;
    });

    // Group debts by day
    const debtsByDay = {};
    debtsThisMonth.forEach(debt => {
      const day = new Date(debt.due_date).getDate();
      if (!debtsByDay[day]) debtsByDay[day] = [];
      debtsByDay[day].push(debt);
    });

    // Clear existing days (keep headers)
    const headers = gridEl.querySelectorAll('.calendar-day-header');
    gridEl.innerHTML = '';
    headers.forEach(h => gridEl.appendChild(h));

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      gridEl.appendChild(emptyDay);
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      
      // Check if today
      if (day === today.getDate() && this.currentMonth === today.getMonth() && this.currentYear === today.getFullYear()) {
        dayEl.classList.add('today');
      }

      // Check if selected
      if (this.selectedDate && this.selectedDate.getDate() === day && this.selectedDate.getMonth() === this.currentMonth && this.selectedDate.getFullYear() === this.currentYear) {
        dayEl.classList.add('selected');
      }

      // Day number
      const dayNumber = document.createElement('div');
      dayNumber.className = 'calendar-day-number';
      dayNumber.textContent = day;
      dayEl.appendChild(dayNumber);

      // Add debt indicators
      const debtsForDay = debtsByDay[day] || [];
      if (debtsForDay.length > 0) {
        const currentDate = new Date();
        const dayDate = new Date(this.currentYear, this.currentMonth, day);
        const daysUntilDue = Math.ceil((dayDate - currentDate) / (1000 * 60 * 60 * 24));

        let indicatorClass = 'upcoming';
        if (daysUntilDue < 0) {
          indicatorClass = 'overdue';
        } else if (daysUntilDue <= 3) {
          indicatorClass = 'due-soon';
        }

        const indicator = document.createElement('div');
        indicator.className = `calendar-debt-indicator ${indicatorClass}`;
        dayEl.appendChild(indicator);

        const count = document.createElement('div');
        count.className = 'calendar-debt-count';
        count.textContent = `${debtsForDay.length} debt${debtsForDay.length > 1 ? 's' : ''}`;
        dayEl.appendChild(count);
      }

      // Click handler
      dayEl.addEventListener('click', () => {
        this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
        this.renderCalendar();
        this.showDayDetails(day, debtsByDay[day] || []);
      });

      gridEl.appendChild(dayEl);
    }
  },

  showDayDetails(day, debts) {
    const detailsSection = document.getElementById('selected-day-details');
    const titleEl = document.getElementById('selected-day-title');
    const debtsContainer = document.getElementById('selected-day-debts');

    if (!detailsSection || !titleEl || !debtsContainer) return;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    titleEl.textContent = `Debts for ${monthNames[this.currentMonth]} ${day}, ${this.currentYear}`;

    if (debts.length === 0) {
      debtsContainer.innerHTML = '<p class="text-sm text-gray-500 italic">No debts due on this day</p>';
    } else {
      debtsContainer.innerHTML = debts.map(debt => {
        const isOverdue = new Date(debt.due_date) < new Date();
        return `
          <div class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h6 class="font-medium text-gray-900">${debt.customer_name}</h6>
                <p class="text-sm text-gray-600 mt-1">KSh ${debt.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                ${debt.description ? `<p class="text-xs text-gray-500 mt-1">${debt.description}</p>` : ''}
              </div>
              <span class="status-badge ${isOverdue ? 'status-badge--error' : 'status-badge--pending'} text-xs">
                ${isOverdue ? 'Overdue' : 'Pending'}
              </span>
            </div>
            <div class="flex gap-2 mt-3">
              <button onclick="DebtsPage.markPaid(${debt.id})" class="text-xs font-medium text-green-600 hover:text-green-800">
                Mark Paid
              </button>
              ${debt.phone ? `<span class="text-xs text-gray-400">•</span><span class="text-xs text-gray-600">${debt.phone}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    detailsSection.classList.remove('hidden');
  },

  renderDatePicker() {
    const monthYearEl = document.getElementById('picker-month-year');
    const gridEl = document.getElementById('picker-calendar-grid');
    
    if (!gridEl) return;

    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (monthYearEl) {
      monthYearEl.textContent = `${monthNames[this.pickerMonth]} ${this.pickerYear}`;
    }

    // Get first and last day of month
    const firstDay = new Date(this.pickerYear, this.pickerMonth, 1);
    const lastDay = new Date(this.pickerYear, this.pickerMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Clear existing days (keep headers)
    const headers = gridEl.querySelectorAll('.calendar-day-header');
    gridEl.innerHTML = '';
    headers.forEach(h => gridEl.appendChild(h));

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      gridEl.appendChild(emptyDay);
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      
      // Check if today
      if (day === today.getDate() && this.pickerMonth === today.getMonth() && this.pickerYear === today.getFullYear()) {
        dayEl.classList.add('today');
      }

      // Check if selected
      if (this.pickerSelectedDate && 
          this.pickerSelectedDate.getDate() === day && 
          this.pickerSelectedDate.getMonth() === this.pickerMonth && 
          this.pickerSelectedDate.getFullYear() === this.pickerYear) {
        dayEl.classList.add('selected');
      }

      // Day number
      const dayNumber = document.createElement('div');
      dayNumber.className = 'calendar-day-number';
      dayNumber.textContent = day;
      dayEl.appendChild(dayNumber);

      // Click handler
      dayEl.addEventListener('click', () => {
        const selectedDate = new Date(this.pickerYear, this.pickerMonth, day);
        this.setPickerDate(selectedDate);
        // Close picker after selection
        const datePickerModal = document.getElementById('modal-date-picker');
        if (datePickerModal) datePickerModal.classList.remove('open');
      });

      gridEl.appendChild(dayEl);
    }
  },

  setPickerDate(date) {
    this.pickerSelectedDate = date;
    const dueDateValue = document.getElementById('due-date-value');
    const dueDateDisplay = document.getElementById('due-date-display');
    
    // Format date as YYYY-MM-DD for the hidden input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedValue = `${year}-${month}-${day}`;
    
    // Format date for display (e.g., "January 15, 2024")
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const formattedDisplay = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    
    if (dueDateValue) dueDateValue.value = formattedValue;
    if (dueDateDisplay) dueDateDisplay.value = formattedDisplay;
    
    this.renderDatePicker();
  }
};

window.DebtsPage = DebtsPage;
