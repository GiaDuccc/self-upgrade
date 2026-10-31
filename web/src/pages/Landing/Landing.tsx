import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bot,
  Brain,
  CheckSquare,
  Droplets,
  Dumbbell,
  Flame,
  LayoutDashboard,
  LogIn,
  Moon,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  Zap,
} from 'lucide-react';
import { LandingDemoModal } from './LandingDemos';

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
  demoKey: string;
}

const FEATURES: Feature[] = [
  {
    icon: LayoutDashboard,
    title: 'Tổng quan tháng & thứ hạng',
    desc: 'Biểu đồ cột, biểu đồ tròn, điểm trung bình, tổng điểm tích lũy và thứ hạng tháng — nhìn một cái là rõ tiến độ.',
    demoKey: 'overview',
  },
  {
    icon: CheckSquare,
    title: 'Tích việc & chấm điểm',
    desc: 'Lịch trình 24h dạng bảng, thang điểm 0/1/5/10 cho từng việc, tích nhanh một chạm và đặt lại ngày dễ dàng.',
    demoKey: 'checkin',
  },
  {
    icon: Brain,
    title: 'Trạng thái cá nhân & giấc ngủ',
    desc: 'Ghi nhận thể chất, tinh thần, cảm xúc và giấc ngủ mỗi ngày — cộng thêm điểm "vượt khó" khi cơ thể mệt mỏi.',
    demoKey: 'states',
  },
  {
    icon: Bot,
    title: 'AI Coach (Gemini)',
    desc: 'Trợ lý AI quan sát dữ liệu, ghi chú và trạng thái của bạn để nhận xét, động viên và gợi ý cải thiện cá nhân hóa.',
    demoKey: 'aicoach',
  },
  {
    icon: Droplets,
    title: 'Theo dõi nước uống',
    desc: 'Log nhanh 250ml bằng phím tắt, mục tiêu nước tự tính theo cân nặng, lịch sử rõ ràng trong ngày.',
    demoKey: 'water',
  },
  {
    icon: Flame,
    title: 'Calories & dinh dưỡng',
    desc: 'Ghi bữa ăn, phân tích macro và calo tự động, đánh giá chất lượng dinh dưỡng mỗi ngày.',
    demoKey: 'calories',
  },
  {
    icon: Dumbbell,
    title: 'Tập luyện (Gym)',
    desc: 'Lưu buổi tập theo nhóm cơ và bài tập, AI Gym phân tích khối lượng, hiệu suất và gợi ý phục hồi.',
    demoKey: 'workout',
  },
  {
    icon: Zap,
    title: 'Tùy chỉnh & phím tắt',
    desc: 'Giao diện sáng/tối, song ngữ VI/EN, sao lưu & khôi phục JSON, bộ phím tắt điều khiển toàn hệ thống.',
    demoKey: 'shortcuts',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Tạo tài khoản Gmail',
    desc: 'Đăng ký nhanh, xác thực email và đăng nhập chỉ trong vài bước.',
  },
  {
    num: '02',
    title: 'Thiết lập hồ sơ & mục tiêu',
    desc: 'Chọn trọng tâm ×1.25, phong cách AI Coach và mục tiêu tập luyện riêng.',
  },
  {
    num: '03',
    title: 'Tích việc mỗi ngày',
    desc: 'Hoàn thành thói quen, nhận điểm số và để AI Coach đồng hành nâng cấp bản thân.',
  },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Quan sát các phần tử `.reveal` trong root và thêm `.is-visible` khi vào viewport. */
function useRevealOnScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>('.reveal'));
    if (items.length === 0) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach((el) => io.observe(el));

    // Fallback: nếu IO không kích hoạt (tab ẩn, trình duyệt cũ) thì hiện toàn bộ để tránh nội dung bị ẩn
    const fallback = window.setTimeout(() => {
      const anyVisible = items.some((el) => el.classList.contains('is-visible'));
      if (!anyVisible) {
        items.forEach((el) => el.classList.add('is-visible'));
      }
    }, 2500);

    return () => {
      window.clearTimeout(fallback);
      io.disconnect();
    };
  }, []);

  return ref;
}

