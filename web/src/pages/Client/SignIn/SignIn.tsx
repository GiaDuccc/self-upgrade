import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LogIn, Mail, Lock, ArrowRight } from 'lucide-react';
import { signInClientAPI, checkServerHealthAPI } from '~/apis/clientAPI/authApi';
import { AuthSkeleton } from '~/components/Skeleton/Skeleton';

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const navigate = useNavigate();

  // Kiểm tra Backend đã khởi động xong chưa, tự động thăm dò mỗi 2s
  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const checkServer = async () => {
      const ok = await checkServerHealthAPI();
      if (!isMounted) return;
      if (ok) {
        setIsServerReady(true);
      } else {
        setIsServerReady(false);
        pollTimer = setTimeout(checkServer, 2000);
      }
    };

    checkServer();

    const handleFocus = () => {
      checkServer();
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.warning('Vui lòng nhập đầy đủ Gmail và mật khẩu!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInClientAPI({
        email: email.trim().toLowerCase(),
        password,
      });

      localStorage.setItem('accessTokenClient', res.accessToken);
      localStorage.setItem('userInfoClient', JSON.stringify(res.user));

      toast.success('Đăng nhập thành công!');
      navigate('/', { replace: true });
    } catch (error: any) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        'Đăng nhập thất bại! Vui lòng kiểm tra lại thông tin.';
      toast.error(msg);

      if (status === 403) {
        navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu Backend chưa khởi động xong (Render cold-start hoặc chưa chạy BE) -> hiển thị Skeleton loading 1:1
  if (!isServerReady) {
    return <AuthSkeleton mode="signin" />;
  }

  return (
    <div className="auth-page-shell">
      <div className="auth-card">
        <div className="auth-brand-header">
          <img src="/logo.png" alt="Self Upgrade" className="auth-logo-img" />
          <div>
            <h1 className="auth-title">SELF UPGRADE</h1>
            <p className="auth-subtitle">
              Đăng nhập hệ thống rèn luyện kỷ luật cá nhân
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="signin-email" className="form-label">
              GMAIL / EMAIL <span className="required-star">*</span>
            </label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="signin-email"
                type="email"
                className="form-input auth-input-with-icon"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signin-password" className="form-label">
              MẬT KHẨU <span className="required-star">*</span>
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="signin-password"
                type="password"
                className="form-input auth-input-with-icon"
                placeholder="Nhập mật khẩu của bạn..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-minimal btn-save-task auth-submit-btn"
            disabled={isLoading}
          >
            <LogIn size={16} />
            <span>{isLoading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}</span>
          </button>
        </form>

        <div className="auth-footer-links">
          <span>Chưa có tài khoản?</span>
          <Link to="/sign-up" className="auth-link">
            <span>Đăng ký bằng Gmail</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};
