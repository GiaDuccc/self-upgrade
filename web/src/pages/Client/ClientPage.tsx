import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
import { MonthStats, TaskItem, TaskScope } from '~/interface/discipline.interface';
import { UserProfile } from '~/interface/user.interface';
import {
  DEFAULT_USER_PROFILE,
  formatDateKey,
  getTodayInfo,
} from '~/utils/constants';

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
  theme: 'light' | 'dark';
}

interface AppSettings {
  theme: 'light' | 'dark';
  enableCalories: boolean;
}

const getStoredSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem('app_settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        enableCalories: parsed.enableCalories !== false,
      };
    }
  } catch {}
  return {
    theme: 'light',
    enableCalories: true,
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

  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskModalMode, setTaskModalMode] = useState<'add' | 'edit'>('add');
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const handleToggleTheme = useCallback((newTheme: 'light' | 'dark') => {
    setSettings((prev) => ({ ...prev, theme: newTheme }));
  }, []);

  const handleToggleCalories = useCallback((enabled: boolean) => {
    setSettings((prev) => ({ ...prev, enableCalories: enabled }));
    toast.info(
      enabled
        ? 'Đã bật chế độ Calories & Dinh dưỡng'
        : 'Đã tắt chế độ Calories & Dinh dưỡng'
    );
  }, []);

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

  const fetchMonthData = useCallback(async () => {
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

      // Nếu đăng nhập lần đầu chưa thiết lập thông tin cá nhân -> tự động mở modal thiết lập
      if (!data.isProfileSetup) {
        setIsProfileModalOpen(true);
      }
    } catch {
      toast.error('Không thể tải dữ liệu từ máy chủ!');
    } finally {
      setIsLoadingMonth(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    setIsLoadingMonth(true);
    fetchMonthData();
  }, [fetchMonthData]);

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

  // Khóa cuộn trang nền khi có bất kỳ modal nào mở
  const isAnyModalOpen = isTaskModalOpen || isProfileModalOpen || isSettingsModalOpen;
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
    theme: settings.theme,
  };

  return (
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
      />

      <main className="main-container">
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
        isCaloriesEnabled={settings.enableCalories}
        onToggleCalories={handleToggleCalories}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onLogout={handleLogout}
        userEmail={storedUser?.email}
      />

      <AiCoachWidget
        dateKey={selectedDateKey}
        triggerSignal={aiTriggerSignal}
        userProfile={userProfile}
      />
    </div>
  );
};