/** Hiệu ứng "từ tính": phần tử hút nhẹ theo con trỏ khi hover. */
function useMagnetic<T extends HTMLElement>(strength = 0.25) {
  const ref = useRef<T>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transition = 'transform 0.12s ease-out';
    el.style.transform = `translate(${(dx * strength).toFixed(1)}px, ${(dy * strength).toFixed(1)}px)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'translate(0, 0)';
  };

  return { ref, onMouseMove, onMouseLeave };
}

/** Hiệu ứng nghiêng 3D + spotlight theo con trỏ cho thẻ. */
function useTilt<T extends HTMLElement>(max = 7) {
  const ref = useRef<T>(null);

  const onMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;

    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.style.transition = 'transform 0.1s ease-out';
    const rx = (0.5 - py) * max;
    const ry = (px - 0.5) * max;
    el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
  };

  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = '';
  };

  return { ref, onMouseMove, onMouseLeave };
}

type MagneticLinkProps = React.ComponentProps<typeof Link> & { strength?: number };

const MagneticLink: React.FC<MagneticLinkProps> = ({ strength = 0.25, children, ...rest }) => {
  const { ref, onMouseMove, onMouseLeave } = useMagnetic<HTMLAnchorElement>(strength);
  return (
    <Link {...rest} ref={ref} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      {children}
    </Link>
  );
};

const FeatureCard: React.FC<{ feature: Feature; onOpenDemo: (key: string) => void }> = ({
  feature,
  onOpenDemo,
}) => {
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLElement>(7);
  const Icon = feature.icon;

  return (
    <article
      ref={ref}
      className="lp-feature-card"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <span className="lp-card-spotlight" aria-hidden="true" />
      <div className="lp-feature-icon">
        <Icon size={20} aria-hidden="true" />
      </div>
      <h3 className="lp-feature-title">{feature.title}</h3>
      <p className="lp-feature-desc">{feature.desc}</p>
      <button
        type="button"
        className="lp-demo-btn"
        onClick={() => onOpenDemo(feature.demoKey)}
        aria-label={`Dùng thử tính năng: ${feature.title}`}
      >
        <MousePointerClick size={14} aria-hidden="true" />
        <span>Dùng thử ngay</span>
        <ArrowRight size={13} aria-hidden="true" className="lp-demo-btn-arrow" />
      </button>
    </article>
  );
};

export const Landing: React.FC = () => {
  const shellRef = useRevealOnScroll<HTMLDivElement>();
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const raw = localStorage.getItem('app_settings');
      return raw && JSON.parse(raw)?.theme === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      const raw = localStorage.getItem('app_settings');
      const settings = raw ? JSON.parse(raw) : {};
      localStorage.setItem('app_settings', JSON.stringify({ ...settings, theme }));
    } catch {
      localStorage.setItem('app_settings', JSON.stringify({ theme }));
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Thanh tiến trình cuộn + đổi trạng thái navbar khi cuộn
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        const p = max > 0 ? doc.scrollTop / max : 0;
        if (progressRef.current) {
          progressRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
        }
        navRef.current?.classList.toggle('is-scrolled', window.scrollY > 8);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Parallax nhẹ cho nền hero theo con trỏ
  const handleHeroMouseMove = (e: React.MouseEvent) => {
    const el = heroRef.current;
    if (!el || prefersReducedMotion()) return;
    const r = el.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--hx', `${(nx * 26).toFixed(1)}px`);
    el.style.setProperty('--hy', `${(ny * 26).toFixed(1)}px`);
  };

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById('features')?.scrollIntoView({
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const hasToken = !!localStorage.getItem('accessTokenClient');
  if (hasToken) {
    return <Navigate to="/tong-quan-thang" replace />;
  }

  return (
    <div className="lp-shell" ref={shellRef}>
      <div className="lp-progress" ref={progressRef} aria-hidden="true" />

      {/* ===== NAVBAR ===== */}
      <header className="lp-nav" ref={navRef}>
        <div className="lp-nav-inner">
          <Link to="/" className="lp-brand" aria-label="Self Upgrade — trang chủ">
            <img src="/logo.png" alt="" className="lp-brand-logo" />
            <span className="lp-brand-name">SELF UPGRADE</span>
          </Link>
          <nav className="lp-nav-actions" aria-label="Điều hướng">
            <button
              type="button"
              className="lp-nav-theme-btn"
              onClick={handleToggleTheme}
              aria-label={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
              title={theme === 'light' ? 'Chế độ tối' : 'Chế độ sáng'}
            >
              {theme === 'light' ? (
                <Moon size={17} aria-hidden="true" />
              ) : (
                <Sun size={17} aria-hidden="true" />
              )}
            </button>
            <Link to="/sign-in" className="btn-minimal lp-nav-login">
              <LogIn size={15} aria-hidden="true" />
              <span>Đăng nhập</span>
            </Link>
            <MagneticLink to="/sign-up" className="lp-btn-primary">
              <span>Bắt đầu ngay</span>
              <ArrowRight size={16} aria-hidden="true" />
            </MagneticLink>
          </nav>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section className="lp-hero" ref={heroRef} onMouseMove={handleHeroMouseMove}>
        <div className="lp-hero-bg" aria-hidden="true">
          <span className="lp-orb lp-orb-a" />
          <span className="lp-orb lp-orb-b" />
          <span className="lp-orb lp-orb-c" />
        </div>
        <div className="lp-hero-inner">
          <span className="lp-eyebrow reveal">
            <Sparkles size={14} aria-hidden="true" className="lp-sparkle" />
            Hệ thống rèn luyện kỷ luật cá nhân
          </span>
          <h1 className="lp-title reveal" style={{ transitionDelay: '80ms' }}>
            KỶ LUẬT LÀ TỰ DO
          </h1>
          <p className="lp-subtitle reveal" style={{ transitionDelay: '160ms' }}>
            Tự nâng cấp bản thân mỗi ngày — theo dõi thói quen, chấm điểm nỗ lực
            và nhận lời khuyên từ AI Coach cho riêng bạn.
          </p>
          <div className="lp-cta-row reveal" style={{ transitionDelay: '240ms' }}>
            <MagneticLink to="/sign-up" className="lp-btn-primary lp-btn-lg" strength={0.3}>
              <span>Bắt đầu miễn phí</span>
              <ArrowRight size={17} aria-hidden="true" />
            </MagneticLink>
            <a href="#features" onClick={scrollToFeatures} className="btn-minimal lp-btn-lg">
              <span>Khám phá tính năng</span>
            </a>
          </div>
          <div className="lp-hero-stats reveal" style={{ transitionDelay: '320ms' }}>
            <div className="lp-stat">
              <span className="lp-stat-value">0–10đ</span>
              <span className="lp-stat-label">chấm điểm / việc</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-value">24/7</span>
              <span className="lp-stat-label">AI Coach đồng hành</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-value">
                <ShieldCheck size={15} aria-hidden="true" /> Riêng tư
              </span>
              <span className="lp-stat-label">dữ liệu của bạn</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TÍNH NĂNG ===== */}
      <section id="features" className="lp-section">
        <div className="lp-section-inner">
          <div className="lp-section-head reveal">
            <h2 className="lp-section-title">ĐIỂM NỔI BẬT</h2>
            <p className="lp-section-desc">
              Một bảng điều khiển tối giản gói gọn toàn bộ hành trình kỷ luật của bạn.
            </p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div
                className="reveal lp-feature-grid-item"
                key={f.title}
                style={{ transitionDelay: `${i * 55}ms` }}
              >
                <FeatureCard feature={f} onOpenDemo={setActiveDemo} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CÁCH HOẠT ĐỘNG ===== */}
      <section className="lp-section lp-section-alt">
        <div className="lp-section-inner">
          <div className="lp-section-head reveal">
            <h2 className="lp-section-title">BẮT ĐẦU NHƯ THẾ NÀO</h2>
            <p className="lp-section-desc">
              Ba bước đơn giản để biến kỷ luật thành thói quen mỗi ngày.
            </p>
          </div>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div
                className="lp-step reveal"
                key={s.num}
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <span className="lp-step-num">{s.num}</span>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA CUỐI ===== */}
      <section className="lp-cta-banner">
        <div className="lp-cta-banner-inner reveal">
          <Target size={26} aria-hidden="true" className="lp-cta-icon" />
          <h2 className="lp-cta-title">Sẵn sàng nâng cấp bản thân?</h2>
          <p className="lp-cta-desc">
            Tham gia ngay để bắt đầu chấm điểm nỗ lực và xây dựng kỷ luật thép.
          </p>
          <MagneticLink to="/sign-up" className="lp-btn-primary lp-btn-lg" strength={0.3}>
            <span>Tạo tài khoản miễn phí</span>
            <ArrowRight size={17} aria-hidden="true" />
          </MagneticLink>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <span>SELF UPGRADE — Minimalist Personal Discipline Tracker</span>
        <span>Kỷ luật là tự do • Tự nâng cấp bản thân mỗi ngày</span>
      </footer>

      {/* ===== MODAL DEMO TƯƠNG TÁC ===== */}
      <LandingDemoModal demoKey={activeDemo} onClose={() => setActiveDemo(null)} />
    </div>
  );
};
