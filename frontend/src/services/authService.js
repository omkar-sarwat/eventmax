// EventMax Auth Service
// Handles all authentication related API calls

import api from './api';

const authService = {
  // Login user
  // Backend: POST /api/auth/login
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    
    if (response.success && response.data) {
      const { token, refreshToken, user } = response.data;
      api.setAuthToken(token);
      api.setRefreshToken(refreshToken);
      localStorage.setItem('user', JSON.stringify(this.formatUser(user)));
      return { user: this.formatUser(user), token };
    }
    
    throw new Error(response.error || 'Invalid email or password');
  },

  // Register new user
  // Backend: POST /api/auth/register
  async register(userData) {
    const response = await api.post('/auth/register', {
      email: userData.email,
      password: userData.password,
      firstName: userData.name?.split(' ')[0] || userData.firstName || '',
      lastName: userData.name?.split(' ').slice(1).join(' ') || userData.lastName || '',
      phone: userData.phone || '',
      role: 'customer'
    });
    
    if (response.success && response.data) {
      const { token, refreshToken, user } = response.data;
      api.setAuthToken(token);
      api.setRefreshToken(refreshToken);
      localStorage.setItem('user', JSON.stringify(this.formatUser(user)));
      return { user: this.formatUser(user), token };
    }
    
    throw new Error(response.error || 'Registration failed');
  },

  // Logout user
  // Backend: POST /api/auth/logout
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      api.setAuthToken(null);
      api.setRefreshToken(null);
      localStorage.removeItem('user');
    }
  },

  // Get current user profile
  // Backend: GET /api/auth/me
  async getProfile() {
    const response = await api.get('/auth/me');
    if (response.success && response.data) {
      const user = this.formatUser(response.data);
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    throw new Error(response.error || 'Failed to get profile');
  },

  // Update user profile
  // Backend: PUT /api/auth/profile
  async updateProfile(userData) {
    const response = await api.put('/auth/profile', {
      firstName: userData.name?.split(' ')[0] || userData.firstName,
      lastName: userData.name?.split(' ').slice(1).join(' ') || userData.lastName,
      phone: userData.phone,
      email: userData.email
    });
    if (response.success && response.data) {
      const user = this.formatUser(response.data);
      localStorage.setItem('user', JSON.stringify(user));
      return { user };
    }
    throw new Error(response.error || 'Failed to update profile');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!api.getAuthToken();
  },

  // Get stored user
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // Format user object for frontend
  formatUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || '',
      name: `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim(),
      firstName: user.first_name || user.firstName || '',
      lastName: user.last_name || user.lastName || '',
      phone: user.phone || '',
      role: user.role || 'customer',
      avatar: user.avatar || null,
      createdAt: user.created_at || user.createdAt
    };
  },

  // Verify token is valid by calling /auth/me
  async verifyToken() {
    try {
      const response = await api.get('/auth/me');
      return response.success;
    } catch {
      return false;
    }
  },
};

export default authService;
