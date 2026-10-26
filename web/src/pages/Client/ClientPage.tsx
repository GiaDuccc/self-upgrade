import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { signOutClientAPI } from '~/apis/clientAPI/authApi';
import {
  deleteTaskAPI,
  exportDisciplineDataAPI,
  getMonthDataAPI,
  importDisciplineDataAPI,
  saveTaskAPI,
} from '~/apis/clientAPI/disciplineApi';
import { updateUserProfileAPI } from '~/apis/clientAPI/userApi';
import { AiCoachWidget } from '~/components/AiCoachWidget/AiCoachWidget';
import { Footer } from '~/components/Footer/Footer';
import { Header } from '~/components/Header/Header';
import { ProfileModal } from '~/components/ProfileModal/ProfileModal';
import { SettingsModal } from '~/components/SettingsModal/SettingsModal';
import { TaskModal } from '~/components/TaskModal/TaskModal';
import { KeyboardShortcutsModal } from '~/components/KeyboardShortcutsModal/KeyboardShortcutsModal';
import { MonthStats, TaskItem, TaskScope } from '~/interface/discipline.interface';
import { UserProfile } from '~/interface/user.interface';
import {
  DEFAULT_USER_PROFILE,
  formatDateKey,
  getTodayInfo,
} from '~/utils/constants';
import { AppLanguage, LanguageContext } from '~/utils/i18n';

export interface ClientOutletContext {
  currentYear: number;
  currentMonth: number;
  selectedDateKey: string;
  setSelectedDateKey: React.Dispatch<React.SetStateAction<string>>;
  monthStats: MonthStats | null;
  userProfile: UserProfile;
  isLoadingMonth: boolean;
  refreshMonthStats: () => void;
  onOpenAddTaskModal: (preset?: Partial<TaskItem>) => void;
  onEditTask: (task: TaskItem) => void;
  onOpenProfileModal: () => void;
  onOpenSettingsModal: () => void;
  notifyAiCoach: (signal: string) => void;
  dayRefreshTrigger: number;
  isCaloriesEnabled: boolean;
  isWorkoutEnabled: boolean;
  isServerConnecting: boolean;
  theme: 'light' | 'dark';
  language: AppLanguage;
}

interface AppSettings {
  theme: 'light' | 'dark';
  enableCalories: boolean;
  enableWorkout: boolean;
  language: AppLanguage;
}

const getStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem('app_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        enableCalories: parsed.enableCalories !== false,
        enableWorkout: parsed.enableWorkout !== false,
        language: parsed.language === 'en' ? 'en' : 'vi',
      };
    }
  } catch {}
  return {
    theme: 'light',
    enableCalories: true,
    enableWorkout: true,
    language: 'vi',
  };
};

