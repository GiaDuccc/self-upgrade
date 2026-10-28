import React from 'react';

export interface SunMoonSplitIconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

/**
 * Biểu tượng Ngày & Đêm (Sun & Moon split) chuyên dụng cho các thẻ việc Cả ngày (All-day tasks).
 * Mô phỏng chính xác vector từ thiết kế: nửa trái là mặt trời có tia sáng, giữa là trục dọc, nửa phải là trăng khuyết.
 */
export const SunMoonSplitIcon: React.FC<SunMoonSplitIconProps> = ({
  size = 13,
  className,
  strokeWidth = 2,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    aria-hidden="true"
  >
    {/* Trục dọc thẳng đứng ở giữa phân chia Ngày & Đêm */}
    <line x1="13.5" y1="2" x2="13.5" y2="22" />

    {/* Mặt trời ban ngày (bên trái trục dọc) */}
    <circle cx="7" cy="12" r="3" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="10" y1="12" x2="12" y2="12" />
    <line x1="7" y1="5" x2="7" y2="7" />
    <line x1="7" y1="17" x2="7" y2="19" />
    <line x1="3.5" y1="8.5" x2="4.9" y2="9.9" />
    <line x1="10.5" y1="8.5" x2="9.1" y2="9.9" />
    <line x1="3.5" y1="15.5" x2="4.9" y2="14.1" />
    <line x1="10.5" y1="15.5" x2="9.1" y2="14.1" />

    {/* Mặt trăng khuyết ban đêm (bên phải trục dọc) */}
    <path d="M 16.5 6.5 A 5.5 5.5 0 0 1 16.5 17.5 A 10 10 0 0 0 16.5 6.5 Z" />
  </svg>
);
