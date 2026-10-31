import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isTransientNetworkError, tryRefreshTokenClient } from '~/apis/axiosClient';
import { AsciiReveal } from 'ascii-reveal';
import { SessionRestoreSkeleton } from '~/components/Skeleton/Skeleton';

export const ProtectedRoute: React.FC = () => {
  const [isChecking, setIsChecking] = useState<boolean>(() => {
    return !localStorage.getItem('accessTokenClient');
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('accessTokenClient');
  });
  const [isWaitingForServer, setIsWaitingForServer] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const verifyOrRestoreSession = async () => {
      const token = localStorage.getItem('accessTokenClient');
      if (token) {
        if (isMounted) {
          setIsAuthenticated(true);
          setIsWaitingForServer(false);
          setIsChecking(false);
        }
        return;
      }

      // Nếu accessToken bị mất trong localStorage, dùng cookie refreshTokenClient để xin cấp lại accessToken.
      // Nếu BE đang reload / cold-start (lỗi mạng hoặc 502-504), kiên nhẫn chờ BE khởi động xong thay vì đá ra /sign-in.
      try {
        const newAccessToken = await tryRefreshTokenClient(1);
        if (!isMounted) return;
        if (newAccessToken) {
          setIsAuthenticated(true);
          setIsWaitingForServer(false);
          setIsChecking(false);
        } else {
          setIsAuthenticated(false);
          setIsChecking(false);
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (isTransientNetworkError(err)) {
          setIsWaitingForServer(true);
          retryTimer = setTimeout(verifyOrRestoreSession, 2000);
          return;
        }
        setIsWaitingForServer(false);
        setIsAuthenticated(false);
        setIsChecking(false);
      }
    };

    verifyOrRestoreSession();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  if (isChecking) {
    return (
      <AsciiReveal loading={true}>
        <SessionRestoreSkeleton
          hint={
            isWaitingForServer
              ? 'Máy chủ đang khởi động, đang tự động khôi phục phiên đăng nhập...'
              : undefined
          }
        />
      </AsciiReveal>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return <Outlet />;
};
