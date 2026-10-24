import { DayRecord, ExerciseSet, UserProfile, WorkoutData, WorkoutExercise } from '~/types';

export interface PresetExercise {
  id: string;
  name: string;
  nameEn: string;
  category: string; // 'nguc' | 'lung' | 'vai' | 'tay_sau' | 'tay_truoc' | 'core' | 'leg'
  primaryMuscle: string;
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';
}

export const MUSCLE_GROUP_OPTIONS = [
  { id: 'nguc', label: 'Ngực', labelEn: 'Chest' },
  { id: 'lung', label: 'Lưng & Xô', labelEn: 'Back & Lats' },
  { id: 'vai', label: 'Vai', labelEn: 'Shoulders' },
  { id: 'tay_sau', label: 'Tay sau', labelEn: 'Triceps' },
  { id: 'tay_truoc', label: 'Tay trước', labelEn: 'Biceps' },
  { id: 'core', label: 'Bụng & Core', labelEn: 'Abs & Core' },
  { id: 'push', label: 'Push (Đẩy)', labelEn: 'Push' },
  { id: 'pull', label: 'Pull (Kéo)', labelEn: 'Pull' },
  { id: 'leg', label: 'Leg (Chân & Mông)', labelEn: 'Legs & Glutes' },
] as const;

