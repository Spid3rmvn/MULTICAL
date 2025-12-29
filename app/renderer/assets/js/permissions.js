/**
 * Permissions Module
 * Handles role-based access control
 */

const Permissions = {
  /**
   * Get current user role
   */
  getCurrentRole() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser.role || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  },

  /**
   * Get current user permissions
   */
  getCurrentPermissions() {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      return currentUser.permissions || [];
    } catch (error) {
      console.error('Error getting permissions:', error);
      return [];
    }
  },

  /**
   * Check if user has specific permission
   */
  hasPermission(permission) {
    const role = this.getCurrentRole();
    const permissions = this.getCurrentPermissions();
    
    // Admin has all permissions
    if (role === 'admin') {
      return true;
    }
    
    return permissions.includes(permission);
  },

  /**
   * Check if user can delete
   */
  canDelete() {
    try {
      const role = this.getCurrentRole();
      // Only admin can delete, but if role is unset/default, allow delete (backward compatibility)
      return role === 'admin' || role === 'user';
    } catch (error) {
      console.error('Error checking canDelete:', error);
      return true; // Default to allowing delete on error
    }
  },

  /**
   * Check if user can edit
   */
  canEdit() {
    const role = this.getCurrentRole();
    // Both admin and employee can edit
    return role === 'admin' || role === 'employee';
  },

  /**
   * Check if user can convert to debt
   */
  canConvertToDebt() {
    return this.hasPermission('convert_to_debt');
  },

  /**
   * Hide element based on permission
   */
  hideIfNoPermission(selector, permission) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (!this.hasPermission(permission)) {
        element.style.display = 'none';
      }
    });
  },

  /**
   * Hide delete buttons for employees
   */
  hideDeleteButtonsForEmployees() {
    if (!this.canDelete()) {
      const deleteButtons = document.querySelectorAll('[data-action="delete"], .delete-btn, .btn-delete, button[onclick*="delete"]');
      deleteButtons.forEach(btn => {
        btn.style.display = 'none';
      });
    }
  },

  /**
   * Show convert to debt button only for those with permission
   */
  showConvertToDebtButton() {
    if (this.canConvertToDebt()) {
      const buttons = document.querySelectorAll('[data-action="convert-to-debt"], .convert-to-debt-btn');
      buttons.forEach(btn => {
        btn.style.display = 'block';
      });
    } else {
      const buttons = document.querySelectorAll('[data-action="convert-to-debt"], .convert-to-debt-btn');
      buttons.forEach(btn => {
        btn.style.display = 'none';
      });
    }
  }
};

window.Permissions = Permissions;
