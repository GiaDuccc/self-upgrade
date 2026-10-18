import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { UserPlus, Mail, Lock, ArrowLeft } from 'lucide-react';
import { signUpAPI } from '~/apis/clientAPI/authApi';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      toast.warning('Vui lòng nhập đầy đủ Gmail và mật khẩu!');
      return;
    }

    if (password.length < 6) {
      toast.warning('Mật khẩu phải có ít nhất 6 ký tự!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpAPI({
        email: cleanEmail,
        password,
      });

      toast.success(res.message || 'Đăng ký thành công! Vui lòng xác nhận email.');

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
              <Mail size={16} className="auth-input-icon" />
              <input
                id="signup-email"
                type="email"
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
              <Lock size={16} className="auth-input-icon" />
              <input
                id="signup-password"
                type="password"
                className="form-input auth-input-with-icon"
                placeholder="Nhập mật khẩu bảo mật..."
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