export const ClientPage: React.FC = () => {
  const today = useMemo(() => getTodayInfo(), []);
  const navigate = useNavigate();
  const location = useLocation();

  const [currentYear, setCurrentYear] = useState<number>(today.year);
  const [currentMonth, setCurrentMonth] = useState<number>(today.month);
  const [selectedDateKey, setSelectedDateKey] = useState<string>(today.dateKey);
  const [monthStats, setMonthStats] = useState<MonthStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [isProfileSetup, setIsProfileSetup] = useState<boolean>(true);
  const [isLoadingMonth, setIsLoadingMonth] = useState<boolean>(true);
  const [isServerConnecting, setIsServerConnecting] = useState<boolean>(false);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskModalMode, setTaskModalMode] = useState<'add' | 'edit'>('add');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const handleToggleTheme = useCallback((newTheme: 'light' | 'dark') => {
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  }, []);

  const handleToggleLanguage = useCallback((newLang: AppLanguage) => {
    setSettings((prev) => ({ ...prev, language: newLang }));
  }, []);

  const handleToggleCalories = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enableCalories: enabled }));
    const isEn = settings.language === 'en';
    toast.dismiss();
    toast.info(
      enabled
        ? isEn
          ? 'Enabled Calories & Nutrition mode'
          : 'Đã bật chế độ Calories & Dinh dưỡng'
        : isEn
        ? 'Disabled Calories & Nutrition mode'
        : 'Đã tắt chế độ Calories & Dinh dưỡng'
    );
  }, [settings.language]);

  const handleToggleWorkout = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enableWorkout: enabled }));
    const isEn = settings.language === 'en';
    toast.dismiss();
    toast.info(
      enabled
        ? isEn
          ? 'Enabled Gym & Workout Tracker'
          : 'Đã bật chế độ Theo dõi Tập luyện (Gym)'
        : isEn
        ? 'Disabled Gym & Workout Tracker'
        : 'Đã tắt chế độ Theo dõi Tập luyện (Gym)'
    );
  }, [settings.language]);

  const handleOpenSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
  }, []);

  const [aiTriggerSignal, setAiTriggerSignal] = useState<string>('');
  const [dayRefreshTrigger, setDayRefreshTrigger] = useState<number>(0);

  const storedUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('userInfoClient');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchMonthData = useCallback(async (isAutoRetry = false) => {
    try {
      const data = await getMonthDataAPI(currentYear, currentMonth);
      setMonthStats(data.monthStats);
      setUserProfile((prev) => {
        if (data.profile && JSON.stringify(prev) === JSON.stringify(data.profile)) {
          return prev;
        }
        return data.profile || DEFAULT_USER_PROFILE;
      });
      setIsProfileSetup(data.isProfileSetup);

      // Nếu trước đó đang chờ kết nối máy chủ -> thông báo thành công và kích hoạt refresh chi tiết ngày
      setIsServerConnecting((prevConnecting) => {
        if (prevConnecting) {
          toast.dismiss('server-connecting-toast');
          toast.success(
            settings.language === 'en'
              ? 'Successfully connected to server!'
              : 'Đã kết nối thành công với máy chủ!'
          );
          setDayRefreshTrigger((prev) => prev + 1);
        }
        return false;
      });

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      // Nếu đăng nhập lần đầu chưa thiết lập thông tin cá nhân -> tự động mở modal thiết lập
      if (!data.isProfileSetup) {
        setIsProfileModalOpen(true);
      }
    } catch (error: any) {
      const isNetworkOrColdStart =
        !error?.response ||
        error?.code === 'ERR_NETWORK' ||
        error?.code === 'ECONNABORTED' ||
        (error?.response?.status >= 502 && error?.response?.status <= 504);

      if (isNetworkOrColdStart) {
        setIsServerConnecting(true);
        if (!isAutoRetry) {
          toast.info(
            settings.language === 'en'
              ? 'Server is starting up, automatically reconnecting...'
              : 'Máy chủ đang khởi động, hệ thống đang tự động kết nối lại...',
            { toastId: 'server-connecting-toast', autoClose: 4000 }
          );
        }

        // Tự động thử kết nối lại sau 2.5 giây cho đến khi Backend sẵn sàng
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
        }
        reconnectTimerRef.current = setTimeout(() => {
          fetchMonthData(true);
        }, 2500);
      } else {
        toast.error('Không thể tải dữ liệu từ máy chủ!');
      }
    } finally {
      setIsLoadingMonth(false);
    }
  }, [currentYear, currentMonth, settings.language]);

  useEffect(() => {
    setIsLoadingMonth(true);
    fetchMonthData();
  }, [fetchMonthData]);

  // Tự động kiểm tra và kết nối lại ngay khi người dùng quay lại tab trình duyệt hoặc có mạng
  useEffect(() => {
    const handleRecheckOnFocus = () => {
      if (!monthStats) {
        fetchMonthData(true);
      }
    };

    window.addEventListener('focus', handleRecheckOnFocus);
    window.addEventListener('online', handleRecheckOnFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !monthStats) {
        handleRecheckOnFocus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleRecheckOnFocus);
      window.removeEventListener('online', handleRecheckOnFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [monthStats, fetchMonthData]);

  const handlePrevMonth = () => {
    let nextY = currentYear;
    let nextM = currentMonth - 1;
    if (nextM < 1) {
      nextM = 12;
      nextY -= 1;
    }
    const newDateKey = formatDateKey(nextY, nextM, 1);
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    setSelectedDateKey(newDateKey);

    if (location.pathname.startsWith('/day')) {
      navigate(`/day/${newDateKey}`);
    }
  };

  const handleNextMonth = () => {
    let nextY = currentYear;
    let nextM = currentMonth + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    const newDateKey = formatDateKey(nextY, nextM, 1);
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    setSelectedDateKey(newDateKey);

    if (location.pathname.startsWith('/day')) {
      navigate(`/day/${newDateKey}`);
    }
  };

  const handleJumpToday = () => {
    const t = getTodayInfo();
    setCurrentYear(t.year);
    setCurrentMonth(t.month);
    setSelectedDateKey(t.dateKey);
    navigate(`/day/${t.dateKey}`);
  };

  const handleOpenAddTaskModal = (preset?: Partial<TaskItem>) => {
    setTaskModalMode('add');
    setEditingTask(preset ? (preset as TaskItem) : null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setTaskModalMode('edit');
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (payload: {
    id?: string;
    title: string;
    category: string;
    timeHint: string;
    scope: TaskScope;
    dateKey: string;
    hour?: number;
    columnIndex?: number;
  }) => {
    try {
      await saveTaskAPI({
        mode: payload.id ? 'edit' : 'add',
        taskId: payload.id,
        title: payload.title,
        category: payload.category,
        timeHint: payload.timeHint,
        scope: payload.scope,
        dateKey: payload.dateKey,
        hour: payload.hour,
        columnIndex: payload.columnIndex,
      });
      toast.success(
        payload.id ? 'Đã cập nhật đầu việc!' : 'Đã thêm đầu việc mới!'
      );
      await fetchMonthData();
      setDayRefreshTrigger((c) => c + 1);
      return true;
    } catch {
      toast.error('Không thể lưu đầu việc!');
      return false;
    }
  };

  const handleDeleteTask = async (payload: {
    id: string;
    scope: TaskScope;
    dateKey: string;
  }) => {
    try {
      await deleteTaskAPI({
        taskId: payload.id,
        scope: payload.scope,
        dateKey: payload.dateKey,
      });
      toast.info('Đã xoá đầu việc!');
      await fetchMonthData();
      setDayRefreshTrigger((c) => c + 1);
    } catch {
      toast.error('Không thể xoá đầu việc!');
    }
  };

  const handleSaveProfile = async (newProf: UserProfile) => {
    try {
      const res = await updateUserProfileAPI(newProf);
      setUserProfile(res.user.profile);
      setIsProfileSetup(true);
      localStorage.setItem('userInfoClient', JSON.stringify(res.user));
      toast.success('Đã lưu thiết lập cá nhân hóa!');
      await fetchMonthData();
      setDayRefreshTrigger((c) => c + 1);
      setAiTriggerSignal(`PROFILE|${Date.now()}`);
    } catch {
      toast.error('Không thể lưu thông tin cá nhân!');
    }
  };

  const handleExportJson = async () => {
    try {
      const backupData = await exportDisciplineDataAPI();
      const dataStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `self-upgrade-backup-${today.dateKey}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Không thể xuất file sao lưu!');
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result || '{}'));
        if (parsed && typeof parsed === 'object') {
          await importDisciplineDataAPI(
            parsed.records ? parsed : { records: parsed }
          );
          toast.success('Khôi phục dữ liệu thành công!');
          await fetchMonthData();
          setDayRefreshTrigger((c) => c + 1);
        }
      } catch {
        toast.error('File JSON không hợp lệ!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLogout = async () => {
    try {
      await signOutClientAPI();
    } catch {
      // ignore
    } finally {
      localStorage.removeItem('accessTokenClient');
      localStorage.removeItem('userInfoClient');
      toast.info('Đã đăng xuất tài khoản!');
      navigate('/sign-in', { replace: true });
    }
  };

  const currentDayTasks = useMemo(() => {
    if (!monthStats) return [];
    const found = monthStats.daysList.find((d) => d.dateKey === selectedDateKey);
    return found?.tasksList || [];
  }, [monthStats, selectedDateKey]);

  const handleOpenProfileModal = useCallback(() => {
    setIsProfileModalOpen(true);
  }, []);

  const handleOpenShortcutsModal = useCallback(() => {
    setIsShortcutsModalOpen(true);
  }, []);

  // Khóa cuộn trang nền khi có bất kỳ modal nào mở
  const isAnyModalOpen =
    isTaskModalOpen ||
    isProfileModalOpen ||
    isSettingsModalOpen ||
    isShortcutsModalOpen;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [isAnyModalOpen]);

  // Lắng nghe phím tắt toàn hệ thống (Global Keyboard Shortcuts)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Phím Escape: đóng modal đang mở
      if (e.key === 'Escape') {
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        if (isSettingsModalOpen) {
          setIsSettingsModalOpen(false);
          return;
        }
        if (isProfileModalOpen && isProfileSetup) {
          setIsProfileModalOpen(false);
          return;
        }
        if (isTaskModalOpen) {
          setIsTaskModalOpen(false);
          return;
        }
      }

      // 2. Không can thiệp nếu người dùng đang nhập liệu trong input, textarea, select hoặc contentEditable
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag || '') ||
        target?.isContentEditable
      ) {
        return;
      }

      // 3. Phím ? hoặc Shift + /: Mở bảng tra cứu phím tắt
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // Nếu đang có modal mở phía trên thì chặn các thao tác chuyển trang/mở modal khác
      if (isTaskModalOpen || isProfileModalOpen || isSettingsModalOpen || isShortcutsModalOpen) {
        return;
      }

      // Bỏ qua nếu đang giữ Ctrl, Alt hoặc Meta (Cmd) để không tranh chấp với phím tắt hệ thống
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();

      // Phím T: Về hôm nay
      if (key === 't') {
        e.preventDefault();
        handleJumpToday();
        return;
      }

      // Phím M: Về tổng quan tháng
      if (key === 'm') {
        e.preventDefault();
        navigate('/');
        return;
      }

      // Phím A: Mở modal thêm việc mới
      if (key === 'a') {
        e.preventDefault();
        handleOpenAddTaskModal();
        return;
      }

      // Phím P: Mở hồ sơ & trạng thái
      if (key === 'p') {
        e.preventDefault();
        handleOpenProfileModal();
        return;
      }

      // Phím S: Mở cài đặt hệ thống
      if (key === 's') {
        e.preventDefault();
        handleOpenSettingsModal();
        return;
      }

      // Phím [ hoặc ArrowLeft: Lùi 1 ngày (khi ở Day Detail) hoặc Lùi 1 tháng (khi ở Dashboard)
      if (e.key === 'ArrowLeft' || e.key === '[') {
        e.preventDefault();
        if (location.pathname.startsWith('/day')) {
          const match = location.pathname.match(/^\/day\/(\d{4}-\d{2}-\d{2})/);
          const cur = match ? match[1] : selectedDateKey;
          const [y, m, d] = cur.split('-').map(Number);
          const dt = new Date(y, m - 1, d - 1);
          const nextKey = formatDateKey(
            dt.getFullYear(),
            dt.getMonth() + 1,
            dt.getDate()
          );
          setSelectedDateKey(nextKey);
          navigate(`/day/${nextKey}`);
        } else {
          handlePrevMonth();
        }
        return;
      }

      // Phím ] hoặc ArrowRight: Tiến 1 ngày (khi ở Day Detail) hoặc Tiến 1 tháng (khi ở Dashboard)
      if (e.key === 'ArrowRight' || e.key === ']') {
        e.preventDefault();
        if (location.pathname.startsWith('/day')) {
          const match = location.pathname.match(/^\/day\/(\d{4}-\d{2}-\d{2})/);
          const cur = match ? match[1] : selectedDateKey;
          const [y, m, d] = cur.split('-').map(Number);
          const dt = new Date(y, m - 1, d + 1);
          const nextKey = formatDateKey(
            dt.getFullYear(),
            dt.getMonth() + 1,
            dt.getDate()
          );
          setSelectedDateKey(nextKey);
          navigate(`/day/${nextKey}`);
        } else {
          handleNextMonth();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isShortcutsModalOpen,
    isSettingsModalOpen,
    isProfileModalOpen,
    isProfileSetup,
    isTaskModalOpen,
    handleJumpToday,
    handleOpenAddTaskModal,
    handleOpenProfileModal,
    handleOpenSettingsModal,
    location.pathname,
    selectedDateKey,
    handlePrevMonth,
    handleNextMonth,
    navigate,
  ]);

  const outletContext: ClientOutletContext = {
    currentYear,
    currentMonth,
    selectedDateKey,
    setSelectedDateKey,
    monthStats,
    userProfile,
    isLoadingMonth,
    refreshMonthStats: fetchMonthData,
    onOpenAddTaskModal: handleOpenAddTaskModal,
    onEditTask: handleEditTask,
    onOpenProfileModal: handleOpenProfileModal,
    onOpenSettingsModal: handleOpenSettingsModal,
    notifyAiCoach: (sig: string) => setAiTriggerSignal(sig),
    dayRefreshTrigger,
    isCaloriesEnabled: settings.enableCalories,
    isWorkoutEnabled: settings.enableWorkout,
    isServerConnecting,
    theme: settings.theme,
    language: settings.language,
  };

  const languageContextValue = useMemo(
    () => ({
      language: settings.language,
      isEn: settings.language === 'en',
      onToggleLanguage: handleToggleLanguage,
    }),
    [settings.language, handleToggleLanguage]
  );

  return (
    <LanguageContext.Provider value={languageContextValue}>
      <div className="app-shell">
        <Header
          currentYear={currentYear}
          currentMonth={currentMonth}
          selectedDateKey={selectedDateKey}
          userProfile={userProfile}
          userEmail={storedUser?.email}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onJumpToday={handleJumpToday}
          onOpenAddTaskModal={handleOpenAddTaskModal}
          onOpenProfileModal={handleOpenProfileModal}
          onOpenSettingsModal={handleOpenSettingsModal}
          onOpenShortcutsModal={handleOpenShortcutsModal}
        />

        <main className="main-container">
          {isServerConnecting && (
            <div className="server-reconnect-banner" role="status" aria-live="polite">
              <span className="reconnect-pulse-dot" />
              <span>
                {settings.language === 'en'
                  ? 'Backend is starting up... Automatically reconnecting and loading data once ready'
                  : 'Máy chủ đang khởi động... Đang tự động kết nối và nạp dữ liệu khi sẵn sàng'}
              </span>
            </div>
          )}
          <Outlet context={outletContext} />
        </main>

        <Footer />

        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          mode={taskModalMode}
          initialTask={editingTask}
          currentDateKey={selectedDateKey}
          existingTasks={currentDayTasks}
          onSaveTask={handleSaveTask}
          onDeleteTask={handleDeleteTask}
        />

        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          userProfile={userProfile}
          isFirstTimeSetup={!isProfileSetup}
          onSaveProfile={handleSaveProfile}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
          language={settings.language}
          onToggleLanguage={handleToggleLanguage}
          isCaloriesEnabled={settings.enableCalories}
          onToggleCalories={handleToggleCalories}
          isWorkoutEnabled={settings.enableWorkout}
          onToggleWorkout={handleToggleWorkout}
          onOpenShortcutsModal={handleOpenShortcutsModal}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onLogout={handleLogout}
          userEmail={storedUser?.email}
        />

        <KeyboardShortcutsModal
          isOpen={isShortcutsModalOpen}
          onClose={() => setIsShortcutsModalOpen(false)}
        />

        <AiCoachWidget
          dateKey={selectedDateKey}
          triggerSignal={aiTriggerSignal}
          userProfile={userProfile}
        />
      </div>
    </LanguageContext.Provider>
  );
};

