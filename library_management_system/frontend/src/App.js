import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoginPage, RegisterPage, UserPage, AdminPage, Home } from './pages';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import Header from './components/common/Header';
import './App.css';
import BorrowedBook from './pages/BorrowedBook';
import OurBooks from './pages/OurBooks';
import AccountSettings from './pages/AccountSettings';
import Chatbot from './components/Chatbot/Chatbot';

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        {/* public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* public book browsing (if you want it protected, wrap with ProtectedRoute) */}
        <Route path="/books" element={<OurBooks />} />

        {/* protected user routes */}
        <Route
          path="/borrowed"
          element={
            <ProtectedRoute>
              <BorrowedBook />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />

        {/* admin route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
