import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';
import { signUpAPI, checkServerHealthAPI } from '~/apis/clientAPI/authApi';
import { AuthSkeleton } from '~/components/Skeleton/Skeleton';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password || !confirmPassword) {
      toast.warning('Vui lòng nhập đầy đủ Gmail, mật khẩu và xác nhận mật khẩu!');
      return;
    }

    if (password.length < 6) {
      toast.warning('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    if (password !== confirmPassword) {
      toast.warning('Mật khẩu nhập lại không khớp! Vui lòng kiểm tra lại.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpAPI({
        email: cleanEmail,
        password,
      });

      if (res.emailSent) {
        toast.success(res.message || 'Đăng ký thành công! Vui lòng xác nhận email.');
      } else {
        toast.warning(res.message || 'Chưa gửi được email xác nhận, vui lòng bấm Gửi lại mã!');
      }

      const verifyParams = new URLSearchParams({ email: cleanEmail });
      if (res.devVerifyCode) {
        verifyParams.set('devCode', res.devVerifyCode);
      }
      navigate(`/verify-email?${verifyParams.toString()}`);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        'Đăng ký thất bại! Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Nếu Backend chưa khởi động xong (Render cold-start hoặc chưa chạy BE) -> hiển thị Skeleton loading 1:1
  if (!isServerReady) {
    return <AuthSkeleton mode="signup" />;
  }

  return (
    <div className="auth-page-shell">
      <div className="auth-card">
        <div className="auth-brand-header">
          <img src="/logo.png" alt="Self Upgrade" className="auth-logo-img" />
          <div>
            <h1 className="auth-title">ĐĂNG KÝ TÀI KHOẢN</h1>
            <p className="auth-subtitle">
              Chỉ cần Gmail & Mật khẩu — Thông tin cá nhân sẽ được thiết lập sau khi đăng nhập
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-email" className="form-label">
              ĐỊA CHỈ GMAIL <span className="required-star">*</span>
            </label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                className="form-input auth-input-with-icon"
                placeholder="yourname@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signup-password" className="form-label">
              MẬT KHẨU (TỐI THIỂU 6 KÝ TỰ) <span className="required-star">*</span>
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                className="form-input auth-input-with-icon"
                placeholder="Nhập mật khẩu bảo mật..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Ô nhập lại mật khẩu xác nhận */}
          <div className="form-group">
            <label htmlFor="signup-confirm-password" className="form-label">
              NHẬP LẠI MẬT KHẨU <span className="required-star">*</span>
            </label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" aria-hidden="true" />
              <input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                className="form-input auth-input-with-icon"
                placeholder="Nhập lại mật khẩu để xác nhận..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-minimal btn-save-task auth-submit-btn"
            disabled={isLoading}
          >
            <UserPlus size={16} />
            <span>{isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký & Nhận mã xác nhận'}</span>
          </button>
        </form>

        <div className="auth-footer-links">
          <Link to="/sign-in" className="auth-link">
            <ArrowLeft size={14} />
            <span>Đã có tài khoản? Quay lại Đăng nhập</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
