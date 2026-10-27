import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import { getApiRoot } from '~/utils/constants';

export const ProtectedRoute: React.FC = () => {
  const [isChecking, setIsChecking] = useState<boolean>(() => {
    return !localStorage.getItem('accessTokenClient');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('accessTokenClient');
  });

  useEffect(() => {
    const token = localStorage.getItem('accessTokenClient');
    if (token) {
      setIsAuthenticated(true);
      setIsChecking(false);
      return;
    }

    // Nếu accessToken bị mất trong localStorage, thử dùng cookie refreshTokenClient để xin cấp lại accessToken
    const apiBase = `${getApiRoot()}/v1`;

    axios
      .put(
        `${apiBase}/auth/refreshTokenClient`,
        {},
        { withCredentials: true }
      )
      .then((res) => {
        const newAccessToken = res.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('accessTokenClient', newAccessToken);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('accessTokenClient');
        localStorage.removeItem('userInfoClient');
        setIsAuthenticated(false);
      })
      .finally(() => {
        setIsChecking(false);
      });
  }, []);

  if (isChecking) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: 'var(--bg-primary, #FAF7F2)',
        }}
      >
        <div className="spinner-sm" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
};