export const PRESET_EXERCISES_DATABASE: PresetExercise[] = [
  // NGỰC (CHEST)
  { id: 'bench_press', name: 'Barbell Bench Press (Nằm đẩy tạ đòn)', nameEn: 'Barbell Bench Press', category: 'nguc', primaryMuscle: 'Ngực giữa', equipment: 'barbell' },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press (Đẩy ngực trên tạ đơn)', nameEn: 'Incline Dumbbell Press', category: 'nguc', primaryMuscle: 'Ngực trên', equipment: 'dumbbell' },
  { id: 'decline_bench_press', name: 'Decline Bench Press (Đẩy ngực dưới)', nameEn: 'Decline Bench Press', category: 'nguc', primaryMuscle: 'Ngực dưới', equipment: 'barbell' },
  { id: 'db_chest_fly', name: 'Dumbbell Chest Fly (Banh ngực tạ đơn)', nameEn: 'Dumbbell Chest Fly', category: 'nguc', primaryMuscle: 'Ngực', equipment: 'dumbbell' },
  { id: 'cable_crossover', name: 'Cable Crossover (Ép ngực với dây cáp)', nameEn: 'Cable Crossover', category: 'nguc', primaryMuscle: 'Ngực trong', equipment: 'cable' },
  { id: 'chest_dips', name: 'Chest Dips (Chống xà kép ngực)', nameEn: 'Chest Dips', category: 'nguc', primaryMuscle: 'Ngực & Tay sau', equipment: 'bodyweight' },
  { id: 'push_ups', name: 'Push-ups (Hít đất / Chống đẩy)', nameEn: 'Push-ups', category: 'nguc', primaryMuscle: 'Ngực toàn diện', equipment: 'bodyweight' },
  { id: 'machine_chest_press', name: 'Machine Chest Press (Đẩy ngực máy)', nameEn: 'Machine Chest Press', category: 'nguc', primaryMuscle: 'Ngực', equipment: 'machine' },

  // LƯNG & XÔ (BACK & LATS)
  { id: 'deadlift', name: 'Conventional Deadlift (Kéo tạ đòn chạm đất)', nameEn: 'Conventional Deadlift', category: 'lung', primaryMuscle: 'Toàn bộ lưng & Chân sau', equipment: 'barbell' },
  { id: 'barbell_row', name: 'Barbell Bent-over Row (Kéo lưng tạ đòn)', nameEn: 'Barbell Bent-over Row', category: 'lung', primaryMuscle: 'Lưng giữa', equipment: 'barbell' },
  { id: 'lat_pulldown', name: 'Lat Pulldown (Kéo xô cáp)', nameEn: 'Lat Pulldown', category: 'lung', primaryMuscle: 'Cơ xô (Lats)', equipment: 'cable' },
  { id: 'pull_ups', name: 'Pull-ups (Hít xà đơn)', nameEn: 'Pull-ups', category: 'lung', primaryMuscle: 'Cơ xô & Bắp tay', equipment: 'bodyweight' },
  { id: 'seated_cable_row', name: 'Seated Cable Row (Kéo cáp ngồi)', nameEn: 'Seated Cable Row', category: 'lung', primaryMuscle: 'Lưng giữa & Xô', equipment: 'cable' },
  { id: 'one_arm_db_row', name: 'One-arm Dumbbell Row (Kéo tạ đơn 1 tay)', nameEn: 'One-arm Dumbbell Row', category: 'lung', primaryMuscle: 'Cơ xô', equipment: 'dumbbell' },
  { id: 't_bar_row', name: 'T-Bar Row (Kéo tạ chữ T)', nameEn: 'T-Bar Row', category: 'lung', primaryMuscle: 'Độ dày cơ lưng', equipment: 'barbell' },
  { id: 'face_pull', name: 'Face Pull (Kéo cáp vào mặt)', nameEn: 'Face Pull', category: 'lung', primaryMuscle: 'Cơ lưng trên & Vai sau', equipment: 'cable' },

  // VAI (SHOULDERS)
  { id: 'ohp', name: 'Overhead Press / OHP (Đẩy vai tạ đòn đứng)', nameEn: 'Overhead Press (OHP)', category: 'vai', primaryMuscle: 'Vai trước & Toàn vai', equipment: 'barbell' },
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press (Đẩy vai tạ đơn ngồi)', nameEn: 'Dumbbell Shoulder Press', category: 'vai', primaryMuscle: 'Vai trước & giữa', equipment: 'dumbbell' },
  { id: 'db_lateral_raise', name: 'Dumbbell Lateral Raise (Dang tạ đơn sang bên)', nameEn: 'Dumbbell Lateral Raise', category: 'vai', primaryMuscle: 'Vai giữa (Bờ vai rộng)', equipment: 'dumbbell' },
  { id: 'cable_lateral_raise', name: 'Cable Lateral Raise (Dang cáp ngang)', nameEn: 'Cable Lateral Raise', category: 'vai', primaryMuscle: 'Vai giữa', equipment: 'cable' },
  { id: 'rear_delt_fly', name: 'Rear Delt Fly (Banh vai sau)', nameEn: 'Rear Delt Fly', category: 'vai', primaryMuscle: 'Vai sau', equipment: 'dumbbell' },
  { id: 'arnold_press', name: 'Arnold Press (Đẩy vai xoay tay)', nameEn: 'Arnold Press', category: 'vai', primaryMuscle: 'Toàn bộ khối cơ vai', equipment: 'dumbbell' },
  { id: 'barbell_shrug', name: 'Barbell Shrug (Nhún cầu vai)', nameEn: 'Barbell Shrug', category: 'vai', primaryMuscle: 'Cầu vai (Traps)', equipment: 'barbell' },

  // TAY SAU (TRICEPS)
  { id: 'tricep_pushdown', name: 'Tricep Rope Pushdown (Kéo cáp dây thừng)', nameEn: 'Tricep Rope Pushdown', category: 'tay_sau', primaryMuscle: 'Đầu ngoài tay sau', equipment: 'cable' },
  { id: 'skull_crusher', name: 'Skull Crusher (Nằm đẩy tạ đòn tập tay sau)', nameEn: 'Skull Crusher', category: 'tay_sau', primaryMuscle: 'Đầu dài tay sau', equipment: 'barbell' },
  { id: 'overhead_tricep_ext', name: 'Overhead DB Tricep Extension (Đưa tạ qua đầu)', nameEn: 'Overhead Dumbbell Tricep Extension', category: 'tay_sau', primaryMuscle: 'Đầu dài tay sau', equipment: 'dumbbell' },
  { id: 'close_grip_bench', name: 'Close-grip Bench Press (Đẩy ngực tay hẹp)', nameEn: 'Close-grip Bench Press', category: 'tay_sau', primaryMuscle: 'Tay sau & Ngực trong', equipment: 'barbell' },
  { id: 'bench_dips', name: 'Bench Dips (Chống đẩy tay sau trên ghế)', nameEn: 'Bench Dips', category: 'tay_sau', primaryMuscle: 'Tay sau', equipment: 'bodyweight' },

  // TAY TRƯỚC (BICEPS)
  { id: 'barbell_bicep_curl', name: 'Barbell Bicep Curl (Cuốn tạ đòn đứng)', nameEn: 'Barbell Bicep Curl', category: 'tay_truoc', primaryMuscle: 'Đỉnh bắp tay trước', equipment: 'barbell' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl (Cuốn tạ đơn xoay cổ tay)', nameEn: 'Dumbbell Curl', category: 'tay_truoc', primaryMuscle: 'Bắp tay trước', equipment: 'dumbbell' },
  { id: 'hammer_curl', name: 'Hammer Curl (Cuốn tạ búa)', nameEn: 'Hammer Curl', category: 'tay_truoc', primaryMuscle: 'Cơ Brachialis & Cẳng tay', equipment: 'dumbbell' },
  { id: 'incline_db_curl', name: 'Incline Dumbbell Curl (Cuốn tạ ghế dốc)', nameEn: 'Incline Dumbbell Curl', category: 'tay_truoc', primaryMuscle: 'Đầu dài bắp tay', equipment: 'dumbbell' },
  { id: 'preacher_curl', name: 'Preacher Curl (Cuốn tạ ghế nghiêng)', nameEn: 'Preacher Curl', category: 'tay_truoc', primaryMuscle: 'Cô lập bắp tay trước', equipment: 'barbell' },
  { id: 'cable_bicep_curl', name: 'Cable Bicep Curl (Cuốn bắp tay với cáp)', nameEn: 'Cable Bicep Curl', category: 'tay_truoc', primaryMuscle: 'Bắp tay trước', equipment: 'cable' },

  // BỤNG & CORE (ABS & CORE)
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise (Treo xà nâng chân)', nameEn: 'Hanging Leg Raise', category: 'core', primaryMuscle: 'Bụng dưới', equipment: 'bodyweight' },
  { id: 'cable_crunch', name: 'Cable Crunch (Quỳ kéo cáp gập bụng)', nameEn: 'Cable Crunch', category: 'core', primaryMuscle: 'Bụng trên & 6 múi', equipment: 'cable' },
  { id: 'plank', name: 'Plank (Giữ thân thẳng tĩnh)', nameEn: 'Plank', category: 'core', primaryMuscle: 'Toàn bộ cơ lõi Core', equipment: 'bodyweight' },
  { id: 'ab_wheel_rollout', name: 'Ab Wheel Rollout (Lăn con lăn tập bụng)', nameEn: 'Ab Wheel Rollout', category: 'core', primaryMuscle: 'Toàn bộ cơ bụng & Core', equipment: 'bodyweight' },
  { id: 'russian_twist', name: 'Russian Twist (Vặn người kiểu Nga)', nameEn: 'Russian Twist', category: 'core', primaryMuscle: 'Cơ liên sườn', equipment: 'bodyweight' },

  // CHÂN & MÔNG (LEGS & GLUTES)
  { id: 'barbell_squat', name: 'Barbell Back Squat (Gánh đùi tạ đòn)', nameEn: 'Barbell Back Squat', category: 'leg', primaryMuscle: 'Cơ đùi trước & Mông', equipment: 'barbell' },
  { id: 'leg_press', name: 'Leg Press (Đạp đùi trên máy nghiêng)', nameEn: 'Leg Press', category: 'leg', primaryMuscle: 'Đùi trước & Mông', equipment: 'machine' },
  { id: 'rdl', name: 'Romanian Deadlift / RDL (RDL đùi sau & mông)', nameEn: 'Romanian Deadlift (RDL)', category: 'leg', primaryMuscle: 'Đùi sau (Hamstrings) & Mông', equipment: 'barbell' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat (Squat 1 chân)', nameEn: 'Bulgarian Split Squat', category: 'leg', primaryMuscle: 'Đùi trước & Mông sâu', equipment: 'dumbbell' },
  { id: 'leg_extension', name: 'Leg Extension (Đá đùi trước máy)', nameEn: 'Leg Extension', category: 'leg', primaryMuscle: 'Đùi trước (Quads)', equipment: 'machine' },
  { id: 'lying_leg_curl', name: 'Lying Leg Curl (Móc đùi sau máy)', nameEn: 'Lying Leg Curl', category: 'leg', primaryMuscle: 'Đùi sau (Hamstrings)', equipment: 'machine' },
  { id: 'hip_thrust', name: 'Barbell Hip Thrust (Đẩy hông tạ đòn)', nameEn: 'Barbell Hip Thrust', category: 'leg', primaryMuscle: 'Cơ mông tối đa (Glutes)', equipment: 'barbell' },
  { id: 'standing_calf_raise', name: 'Standing Calf Raise (Nhón bắp chân đứng)', nameEn: 'Standing Calf Raise', category: 'leg', primaryMuscle: 'Bắp chân', equipment: 'machine' },
];

/**
 * Lọc danh sách bài tập gợi ý theo các nhóm cơ người dùng đã chọn
 */
export function getPresetExercisesForMuscles(selectedMuscles: string[]): PresetExercise[] {
  if (!selectedMuscles || selectedMuscles.length === 0) {
    return PRESET_EXERCISES_DATABASE;
  }

  const effectiveCategories = new Set<string>();

  selectedMuscles.forEach((m) => {
    const lower = m.toLowerCase();
    if (lower === 'push') {
      effectiveCategories.add('nguc');
      effectiveCategories.add('vai');
      effectiveCategories.add('tay_sau');
    } else if (lower === 'pull') {
      effectiveCategories.add('lung');
      effectiveCategories.add('tay_truoc');
    } else if (lower === 'leg') {
      effectiveCategories.add('leg');
    } else {
      effectiveCategories.add(lower);
    }
  });

  return PRESET_EXERCISES_DATABASE.filter((ex) =>
    effectiveCategories.has(ex.category.toLowerCase())
  );
}

export interface ExerciseCalculatedMetrics {
  name: string;
  category: string;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  maxWeightKg: number;
  avgRir: number;
  bestSet: ExerciseSet;
}

export interface WorkoutCalculatedMetrics {
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  avgRir: number;
  exerciseMetricsMap: Map<string, ExerciseCalculatedMetrics>;
  exerciseList: ExerciseCalculatedMetrics[];
}

/**
 * Tính toán số liệu kỹ thuật buổi tập (Volume, Sets, Reps, RIR)
 */
export function calculateWorkoutMetrics(
  exercises: WorkoutExercise[],
  userWeightKg = 70
): WorkoutCalculatedMetrics {
  let totalVolumeKg = 0;
  let totalSets = 0;
  let totalReps = 0;
  let sumRir = 0;
  let rirCount = 0;

  const exerciseMetricsMap = new Map<string, ExerciseCalculatedMetrics>();
  const exerciseList: ExerciseCalculatedMetrics[] = [];

  for (const ex of exercises) {
    let exVol = 0;
    let exReps = 0;
    let exMaxW = 0;
    let exSumRir = 0;
    let bestSet: ExerciseSet = { setNumber: 1, weightKg: 0, reps: 0, rir: 2 };
    let bestSetScore = -1;

    for (const s of ex.sets) {
      const w = Number(s.weightKg) || 0;
      const r = Number(s.reps) || 0;
      const rir = typeof s.rir === 'number' && !isNaN(s.rir) ? s.rir : 2;

      // Với bài bodyweight (weight = 0): quy đổi hỗ trợ theo 60% trọng lượng cơ thể
      const effectiveWeight = w > 0 ? w : Math.round(userWeightKg * 0.6);
      const setVol = effectiveWeight * r;

      exVol += setVol;
      exReps += r;
      if (w > exMaxW) exMaxW = w;
      exSumRir += rir;

      const setScore = effectiveWeight * r * (10 - rir);
      if (setScore > bestSetScore) {
        bestSetScore = setScore;
        bestSet = { ...s, weightKg: w, reps: r, rir };
      }

      totalSets++;
      totalReps += r;
      totalVolumeKg += setVol;
      sumRir += rir;
      rirCount++;
    }

    const exAvgRir = ex.sets.length > 0 ? Math.round((exSumRir / ex.sets.length) * 10) / 10 : 2;

    const metrics: ExerciseCalculatedMetrics = {
      name: ex.name,
      category: ex.category || 'gym',
      totalSets: ex.sets.length,
      totalReps: exReps,
      totalVolumeKg: Math.round(exVol),
      maxWeightKg: exMaxW,
      avgRir: exAvgRir,
      bestSet,
    };

    exerciseMetricsMap.set(ex.name.trim().toLowerCase(), metrics);
    exerciseList.push(metrics);
  }

  const avgRir = rirCount > 0 ? Math.round((sumRir / rirCount) * 10) / 10 : 2;

  return {
    totalVolumeKg: Math.round(totalVolumeKg),
    totalSets,
    totalReps,
    avgRir,
    exerciseMetricsMap,
    exerciseList,
  };
}

/**
 * Tìm kiếm buổi tập trong quá khứ có nhóm cơ hoặc bài tập tương đồng nhất
 */
export function findBestMatchingPreviousWorkout(
  currentMuscles: string[],
  currentExercises: WorkoutExercise[],
  allRecords: Record<string, DayRecord>,
  currentDateKey: string
): { previousDateKey: string; previousWorkout: WorkoutData } | null {
  const currentMuscleSet = new Set(
    (currentMuscles || []).map((m) => m.toLowerCase().trim())
  );
  const currentExNames = new Set(
    (currentExercises || []).map((e) => e.name.toLowerCase().trim())
  );

  // Mở rộng nhóm cơ nếu là Push/Pull
  if (currentMuscleSet.has('push')) {
    currentMuscleSet.add('nguc');
    currentMuscleSet.add('vai');
    currentMuscleSet.add('tay_sau');
  }
  if (currentMuscleSet.has('pull')) {
    currentMuscleSet.add('lung');
    currentMuscleSet.add('tay_truoc');
  }

  // Sắp xếp các ngày quá khứ từ gần nhất trở về trước
  const pastDates = Object.keys(allRecords)
    .filter((dKey) => dKey < currentDateKey && allRecords[dKey]?.workoutData)
    .sort((a, b) => b.localeCompare(a));

  let bestMatch: { previousDateKey: string; previousWorkout: WorkoutData } | null = null;
  let highestScore = 0;

  for (const dKey of pastDates) {
    const wk = allRecords[dKey]?.workoutData;
    if (!wk || !Array.isArray(wk.exercises) || wk.exercises.length === 0) {
      continue;
    }

    let score = 0;
    const prevMuscles = (wk.targetMuscles || []).map((m) => m.toLowerCase().trim());
    const prevExNames = wk.exercises.map((e) => e.name.toLowerCase().trim());

    // 1. Điểm trùng nhóm cơ
    for (const pm of prevMuscles) {
      if (currentMuscleSet.has(pm)) {
        score += 8;
      }
      if (pm === 'push' && (currentMuscleSet.has('nguc') || currentMuscleSet.has('vai'))) {
        score += 6;
      }
      if (pm === 'pull' && currentMuscleSet.has('lung')) {
        score += 6;
      }
    }

    // 2. Điểm trùng bài tập cụ thể
    for (const pe of prevExNames) {
      if (currentExNames.has(pe)) {
        score += 10;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = { previousDateKey: dKey, previousWorkout: wk };
    }
  }

  // Chỉ chấp nhận nếu có ít nhất 1 bài hoặc nhóm cơ trùng khớp (score >= 6)
  if (highestScore >= 6 && bestMatch) {
    return bestMatch;
  }

  return null;
}

