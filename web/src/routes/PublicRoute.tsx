import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const PublicRoute: React.FC = () => {
  const token = localStorage.getItem('accessTokenClient');
  if (token) {
    return <Navigate to="/tong-quan-thang" replace />;
  }
  return <Outlet />;
};

