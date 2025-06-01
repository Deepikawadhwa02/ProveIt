import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  const hasAccess = () => {
    if (!allowedRoles) return true;
    return allowedRoles.includes(user?.role ?? '');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !hasAccess()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;