import { TaskItem } from '~/interface/discipline.interface';

export interface ParsedTaskTimes {
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  startDec: number; // 9.0
  endDec: number; // 10.5
  durationHours: number; // 1.5
  startHour: number; // 9
  startMinuteFrac: number; // 0.0 (0.0 to < 1.0)
  isAllDay?: boolean;
}

/**
 * Kiểm tra xem một đầu việc có phải là việc làm cả ngày (không cố định khung giờ trên bảng 24h) hay không
 */
export function isTaskAllDay(task?: Partial<TaskItem> | null): boolean {
  if (!task) return false;
  // 1. Cờ rõ ràng
  if (task.isAllDay === true) return true;
  if (task.isAllDay === false) return false;

  // 2. Nếu có startTime hoặc endTime cụ thể => việc có giờ cố định
  if (task.startTime || task.endTime) return false;

  // 3. Các đầu việc mặc định hệ thống thực hiện cả ngày (uống 3 lít nước, không ăn vặt)
  if (task.id === 'drink_3l_water' || task.id === 'no_junk_food') {
    return true;
  }

  // 4. Chuỗi timeHint có chứa từ khoá cả ngày / linh hoạt
  const hint = (task.timeHint || '').trim().toLowerCase();
  if (
    hint.includes('cả ngày') ||
    hint.includes('all day') ||
    hint.includes('ca ngay') ||
    hint.includes('hàng ngày') ||
    hint.includes('linh hoạt')
  ) {
    return true;
  }

  // 5. Nếu không có timeHint hoặc timeHint không chứa giờ cụ thể và không có hour
  if (!hint && typeof task.hour !== 'number') {
    return true;
  }

  return false;
}

/**
 * Chuyển số giờ thập phân (ví dụ 9.5) thành chuỗi "HH:mm" (ví dụ "09:30")
 * Giới hạn tối đa là "23:59" (0h - 23h59) theo chuẩn định dạng 24h của dự án
 */
