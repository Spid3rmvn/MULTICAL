/**
 * Toast Notification Component
 * A reusable toast/notification system for success, error, and info messages
 */

const Toast = {
  container: null,
  defaultDuration: 3000,

  init() {
    this.createContainer();
  },

  createContainer() {
    // Check if container already exists
    if (document.getElementById('toast-container')) {
      this.container = document.getElementById('toast-container');
      return;
    }

    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2';
    document.body.appendChild(container);
    this.container = container;
  },

  /**
   * Show a toast notification
   * @param {Object} options - Toast options
   * @param {string} options.type - 'success' | 'error' | 'warning' | 'info'
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {number} options.duration - Duration in ms (default: 3000)
   */
  show(options) {
    if (!this.container) this.createContainer();

    const { type = 'info', title, message, duration = this.defaultDuration } = options;

    const toast = document.createElement('div');
    toast.className = `toast-item transform translate-x-full opacity-0 transition-all duration-300 ease-out`;
    
    // Icon and colors based on type
    const config = this.getTypeConfig(type);

    toast.innerHTML = `
      <div class="flex items-start gap-3 min-w-[320px] max-w-[400px] p-4 bg-white border border-gray-200 rounded-xl shadow-lg">
        <div class="flex-shrink-0 w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center">
          ${config.icon}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-gray-900">${title || config.defaultTitle}</p>
          ${message ? `<p class="text-sm text-gray-500 mt-0.5">${message}</p>` : ''}
        </div>
        <button class="toast-close flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;

    this.container.appendChild(toast);

    // Bind close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-x-full', 'opacity-0');
      toast.classList.add('translate-x-0', 'opacity-100');
    });

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;

    toast.classList.remove('translate-x-0', 'opacity-100');
    toast.classList.add('translate-x-full', 'opacity-0');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  },

  getTypeConfig(type) {
    const configs = {
      success: {
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        defaultTitle: 'Success',
        icon: `<svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>`
      },
      error: {
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        defaultTitle: 'Error',
        icon: `<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>`
      },
      warning: {
        bgColor: 'bg-amber-100',
        iconColor: 'text-amber-600',
        defaultTitle: 'Warning',
        icon: `<svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>`
      },
      info: {
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        defaultTitle: 'Info',
        icon: `<svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>`
      }
    };

    return configs[type] || configs.info;
  },

  // Convenience methods
  success(title, message, duration) {
    return this.show({ type: 'success', title, message, duration });
  },

  error(title, message, duration) {
    return this.show({ type: 'error', title, message, duration });
  },

  warning(title, message, duration) {
    return this.show({ type: 'warning', title, message, duration });
  },

  info(title, message, duration) {
    return this.show({ type: 'info', title, message, duration });
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Toast.init());
} else {
  Toast.init();
}

// Make globally available
window.Toast = Toast;
