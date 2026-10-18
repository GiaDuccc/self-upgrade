import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { resendVerificationAPI, verifyEmailAPI } from '~/apis/clientAPI/authApi';

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const urlToken = searchParams.get('token') || '';
  const initialDevCode = searchParams.get('devCode') || '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [devCodeHint, setDevCodeHint] = useState(initialDevCode);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  // Tự động xác thực nếu người dùng nhấn vào link xác thực trong email (có chứa token)
  useEffect(() => {
    if (initialEmail && urlToken) {
      setIsLoading(true);
      verifyEmailAPI({ email: initialEmail, token: urlToken })
        .then((res) => {
          toast.success(res.message || 'Xác thực email thành công!');
          navigate('/sign-in', { replace: true });
        })
        .catch((err) => {
          toast.error(
            err?.response?.data?.message || 'Đường dẫn xác thực không hợp lệ hoặc đã hết hạn!'
          );
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialEmail, urlToken, navigate]);

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !code.trim()) {
      toast.warning('Vui lòng nhập đầy đủ email và mã OTP 6 chữ số!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyEmailAPI({
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });
      toast.success(res.message || 'Xác thực email thành công!');
      navigate('/sign-in', { replace: true });
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Mã xác nhận không chính xác!'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      toast.warning('Vui lòng nhập địa chỉ email để gửi lại mã!');
      return;
    }

    setIsResending(true);
    try {
      const res = await resendVerificationAPI({
        email: email.trim().toLowerCase(),
      });
      if (res.devVerifyCode) {
        setDevCodeHint(res.devVerifyCode);
      }
      toast.info(res.message || 'Đã gửi lại mã xác nhận mới!');
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || 'Không thể gửi lại mã xác nhận!'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-card">
        <div className="auth-brand-header">
          <div className="modal-icon-badge">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="auth-title">XÁC NHẬN EMAIL</h1>
            <p className="auth-subtitle">
              Nhập mã OTP 6 chữ số đã được gửi tới hộp thư Gmail của bạn
            </p>
          </div>
        </div>

        {devCodeHint && (
          <div className="auth-dev-otp-banner">
            <div>
              <span>Mã OTP xác nhận (Dev/Test): </span>
              <strong>{devCodeHint}</strong>
            </div>
            <button
              type="button"
              className="btn-minimal btn-sm"
              onClick={() => setCode(devCodeHint)}
            >
              Điền nhanh
            </button>
          </div>
        )}

        <form onSubmit={handleVerifySubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="verify-email" className="form-label">
              GMAIL ĐĂNG KÝ
            </label>
            <input
              id="verify-email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yourname@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="verify-code" className="form-label">
              MÃ XÁC NHẬN 6 SỐ <span className="required-star">*</span>
            </label>
            <input
              id="verify-code"
              type="text"
              maxLength={6}
              className="form-input auth-otp-input"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="btn-minimal btn-save-task auth-submit-btn"
            disabled={isLoading}
          >
            <CheckCircle2 size={16} />
            <span>{isLoading ? 'Đang xác thực...' : 'Xác nhận kích hoạt tài khoản'}</span>
          </button>
        </form>

        <div className="auth-footer-links auth-footer-split">
          <Link to="/sign-in" className="auth-link">
            <ArrowLeft size={14} />
            <span>Quay lại Đăng nhập</span>
          </Link>

          <button
            type="button"
            className="btn-minimal btn-sm"
            onClick={handleResendCode}
            disabled={isResending}
          >
            <RefreshCw size={13} className={isResending ? 'spin-anim' : ''} />
            <span>{isResending ? 'Đang gửi...' : 'Gửi lại mã'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

