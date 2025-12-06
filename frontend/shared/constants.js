/**
 * Shared Constants
 */

module.exports = {
  // API Configuration
  API: {
    VERSION: 'v1',
    TIMEOUT: 30000
  },

  // Application
  APP: {
    NAME: 'MULTICAL',
    VERSION: '1.0.0'
  },

  // IPC Channels
  IPC_CHANNELS: {
    APP_VERSION: 'app:version',
    APP_READY: 'app:ready',
    BACKEND_URL: 'backend:url',
    BACKEND_HEALTH: 'backend:health',
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_MAXIMIZE: 'window:maximize',
    WINDOW_CLOSE: 'window:close'
  },

  // Storage Keys
  STORAGE_KEYS: {
    SETTINGS: 'multical-settings',
    THEME: 'multical-theme'
  }
};
