import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken'); // <-- match your login storage key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Book-related API
export const getBooks = () => api.get('/books/list/');
export const searchBooks = (query) =>
  api.get(`/books/search/?q=${encodeURIComponent(query)}`);
export const addBook = (bookData) => api.post('/books/add/', bookData);
export const updateBook = (id, bookData) => api.put(`/books/update/${id}/`, bookData);
export const deleteBook = (id) => api.delete(`/books/delete/${id}/`);
export const borrowBook = (id) => api.post('/reservations/reserve/', { book_id: id });
export const returnBook = (id) => api.post(`/reservations/return/${id}/`);

// Auth-related API (no /auth/ prefix now)
export const registerUser = (userData) => api.post('/register/', userData);
export const loginUser = (credentials) => api.post('/login/', credentials);
export const getCurrentUserProfile = () => api.get('/me/');
export const changePassword = (data) => api.post('/change-password/', data);

// Reservations API
export const getReservationHistory = () => api.get('/reservations/history/');

// Chatbot API (for completeness)
export const sendChatMessage = (message) =>
  api.post('/chatbot/chat/', { message });

export default api;
