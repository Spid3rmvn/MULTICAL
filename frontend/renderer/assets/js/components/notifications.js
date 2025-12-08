/**
 * Notification System
 * Handles overdue debt reminders and notification display
 */

const NotificationSystem = {
  isDropdownOpen: false,
  checkInterval: null,
  
  init() {
    this.bindEvents();
    this.startPolling();
    
    // Subscribe to debt changes
    Store.subscribe('debts', () => this.updateNotifications());
    
    // Initial check after a short delay (allow Store to load)
    setTimeout(() => this.updateNotifications(), 500);
  },

  bindEvents() {
    const bell = document.getElementById('notification-bell');
    const dropdown = document.getElementById('notification-dropdown');
    const container = document.getElementById('notification-container');

    if (bell) {
      bell.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (container && !container.contains(e.target)) {
        this.closeDropdown();
      }
    });
  },

  toggleDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen) {
      dropdown.classList.remove('hidden');
      this.updateNotifications();
    } else {
      dropdown.classList.add('hidden');
    }
  },

  closeDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden');
      this.isDropdownOpen = false;
    }
  },

  startPolling() {
    // Check for overdue debts every minute
    this.checkInterval = setInterval(() => {
      this.updateNotifications();
    }, 60000);
  },

  updateNotifications() {
    const overdueDebts = Store.getOverdueDebts();
    this.updateBadge(overdueDebts.length);
    this.updateDropdownList(overdueDebts);
    
    // Show desktop notification if there are overdue debts on first load
    if (!this.hasShownInitialNotification && overdueDebts.length > 0) {
      this.showDesktopNotification(overdueDebts);
      this.hasShownInitialNotification = true;
    }
  },

  updateBadge(count) {
    const badge = document.getElementById('notification-badge');
    const countText = document.getElementById('notification-count-text');
    
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count.toString();
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    
    if (countText) {
      countText.textContent = count === 0 ? 'No overdue debts' : 
                              count === 1 ? '1 overdue debt' : 
                              `${count} overdue debts`;
    }
  },

  updateDropdownList(overdueDebts) {
    const list = document.getElementById('notification-list');
    if (!list) return;

    if (overdueDebts.length === 0) {
      list.innerHTML = `
        <div class="p-6 text-center">
          <div class="w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <p class="text-gray-500 text-sm">All debts are up to date!</p>
        </div>
      `;
      return;
    }

    list.innerHTML = overdueDebts.map(debt => {
      const daysOverdue = this.getDaysOverdue(debt.due_date);
      const urgencyClass = daysOverdue > 7 ? 'bg-red-50 border-l-4 border-red-500' : 
                           daysOverdue > 3 ? 'bg-amber-50 border-l-4 border-amber-500' : 
                           'bg-yellow-50 border-l-4 border-yellow-500';
      
      return `
        <div class="p-3 ${urgencyClass} hover:bg-opacity-80 transition-colors cursor-pointer" onclick="navigateToPage('debts')">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">${debt.customer_name}</p>
              <p class="text-xs text-gray-600 mt-0.5">KSh ${debt.amount.toLocaleString()}</p>
            </div>
            <div class="text-right flex-shrink-0 ml-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${daysOverdue > 7 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}">
                ${daysOverdue}d overdue
              </span>
            </div>
          </div>
          ${debt.description ? `<p class="text-xs text-gray-500 mt-1 truncate">${debt.description}</p>` : ''}
        </div>
      `;
    }).join('');
  },

  getDaysOverdue(dueDate) {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  showDesktopNotification(overdueDebts) {
    // Check if we have permission
    if (!('Notification' in window)) {
      console.log('Desktop notifications not supported');
      return;
    }

    if (Notification.permission === 'granted') {
      this.createDesktopNotification(overdueDebts);
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.createDesktopNotification(overdueDebts);
        }
      });
    }
  },

  createDesktopNotification(overdueDebts) {
    const count = overdueDebts.length;
    const totalAmount = overdueDebts.reduce((sum, d) => sum + d.amount, 0);
    
    const notification = new Notification('Overdue Debts Reminder', {
      body: `You have ${count} overdue debt${count > 1 ? 's' : ''} totaling KSh ${totalAmount.toLocaleString()}`,
      icon: '/renderer/assets/img/icon.png',
      tag: 'overdue-debts',
      requireInteraction: false
    });

    notification.onclick = () => {
      window.focus();
      navigateToPage('debts');
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => notification.close(), 10000);
  },

  hasShownInitialNotification: false
};

// Make globally available
window.NotificationSystem = NotificationSystem;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait a bit for Store to initialize
  setTimeout(() => NotificationSystem.init(), 1000);
});
