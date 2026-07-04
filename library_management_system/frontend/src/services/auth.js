import api from './api';
import { jwtDecode } from 'jwt-decode';

// REGISTER
export const registerUser = async (userData) => {
  try {
    // if api.baseURL = '/api', this hits /api/auth/register/
    const response = await api.post('/auth/register/', {
      username: userData.username,
      email: userData.email,
      password: userData.password,
    });

    const { access, refresh, user } = response.data;

    // store tokens using the same key api.js reads
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAdmin', user.is_staff ? 'true' : 'false');
    }

    return user;
  } catch (error) {
    console.error('❌ Registration failed:', error.response?.data || error.message);
    throw error;
  }
};

// LOGIN
export const loginUser = async (credentials) => {
  try {
    // if api.baseURL = '/api', this hits /api/auth/login/
    const response = await api.post('/auth/login/', credentials);

    const { access, refresh, user } = response.data;

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isAdmin', user.is_staff ? 'true' : 'false');
    }

    return user;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// LOGOUT
export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('isAdmin');
};

// GET CURRENT USER
export const getCurrentUser = () => {
  const token = localStorage.getItem('accessToken');

  if (!token) {
    return { isAuthenticated: false };
  }

  try {
    const decoded = jwtDecode(token);
    const user = localStorage.getItem('user')
      ? JSON.parse(localStorage.getItem('user'))
      : null;

    const isAdmin =
      localStorage.getItem('isAdmin') === 'true' || user?.is_staff || false;

    return {
      isAuthenticated: true,
      user,
      isAdmin,
      exp: decoded.exp,
    };
  } catch (error) {
    console.warn('⚠️ Failed to decode token:', error);
    logout();
    return { isAuthenticated: false };
  }
};
