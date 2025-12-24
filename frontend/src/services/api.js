// EventMax API Client
// Centralized API configuration and request handling

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  getAuthToken() {
    return localStorage.getItem('token');
  }

  setAuthToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  setRefreshToken(token) {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      // Handle 401 - try to refresh token
      if (response.status === 401 && this.getRefreshToken()) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${this.getAuthToken()}`;
          const retryResponse = await fetch(url, { ...config, headers });
          return this.handleResponse(retryResponse);
        }
      }

      return this.handleResponse(response);
    } catch (error) {
      console.error('API Request Error:', error);
      throw new Error(error.message || 'Network error. Please check your connection.');
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.error || data.message || 'An error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  async refreshToken() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setAuthToken(data.token);
        if (data.refreshToken) {
          this.setRefreshToken(data.refreshToken);
        }
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    // Clear tokens on refresh failure
    this.setAuthToken(null);
    this.setRefreshToken(null);
    return false;
  }

  // HTTP Methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create singleton instance
const apiClient = new ApiClient(API_BASE_URL);

export { apiClient, API_BASE_URL };
export default apiClient;
