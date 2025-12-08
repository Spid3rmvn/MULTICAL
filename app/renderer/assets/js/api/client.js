/**
 * API Client - Communicate with FastAPI backend
 */

class APIClient {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
    this.apiVersion = 'v1';
    this.init();
  }

  /**
   * Initialize the API client
   */
  async init() {
    try {
      if (window.electronAPI) {
        this.baseUrl = await window.electronAPI.getBackendUrl();
      }
    } catch (error) {
      console.warn('Could not get backend URL from Electron, using default');
    }
  }

  /**
   * Get full API URL
   */
  getUrl(endpoint) {
    return `${this.baseUrl}/api/${this.apiVersion}${endpoint}`;
  }

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    const url = this.getUrl(endpoint);
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(
          error.detail || `HTTP ${response.status}`,
          response.status,
          error
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(error.message, 0, { originalError: error });
    }
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check
   */
  async healthCheck() {
    return this.get('/health');
  }
}

/**
 * API Error class
 */
class APIError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Create global API client instance
window.api = new APIClient();
