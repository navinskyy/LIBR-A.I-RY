import React from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentUser } from '../../services/auth';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin } = getCurrentUser();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/user" />;
  return children;
};