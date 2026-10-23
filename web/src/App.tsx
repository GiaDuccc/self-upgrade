import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { ClientPage } from '~/pages/Client/ClientPage';
import { Dashboard } from '~/pages/Client/Dashboard/Dashboard';
import { DayDetail } from '~/pages/Client/DayDetail/DayDetail';
import { SignIn } from '~/pages/Client/SignIn/SignIn';
import { SignUp } from '~/pages/Client/SignUp/SignUp';
import { VerifyEmail } from '~/pages/Client/VerifyEmail/VerifyEmail';
import { ProtectedRoute } from '~/routes/ProtectedRoute';
import { PublicRoute } from '~/routes/PublicRoute';

export default function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC AUTH ROUTES */}
        <Route element={<PublicRoute />}>
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Route>

        {/* PROTECTED CLIENT ROUTES (SEPARATED PAGES: DASHBOARD & DAY DETAIL) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ClientPage />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/day/:dateKey" element={<DayDetail />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={2800}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}

