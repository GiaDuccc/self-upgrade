import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
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
  onOpenAddTaskModal: () => void;
  onEditTask: (task: TaskItem) => void;
  onOpenProfileModal: () => void;
  notifyAiCoach: (signal: string) => void;
  dayRefreshTrigger: number;
}

export const ClientPage: React.FC = () => {
  const today = useMemo(() => getTodayInfo(), []);
  const navigate = useNavigate();

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
      setUserProfile(data.profile || DEFAULT_USER_PROFILE);
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
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    setSelectedDateKey(formatDateKey(nextY, nextM, 1));
  };

  const handleNextMonth = () => {
    let nextY = currentYear;
    let nextM = currentMonth + 1;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    setCurrentYear(nextY);
    setCurrentMonth(nextM);
    setSelectedDateKey(formatDateKey(nextY, nextM, 1));
  };

  const handleJumpToday = () => {
    const t = getTodayInfo();
    setCurrentYear(t.year);
    setCurrentMonth(t.month);
    setSelectedDateKey(t.dateKey);
  };

  const handleOpenAddTaskModal = () => {
    setTaskModalMode('add');
    setEditingTask(null);
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
    onOpenProfileModal: () => setIsProfileModalOpen(true),
    notifyAiCoach: (sig: string) => setAiTriggerSignal(sig),
    dayRefreshTrigger,
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
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onExportJson={handleExportJson}
        onImportJson={handleImportJson}
        onLogout={handleLogout}
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

      <AiCoachWidget
        dateKey={selectedDateKey}
        triggerSignal={aiTriggerSignal}
        userProfile={userProfile}
      />
    </div>
  );
};

