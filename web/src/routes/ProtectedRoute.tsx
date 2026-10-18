import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('accessTokenClient');
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }
  return <Outlet />;
};

