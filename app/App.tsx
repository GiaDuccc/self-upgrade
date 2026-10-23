import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, getBaseUrl, setBaseUrl, DEFAULT_API_URL } from './src/config/api';
import { DayDataResponse, TaskLevelKey, SleepData, WaterData } from './src/types';
import { healthSyncService } from './src/services/healthSyncService';

export default function App() {
  const [todayKey, setTodayKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [dayData, setDayData] = useState<DayDataResponse | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Modal Đăng nhập
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Modal Cài đặt Server IP
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [serverUrlInput, setServerUrlInput] = useState('');

  // Modal Giấc ngủ thủ công
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [bedTimeInput, setBedTimeInput] = useState('23:00');
  const [wakeTimeInput, setWakeTimeInput] = useState('06:30');

  // Khởi động nạp Token & Server URL
  useEffect(() => {
    (async () => {
      const savedToken = await AsyncStorage.getItem('accessTokenClient');
      const savedUrl = await getBaseUrl();
      setAuthToken(savedToken);
      setServerUrlInput(savedUrl);

      if (savedToken) {
        fetchDayData(todayKey);
      } else {
        setIsLoading(false);
        setIsLoginModalOpen(true);
      }
    })();
  }, [todayKey]);

  const fetchDayData = useCallback(async (dateKey: string) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/disciplines/day/${dateKey}`);
      setDayData(res.data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        setAuthToken(null);
        await AsyncStorage.removeItem('accessTokenClient');
        setIsLoginModalOpen(true);
      } else {
        Alert.alert(
          'Không thể kết nối máy chủ',
          'Vui lòng kiểm tra địa chỉ IP Server Backend trong phần Cài đặt.'
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDayData(todayKey);
  };

  const handleLogin = async () => {
    if (!emailInput.trim() || !passwordInput.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await api.post('/users/sign-in', {
        email: emailInput.trim(),
        password: passwordInput,
      });
      const token = res.data?.accessToken;
      if (token) {
        await AsyncStorage.setItem('accessTokenClient', token);
        setAuthToken(token);
        setIsLoginModalOpen(false);
        fetchDayData(todayKey);
      }
    } catch (error: any) {
      Alert.alert(
        'Đăng nhập thất bại',
        error?.response?.data?.message || 'Email hoặc mật khẩu không chính xác.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveServerUrl = async () => {
    await setBaseUrl(serverUrlInput);
    setIsSettingsOpen(false);
    Alert.alert('Thành công', 'Đã lưu địa chỉ máy chủ: ' + serverUrlInput);
    fetchDayData(todayKey);
  };

  // 1. Thao tác tích việc
  const handleToggleTask = async (taskId: string) => {
    if (!dayData) return;
    const currentLevel = dayData.dayRecord?.tasks?.[taskId] || 'NONE';
    const nextLevel: TaskLevelKey =
      currentLevel === 'NONE'
        ? 'PERFECT'
        : currentLevel === 'PERFECT'
        ? 'GOOD'
        : currentLevel === 'GOOD'
        ? 'BAD'
        : 'NONE';

    // Optimistic update
    setDayData((prev) => {
      if (!prev) return prev;
      const tasks = { ...(prev.dayRecord.tasks || {}) };
      if (nextLevel === 'NONE') delete tasks[taskId];
      else tasks[taskId] = nextLevel;
      return {
        ...prev,
        dayRecord: { ...prev.dayRecord, tasks },
      };
    });

    try {
      const res = await api.put('/disciplines/task-level', {
        dateKey: todayKey,
        taskId,
        levelKey: nextLevel,
      });
      setDayData(res.data);
    } catch {
      fetchDayData(todayKey);
    }
  };

  // 2. Thao tác nạp nước 1 chạm
  const handleAddWater = async (amount: number) => {
    const currentData = dayData?.dayRecord?.waterData;
    const currentMl = currentData?.currentMl || 0;
    const targetMl = currentData?.targetMl || 2000;
    const nextMl = Math.max(0, currentMl + amount);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog = {
      id: `m_${Date.now()}`,
      amount,
      time: timeStr,
    };
    const nextLogs = [newLog, ...(currentData?.logs || [])].slice(0, 20);

    const newWaterData: WaterData = {
      targetMl,
      currentMl: nextMl,
      logs: nextLogs,
    };

    setDayData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        dayRecord: { ...prev.dayRecord, waterData: newWaterData },
        dayStats: { ...prev.dayStats, waterData: newWaterData },
      };
    });

    try {
      const res = await api.put('/disciplines/day/water', {
        dateKey: todayKey,
        waterData: newWaterData,
      });
      setDayData(res.data);
    } catch {
      fetchDayData(todayKey);
    }
  };

  // 3. Đồng bộ Giấc ngủ từ Apple Health / Xiaomi Band
  const handleSyncAppleHealthSleep = async () => {
    try {
      setIsLoading(true);
      const synced = await healthSyncService.fetchAndSyncAppleHealth(todayKey);
      if (synced) {
        Alert.alert(
          'Đồng bộ thành công! 🌙',
          `Đã nhận dữ liệu từ Xiaomi Band:\n- Đi ngủ: ${synced.bedTime}\n- Thức dậy: ${synced.wakeTime}\n- Thời lượng: ${Math.floor(synced.durationMinutes / 60)}h${synced.durationMinutes % 60}p\n- Điểm chất lượng: ${synced.sleepScore}/100`
        );
        fetchDayData(todayKey);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể kết nối dịch vụ Apple Health.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Lưu giấc ngủ thủ công
  const handleSaveManualSleep = async () => {
    const [bH, bM] = bedTimeInput.split(':').map(Number);
    const [wH, wM] = wakeTimeInput.split(':').map(Number);

    let start = bH * 60 + (bM || 0);
    let end = wH * 60 + (wM || 0);
    if (end <= start) end += 24 * 60; // qua đêm
    const durationMinutes = Math.max(0, end - start);

    const sleepData: SleepData = {
      bedTime: bedTimeInput,
      wakeTime: wakeTimeInput,
      durationMinutes,
      source: 'manual',
      sleepScore: durationMinutes >= 420 ? 90 : 70,
    };

    try {
      setIsLoading(true);
      const res = await api.put('/disciplines/day/sleep', {
        dateKey: todayKey,
        sleepData,
      });
      setDayData(res.data);
      setIsSleepModalOpen(false);
      Alert.alert('Thành công', 'Đã lưu giấc ngủ vào hệ thống!');
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu giấc ngủ');
    } finally {
      setIsLoading(false);
    }
  };

  const tasksList = dayData?.dayStats?.tasksList || [];
  const tasksMap = dayData?.dayRecord?.tasks || {};
  const percentage = dayData?.dayStats?.percentage || 0;
  const currentWater = dayData?.dayRecord?.waterData?.currentMl || 0;
  const targetWater = dayData?.dayRecord?.waterData?.targetMl || 2000;
  const currentSleep = dayData?.dayRecord?.sleepData;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* TOP HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerBrand}>SELF UPGRADE</Text>
          <Text style={styles.headerDate}>{todayKey} — Hôm nay</Text>
        </View>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => setIsSettingsOpen(true)}
        >
          <Text style={styles.settingsBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#38bdf8"
          />
        }
      >
        {/* BANNER ĐIỂM SỐ TIẾN ĐỘ NGÀY */}
        <View style={styles.scoreBanner}>
          <View style={styles.scoreLeft}>
            <Text style={styles.scoreLabel}>TIẾN ĐỘ KỶ LUẬT NGÀY</Text>
            <Text style={styles.scoreBig}>{percentage}%</Text>
            <Text style={styles.scoreSub}>
              {dayData?.dayStats?.checkedCount || 0}/{dayData?.dayStats?.totalTasks || 0} công việc đã tích
            </Text>
          </View>
          <View style={styles.scoreRight}>
            <View style={styles.badgeRank}>
              <Text style={styles.badgeRankText}>
                {dayData?.dayStats?.rank?.title || 'CHƯA ĐẠT'}
              </Text>
            </View>
          </View>
        </View>

        {/* THẺ 1: THEO DÕI GIẤC NGỦ (XIAOMI BAND / APPLE HEALTH) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>THEO DÕI GIẤC NGỦ</Text>
              <Text style={styles.cardSub}>Đồng bộ Xiaomi Band & Apple Health</Text>
            </View>
            <TouchableOpacity
              style={styles.editBtnSmall}
              onPress={() => setIsSleepModalOpen(true)}
            >
              <Text style={styles.editBtnSmallText}>Nhập tay</Text>
            </TouchableOpacity>
          </View>

          {currentSleep ? (
            <View style={styles.sleepDataRow}>
              <View style={styles.sleepItem}>
                <Text style={styles.sleepVal}>{currentSleep.bedTime}</Text>
                <Text style={styles.sleepLbl}>Giờ ngủ</Text>
              </View>
              <View style={styles.sleepItem}>
                <Text style={styles.sleepVal}>{currentSleep.wakeTime}</Text>
                <Text style={styles.sleepLbl}>Giờ thức</Text>
              </View>
              <View style={styles.sleepItem}>
                <Text style={styles.sleepVal}>
                  {Math.floor(currentSleep.durationMinutes / 60)}h{currentSleep.durationMinutes % 60}p
                </Text>
                <Text style={styles.sleepLbl}>Thời lượng</Text>
              </View>
              <View style={styles.sleepItem}>
                <Text style={[styles.sleepVal, { color: '#16A34A' }]}>
                  {currentSleep.sleepScore ? `${currentSleep.sleepScore}đ` : 'Tốt'}
                </Text>
                <Text style={styles.sleepLbl}>Chất lượng</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>Chưa có dữ liệu giấc ngủ đêm qua.</Text>
          )}

          <TouchableOpacity
            style={styles.btnSyncHealth}
            onPress={handleSyncAppleHealthSleep}
          >
            <Text style={styles.btnSyncHealthText}>
              🔄 Đồng bộ tự động từ Xiaomi Band (Apple Health)
            </Text>
          </TouchableOpacity>
        </View>

        {/* THẺ 2: BỘ NẠP NƯỚC UỐNG 1 CHẠM */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>💧</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>NƯỚC UỐNG 1 CHẠM</Text>
              <Text style={styles.cardSub}>
                {currentWater.toLocaleString()} / {targetWater.toLocaleString()} ml ({Math.min(100, Math.round((currentWater / targetWater) * 100))}%)
              </Text>
            </View>
          </View>

          {/* Thanh tiến trình nước */}
          <View style={styles.waterProgressBar}>
            <View
              style={[
                styles.waterProgressFill,
                { width: `${Math.min(100, (currentWater / targetWater) * 100)}%` },
              ]}
            />
          </View>

          {/* Nút 1 chạm */}
          <View style={styles.waterButtonsRow}>
            <TouchableOpacity
              style={styles.waterBtn}
              onPress={() => handleAddWater(250)}
            >
              <Text style={styles.waterBtnText}>+250ml</Text>
              <Text style={styles.waterBtnSub}>1 Ly</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waterBtn}
              onPress={() => handleAddWater(500)}
            >
              <Text style={styles.waterBtnText}>+500ml</Text>
              <Text style={styles.waterBtnSub}>1 Chai</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.waterBtn}
              onPress={() => handleAddWater(100)}
            >
              <Text style={styles.waterBtnText}>+100ml</Text>
              <Text style={styles.waterBtnSub}>Ngụm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.waterBtn, { borderColor: '#ef4444' }]}
              onPress={() => handleAddWater(-250)}
              disabled={currentWater <= 0}
            >
              <Text style={[styles.waterBtnText, { color: '#ef4444' }]}>-250ml</Text>
              <Text style={styles.waterBtnSub}>Trừ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* THẺ 3: DANH SÁCH CÔNG VIỆC HÔM NAY */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📋</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>DANH SÁCH VIỆC HÔM NAY</Text>
              <Text style={styles.cardSub}>Chạm để đổi mức độ hoàn thành</Text>
            </View>
          </View>

          <View style={styles.tasksList}>
            {tasksList.map((task) => {
              const level = tasksMap[task.id] || 'NONE';
              const isPerfect = level === 'PERFECT';
              const isGood = level === 'GOOD';
              const isBad = level === 'BAD';
              const isChecked = level !== 'NONE';

              return (
                <TouchableOpacity
                  key={task.id}
                  style={[
                    styles.taskRow,
                    isChecked && styles.taskRowChecked,
                  ]}
                  onPress={() => handleToggleTask(task.id)}
                >
                  <View style={styles.taskInfo}>
                    <Text
                      style={[
                        styles.taskTitle,
                        isChecked && styles.taskTitleChecked,
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.timeHint ? (
                      <Text style={styles.taskHint}>⏰ {task.timeHint}</Text>
                    ) : null}
                  </View>

                  <View
                    style={[
                      styles.taskLevelTag,
                      isPerfect && styles.levelPerfect,
                      isGood && styles.levelGood,
                      isBad && styles.levelBad,
                    ]}
                  >
                    <Text style={styles.taskLevelText}>
                      {isPerfect
                        ? 'Hoàn Hảo'
                        : isGood
                        ? 'Tốt'
                        : isBad
                        ? 'Tệ'
                        : 'Chưa'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* MODAL CÀI ĐẶT SERVER IP */}
      <Modal visible={isSettingsOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cài đặt kết nối máy chủ</Text>
            <Text style={styles.modalSub}>
              Nhập địa chỉ IP máy tính đang chạy Backend API (ví dụ: http://192.168.1.50:2004/api/v1):
            </Text>

            <TextInput
              style={styles.modalInput}
              value={serverUrlInput}
              onChangeText={setServerUrlInput}
              placeholder="http://192.168.1.x:2004/api/v1"
              placeholderTextColor="#71717a"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setIsSettingsOpen(false)}
              >
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.btnPrimaryText}>Lưu cấu hình</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.btnLogout}
              onPress={async () => {
                await AsyncStorage.removeItem('accessTokenClient');
                setAuthToken(null);
                setIsSettingsOpen(false);
                setIsLoginModalOpen(true);
              }}
            >
              <Text style={styles.btnLogoutText}>Đăng xuất tài khoản</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL ĐĂNG NHẬP */}
      <Modal visible={isLoginModalOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Đăng nhập Self Upgrade</Text>
            <Text style={styles.modalSub}>
              Sử dụng cùng tài khoản email & mật khẩu bạn đã đăng ký trên bản web.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={emailInput}
              onChangeText={setEmailInput}
              placeholder="Email của bạn..."
              placeholderTextColor="#71717a"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.modalInput}
              value={passwordInput}
              onChangeText={setPasswordInput}
              placeholder="Mật khẩu..."
              placeholderTextColor="#71717a"
              secureTextEntry
            />

            <TouchableOpacity
              style={styles.btnPrimaryFull}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>Đăng nhập ngay</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 12, alignItems: 'center' }}
              onPress={() => setIsSettingsOpen(true)}
            >
              <Text style={{ color: '#38bdf8', fontSize: 13 }}>
                ⚙️ Đổi IP Server Backend ({serverUrlInput.slice(0, 25)}...)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL NHẬP GIẤC NGỦ THỦ CÔNG */}
      <Modal visible={isSleepModalOpen} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ghi nhận giấc ngủ</Text>
            <Text style={styles.modalSub}>Nhập giờ bắt đầu ngủ và giờ thức dậy:</Text>

            <View style={{ flexDirection: 'row', gap: 12, marginVertical: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Giờ đi ngủ (HH:mm)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={bedTimeInput}
                  onChangeText={setBedTimeInput}
                  placeholder="23:00"
                  placeholderTextColor="#71717a"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Giờ thức dậy (HH:mm)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={wakeTimeInput}
                  onChangeText={setWakeTimeInput}
                  placeholder="06:30"
                  placeholderTextColor="#71717a"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => setIsSleepModalOpen(false)}
              >
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleSaveManualSleep}
              >
                <Text style={styles.btnPrimaryText}>Lưu giấc ngủ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#09090b',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
    backgroundColor: '#18181b',
  },
  headerBrand: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerDate: {
    color: '#a1a1aa',
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  settingsBtnText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  scoreBanner: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreLeft: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a1a1aa',
    letterSpacing: 0.5,
  },
  scoreBig: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fafafa',
    marginVertical: 2,
  },
  scoreSub: {
    fontSize: 12,
    color: '#71717a',
  },
  scoreRight: {},
  badgeRank: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#27272a',
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  badgeRankText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 20,
  },
  cardTitle: {
    color: '#fafafa',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  cardSub: {
    color: '#a1a1aa',
    fontSize: 11,
    marginTop: 1,
  },
  editBtnSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  editBtnSmallText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  sleepDataRow: {
    flexDirection: 'row',
    backgroundColor: '#09090b',
    borderRadius: 10,
    padding: 12,
    justifyContent: 'space-around',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  sleepItem: {
    alignItems: 'center',
  },
  sleepVal: {
    color: '#fafafa',
    fontSize: 16,
    fontWeight: '700',
  },
  sleepLbl: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 2,
  },
  noDataText: {
    color: '#71717a',
    fontSize: 12,
    marginVertical: 10,
    textAlign: 'center',
  },
  btnSyncHealth: {
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSyncHealthText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  waterProgressBar: {
    height: 8,
    backgroundColor: '#27272a',
    borderRadius: 999,
    overflow: 'hidden',
    marginVertical: 10,
  },
  waterProgressFill: {
    height: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 999,
  },
  waterButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  waterBtn: {
    flex: 1,
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  waterBtnText: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '700',
  },
  waterBtnSub: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
  },
  tasksList: {
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 12,
    borderRadius: 10,
  },
  taskRowChecked: {
    borderColor: '#3f3f46',
  },
  taskInfo: {
    flex: 1,
    paddingRight: 10,
  },
  taskTitle: {
    color: '#fafafa',
    fontSize: 13,
    fontWeight: '600',
  },
  taskTitleChecked: {
    color: '#a1a1aa',
  },
  taskHint: {
    color: '#71717a',
    fontSize: 11,
    marginTop: 3,
  },
  taskLevelTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#27272a',
  },
  levelPerfect: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
  },
  levelGood: {
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
  },
  levelBad: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
  },
  taskLevelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fafafa',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    color: '#fafafa',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSub: {
    color: '#a1a1aa',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#09090b',
    borderWidth: 1,
    borderColor: '#27272a',
    color: '#fafafa',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 12,
  },
  inputLabel: {
    color: '#a1a1aa',
    fontSize: 11,
    marginBottom: 4,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  btnSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  btnSecondaryText: {
    color: '#fafafa',
    fontWeight: '600',
  },
  btnPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#0284c7',
  },
  btnPrimaryFull: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  btnPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  btnLogout: {
    marginTop: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    alignItems: 'center',
  },
  btnLogoutText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