export function formatDecToTime(dec: number): string {
  const totalMins = Math.round(dec * 60);
  const maxMins = 23 * 60 + 59; // 23h59
  const clampedMins = Math.max(0, Math.min(maxMins, totalMins));
  const h = Math.min(23, Math.floor(clampedMins / 60));
  const m = clampedMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Chuyển chuỗi "HH:mm" thành số giờ thập phân (ví dụ "09:30" -> 9.5)
 * Cực hạn tối đa 23h59 (~23.983)
 */
export function timeToDec(timeStr: string): number {
  if (!timeStr) return 8;
  const parts = timeStr.trim().split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  if (isNaN(h)) return 8;
  const maxDec = 23 + 59 / 60;
  return Math.min(maxDec, Math.max(0, h + (isNaN(m) ? 0 : m / 60)));
}

/**
 * Thêm số phút vào thời gian "HH:mm", giới hạn cao nhất là "23:59"
 */
export function addMinutesToTime(timeStr: string, minutes: number): string {
  const currentDec = timeToDec(timeStr);
  const maxDec = 23 + 59 / 60;
  const nextDec = Math.min(maxDec, Math.max(0, currentDec + minutes / 60));
  return formatDecToTime(nextDec);
}

/**
 * Chuẩn hóa chuỗi thời gian nhập tay thành định dạng 24h hợp lệ (00:00 - 23:59)
 * Hỗ trợ các cách gõ nhanh như: "9" -> "09:00", "9:3" -> "09:30", "1430" -> "14:30", "2359" -> "23:59", "9h" -> "09:00"
 */
export function sanitize24hTime(raw: string | undefined | null, fallback = '08:00'): string {
  if (!raw) return fallback;
  const cleaned = raw.trim().replace(/\s+/g, '');
  if (!cleaned) return fallback;

  // Trường hợp HH:mm hoặc H:mm hoặc H:m
  const colonMatch = cleaned.match(/^(\d{1,2}):(\d{1,2})?$/);
  if (colonMatch) {
    let h = parseInt(colonMatch[1], 10);
    let m = parseInt(colonMatch[2] || '0', 10);
    if (isNaN(h)) h = 0;
    if (isNaN(m)) m = 0;
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Trường hợp nhập số đơn lẻ "8" -> "08:00", "14" -> "14:00"
  const singleNumMatch = cleaned.match(/^(\d{1,2})$/);
  if (singleNumMatch) {
    let h = parseInt(singleNumMatch[1], 10);
    if (isNaN(h)) return fallback;
    h = Math.max(0, Math.min(23, h));
    return `${String(h).padStart(2, '0')}:00`;
  }

  // Trường hợp nhập 3 hoặc 4 chữ số liền nhau: "930" -> "09:30", "1430" -> "14:30"
  const digitsMatch = cleaned.match(/^(\d{1,2})(\d{2})$/);
  if (digitsMatch) {
    let h = parseInt(digitsMatch[1], 10);
    let m = parseInt(digitsMatch[2], 10);
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // Trường hợp "9h" hoặc "9h30" hoặc "23h59"
  const hMatch = cleaned.match(/^(\d{1,2})h(\d{1,2})?$/i);
  if (hMatch) {
    let h = parseInt(hMatch[1], 10);
    let m = parseInt(hMatch[2] || '0', 10);
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return fallback;
}

/**
 * Danh sách gợi ý các mốc thời gian 24h từ 00:00 đến 23:59
 */
export const HOURS_24_SUGGESTIONS: string[] = [
  ...Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`),
  '23:59',
];

/**
 * Tính và định dạng khoảng thời lượng giữa 2 mốc thời gian
 */
export function formatDurationText(startStr: string, endStr: string, isEn = false): string {
  const sDec = timeToDec(startStr);
  const eDec = timeToDec(endStr);
  let diffMins = Math.round((eDec - sDec) * 60);
  if (diffMins <= 0) diffMins = 60;

  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;

  if (isEn) {
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
  if (h > 0) return `${h} giờ`;
  return `${m} phút`;
}

/**
 * Phân tích thời gian bắt đầu và kết thúc của một taskItem từ mọi định dạng
 */
export function parseTaskTimes(task?: Partial<TaskItem> | null): ParsedTaskTimes {
  if (!task) {
    return {
      startTime: '08:00',
      endTime: '09:00',
      startDec: 8,
      endDec: 9,
      durationHours: 1,
      startHour: 8,
      startMinuteFrac: 0,
      isAllDay: false,
    };
  }

  // Trường hợp đầu việc cả ngày (không có khung giờ cố định)
  if (isTaskAllDay(task)) {
    return {
      startTime: '',
      endTime: '',
      startDec: -1,
      endDec: -1,
      durationHours: 0,
      startHour: -1,
      startMinuteFrac: 0,
      isAllDay: true,
    };
  }

  // 1. Nếu có startTime cụ thể
  if (task.startTime && /^\d{1,2}:\d{2}$/.test(task.startTime.trim())) {
    const sDec = timeToDec(task.startTime);
    let eDec = sDec + 1;
    if (task.endTime && /^\d{1,2}:\d{2}$/.test(task.endTime.trim())) {
      const parsedEnd = timeToDec(task.endTime);
      if (parsedEnd > sDec) {
        eDec = parsedEnd;
      }
    }
    const durationHours = Math.max(0.25, eDec - sDec);
    const startHour = Math.floor(sDec);
    const startMinuteFrac = sDec - startHour;
    return {
      startTime: formatDecToTime(sDec),
      endTime: formatDecToTime(eDec),
      startDec: sDec,
      endDec: eDec,
      durationHours,
      startHour,
      startMinuteFrac,
    };
  }

  // 2. Tìm kiếm khoảng thời gian trong timeHint (ví dụ: "09:00 - 10:30", "9:00 - 10:30", "5h - 6h", "9h30 - 11h")
  const hint = (task.timeHint || '').trim();
  const rangeMatch = hint.match(
    /(\d{1,2})(?::(\d{2})|h(\d{2})?)?\s*[-–—tođến]+\s*(\d{1,2})(?::(\d{2})|h(\d{2})?)?/i
  );

  if (rangeMatch) {
    const sH = parseInt(rangeMatch[1], 10);
    const sM = parseInt(rangeMatch[2] || rangeMatch[3] || '0', 10);
    const eH = parseInt(rangeMatch[4], 10);
    const eM = parseInt(rangeMatch[5] || rangeMatch[6] || '0', 10);

    const maxDec = 23 + 59 / 60;
    const sDec = Math.min(maxDec, Math.max(0, sH + sM / 60));
    let eDec = Math.min(maxDec, Math.max(0, eH + eM / 60));
    if (eDec <= sDec) {
      eDec = Math.min(maxDec, sDec + 1);
    }
    const durationHours = Math.max(0.25, eDec - sDec);
    const startHour = Math.floor(sDec);
    const startMinuteFrac = sDec - startHour;
    return {
      startTime: formatDecToTime(sDec),
      endTime: formatDecToTime(eDec),
      startDec: sDec,
      endDec: eDec,
      durationHours,
      startHour,
      startMinuteFrac,
    };
  }

  // 3. Tìm kiếm mốc đơn lẻ trong timeHint (ví dụ: "07:00", "7h")
  const singleMatch = hint.match(/(\d{1,2})(?::(\d{2})|h(\d{2})?)/i);
  if (singleMatch) {
    const maxDec = 23 + 59 / 60;
    const sH = parseInt(singleMatch[1], 10);
    const sM = parseInt(singleMatch[2] || singleMatch[3] || '0', 10);
    const sDec = Math.min(maxDec, Math.max(0, sH + sM / 60));
    const eDec = Math.min(maxDec, sDec + 1);
    const durationHours = 1;
    const startHour = Math.floor(sDec);
    const startMinuteFrac = sDec - startHour;
    return {
      startTime: formatDecToTime(sDec),
      endTime: formatDecToTime(eDec),
      startDec: sDec,
      endDec: eDec,
      durationHours,
      startHour,
      startMinuteFrac,
    };
  }

  // 4. Fallback theo hour được chọn trên bảng
  const h =
    typeof task.hour === 'number' && task.hour >= 0 && task.hour <= 23
      ? task.hour
      : 8;
  const maxDec = 23 + 59 / 60;
  const sDec = Math.min(maxDec, h);
  const eDec = Math.min(maxDec, h + 1);
  return {
    startTime: formatDecToTime(sDec),
    endTime: formatDecToTime(eDec),
    startDec: sDec,
    endDec: eDec,
    durationHours: 1,
    startHour: h,
    startMinuteFrac: 0,
  };
}

