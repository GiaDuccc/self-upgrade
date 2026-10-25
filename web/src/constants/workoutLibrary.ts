export interface PresetExercise {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  primaryMuscle: string;
  primaryMuscleEn: string;
  equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight';
}

export const MUSCLE_GROUP_OPTIONS = [
  { id: 'nguc', label: 'Ngực', labelEn: 'Chest' },
  { id: 'lung', label: 'Lưng & Xô', labelEn: 'Back & Lats' },
  { id: 'vai', label: 'Vai', labelEn: 'Shoulders' },
  { id: 'tay_sau', label: 'Tay sau', labelEn: 'Triceps' },
  { id: 'tay_truoc', label: 'Tay trước', labelEn: 'Biceps' },
  { id: 'core', label: 'Bụng & Core', labelEn: 'Abs & Core' },
  { id: 'push', label: 'Push (Đẩy)', labelEn: 'Push Split' },
  { id: 'pull', label: 'Pull (Kéo)', labelEn: 'Pull Split' },
  { id: 'leg', label: 'Leg (Chân & Mông)', labelEn: 'Legs & Glutes' },
] as const;

export const PRESET_EXERCISES_DATABASE: PresetExercise[] = [
  // NGỰC (CHEST)
  { id: 'bench_press', name: 'Barbell Bench Press (Nằm đẩy tạ đòn)', nameEn: 'Barbell Bench Press', category: 'nguc', primaryMuscle: 'Ngực giữa', primaryMuscleEn: 'Mid Chest', equipment: 'barbell' },
  { id: 'incline_db_press', name: 'Incline Dumbbell Press (Đẩy ngực trên tạ đơn)', nameEn: 'Incline Dumbbell Press', category: 'nguc', primaryMuscle: 'Ngực trên', primaryMuscleEn: 'Upper Chest', equipment: 'dumbbell' },
  { id: 'decline_bench_press', name: 'Decline Bench Press (Đẩy ngực dưới)', nameEn: 'Decline Bench Press', category: 'nguc', primaryMuscle: 'Ngực dưới', primaryMuscleEn: 'Lower Chest', equipment: 'barbell' },
  { id: 'db_chest_fly', name: 'Dumbbell Chest Fly (Banh ngực tạ đơn)', nameEn: 'Dumbbell Chest Fly', category: 'nguc', primaryMuscle: 'Banh ngực', primaryMuscleEn: 'Chest Stretch', equipment: 'dumbbell' },
  { id: 'cable_crossover', name: 'Cable Crossover (Ép ngực với dây cáp)', nameEn: 'Cable Crossover', category: 'nguc', primaryMuscle: 'Ngực trong & định hình', primaryMuscleEn: 'Inner Chest', equipment: 'cable' },
  { id: 'chest_dips', name: 'Chest Dips (Chống xà kép ngực)', nameEn: 'Chest Dips', category: 'nguc', primaryMuscle: 'Ngực dưới & Tay sau', primaryMuscleEn: 'Lower Chest & Triceps', equipment: 'bodyweight' },
  { id: 'push_ups', name: 'Push-ups (Hít đất / Chống đẩy)', nameEn: 'Push-ups', category: 'nguc', primaryMuscle: 'Ngực toàn diện', primaryMuscleEn: 'Overall Chest', equipment: 'bodyweight' },
  { id: 'machine_chest_press', name: 'Machine Chest Press (Đẩy ngực máy)', nameEn: 'Machine Chest Press', category: 'nguc', primaryMuscle: 'Ngực', primaryMuscleEn: 'Chest', equipment: 'machine' },

  // LƯNG & XÔ (BACK & LATS)
  { id: 'deadlift', name: 'Conventional Deadlift (Kéo tạ đòn chạm đất)', nameEn: 'Conventional Deadlift', category: 'lung', primaryMuscle: 'Toàn bộ lưng & Đùi sau', primaryMuscleEn: 'Full Back & Hamstrings', equipment: 'barbell' },
  { id: 'barbell_row', name: 'Barbell Bent-over Row (Kéo lưng tạ đòn)', nameEn: 'Barbell Bent-over Row', category: 'lung', primaryMuscle: 'Độ dày lưng giữa', primaryMuscleEn: 'Mid Back Thickness', equipment: 'barbell' },
  { id: 'lat_pulldown', name: 'Lat Pulldown (Kéo xô cáp)', nameEn: 'Lat Pulldown', category: 'lung', primaryMuscle: 'Độ rộng cơ xô (Lats)', primaryMuscleEn: 'Lat Width', equipment: 'cable' },
  { id: 'pull_ups', name: 'Pull-ups (Hít xà đơn)', nameEn: 'Pull-ups', category: 'lung', primaryMuscle: 'Cơ xô & Bắp tay', primaryMuscleEn: 'Lats & Biceps', equipment: 'bodyweight' },
  { id: 'seated_cable_row', name: 'Seated Cable Row (Kéo cáp ngồi)', nameEn: 'Seated Cable Row', category: 'lung', primaryMuscle: 'Lưng giữa & Xô', primaryMuscleEn: 'Mid Back', equipment: 'cable' },
  { id: 'one_arm_db_row', name: 'One-arm Dumbbell Row (Kéo tạ đơn 1 tay)', nameEn: 'One-arm Dumbbell Row', category: 'lung', primaryMuscle: 'Cơ xô từng bên', primaryMuscleEn: 'Unilateral Lats', equipment: 'dumbbell' },
  { id: 't_bar_row', name: 'T-Bar Row (Kéo tạ chữ T)', nameEn: 'T-Bar Row', category: 'lung', primaryMuscle: 'Lưng giữa & cầu vai', primaryMuscleEn: 'Upper Mid Back', equipment: 'barbell' },
  { id: 'face_pull', name: 'Face Pull (Kéo cáp vào mặt)', nameEn: 'Face Pull', category: 'lung', primaryMuscle: 'Cơ lưng trên & Vai sau', primaryMuscleEn: 'Upper Back & Rear Delts', equipment: 'cable' },

  // VAI (SHOULDERS)
  { id: 'ohp', name: 'Overhead Press / OHP (Đẩy vai tạ đòn đứng)', nameEn: 'Overhead Press (OHP)', category: 'vai', primaryMuscle: 'Vai trước & Khối vai', primaryMuscleEn: 'Anterior Delt & Power', equipment: 'barbell' },
  { id: 'db_shoulder_press', name: 'Dumbbell Shoulder Press (Đẩy vai tạ đơn)', nameEn: 'Dumbbell Shoulder Press', category: 'vai', primaryMuscle: 'Vai trước & giữa', primaryMuscleEn: 'Front & Side Delts', equipment: 'dumbbell' },
  { id: 'db_lateral_raise', name: 'Dumbbell Lateral Raise (Dang tạ đơn sang bên)', nameEn: 'Dumbbell Lateral Raise', category: 'vai', primaryMuscle: 'Vai giữa (Bờ vai chữ V)', primaryMuscleEn: 'Lateral Delt (Width)', equipment: 'dumbbell' },
  { id: 'cable_lateral_raise', name: 'Cable Lateral Raise (Dang cáp ngang)', nameEn: 'Cable Lateral Raise', category: 'vai', primaryMuscle: 'Vai giữa (Căng cơ liên tục)', primaryMuscleEn: 'Side Delt Constant Tension', equipment: 'cable' },
  { id: 'rear_delt_fly', name: 'Rear Delt Fly (Banh vai sau)', nameEn: 'Rear Delt Fly', category: 'vai', primaryMuscle: 'Vai sau (Rear Delts)', primaryMuscleEn: 'Rear Delts', equipment: 'dumbbell' },
  { id: 'arnold_press', name: 'Arnold Press (Đẩy vai xoay tay Arnold)', nameEn: 'Arnold Press', category: 'vai', primaryMuscle: 'Toàn diện 3 đầu cơ vai', primaryMuscleEn: '3D Shoulders', equipment: 'dumbbell' },
  { id: 'barbell_shrug', name: 'Barbell Shrug (Nhún cầu vai)', nameEn: 'Barbell Shrug', category: 'vai', primaryMuscle: 'Cầu vai (Traps)', primaryMuscleEn: 'Upper Traps', equipment: 'barbell' },

  // TAY SAU (TRICEPS)
  { id: 'tricep_pushdown', name: 'Tricep Rope Pushdown (Kéo cáp dây thừng)', nameEn: 'Tricep Rope Pushdown', category: 'tay_sau', primaryMuscle: 'Đầu ngoài tay sau', primaryMuscleEn: 'Lateral Head', equipment: 'cable' },
  { id: 'skull_crusher', name: 'Skull Crusher (Nằm đẩy tạ đòn tập tay sau)', nameEn: 'Skull Crusher', category: 'tay_sau', primaryMuscle: 'Đầu dài tay sau', primaryMuscleEn: 'Long Head', equipment: 'barbell' },
  { id: 'overhead_tricep_ext', name: 'Overhead DB Tricep Extension (Đưa tạ qua đầu)', nameEn: 'Overhead Dumbbell Tricep Extension', category: 'tay_sau', primaryMuscle: 'Đầu dài tay sau', primaryMuscleEn: 'Tricep Long Head Stretch', equipment: 'dumbbell' },
  { id: 'close_grip_bench', name: 'Close-grip Bench Press (Đẩy ngực tay hẹp)', nameEn: 'Close-grip Bench Press', category: 'tay_sau', primaryMuscle: 'Tay sau & Ngực trong', primaryMuscleEn: 'Triceps & Inner Chest', equipment: 'barbell' },
  { id: 'bench_dips', name: 'Bench Dips (Chống đẩy tay sau trên ghế)', nameEn: 'Bench Dips', category: 'tay_sau', primaryMuscle: 'Tay sau', primaryMuscleEn: 'Triceps', equipment: 'bodyweight' },

  // TAY TRƯỚC (BICEPS)
  { id: 'barbell_bicep_curl', name: 'Barbell Bicep Curl (Cuốn tạ đòn đứng)', nameEn: 'Barbell Bicep Curl', category: 'tay_truoc', primaryMuscle: 'Đỉnh bắp tay trước', primaryMuscleEn: 'Bicep Peak', equipment: 'barbell' },
  { id: 'dumbbell_curl', name: 'Dumbbell Curl (Cuốn tạ đơn xoay cổ tay)', nameEn: 'Dumbbell Curl', category: 'tay_truoc', primaryMuscle: 'Bắp tay trước', primaryMuscleEn: 'Biceps', equipment: 'dumbbell' },
  { id: 'hammer_curl', name: 'Hammer Curl (Cuốn tạ búa)', nameEn: 'Hammer Curl', category: 'tay_truoc', primaryMuscle: 'Cơ Brachialis & Cẳng tay', primaryMuscleEn: 'Brachialis & Forearms', equipment: 'dumbbell' },
  { id: 'incline_db_curl', name: 'Incline Dumbbell Curl (Cuốn tạ ghế dốc)', nameEn: 'Incline Dumbbell Curl', category: 'tay_truoc', primaryMuscle: 'Kéo dài đầu dài bắp tay', primaryMuscleEn: 'Long Head Stretch', equipment: 'dumbbell' },
  { id: 'preacher_curl', name: 'Preacher Curl (Cuốn tạ ghế nghiêng)', nameEn: 'Preacher Curl', category: 'tay_truoc', primaryMuscle: 'Cô lập bắp tay trước', primaryMuscleEn: 'Bicep Isolation', equipment: 'barbell' },
  { id: 'cable_bicep_curl', name: 'Cable Bicep Curl (Cuốn bắp tay với cáp)', nameEn: 'Cable Bicep Curl', category: 'tay_truoc', primaryMuscle: 'Bắp tay trước', primaryMuscleEn: 'Biceps', equipment: 'cable' },

  // BỤNG & CORE (ABS & CORE)
  { id: 'hanging_leg_raise', name: 'Hanging Leg Raise (Treo xà nâng chân)', nameEn: 'Hanging Leg Raise', category: 'core', primaryMuscle: 'Bụng dưới', primaryMuscleEn: 'Lower Abs', equipment: 'bodyweight' },
  { id: 'cable_crunch', name: 'Cable Crunch (Quỳ kéo cáp gập bụng)', nameEn: 'Cable Crunch', category: 'core', primaryMuscle: 'Cơ bụng 6 múi', primaryMuscleEn: 'Upper & Mid Abs', equipment: 'cable' },
  { id: 'plank', name: 'Plank (Giữ thân thẳng tĩnh)', nameEn: 'Plank', category: 'core', primaryMuscle: 'Toàn bộ cơ lõi Core', primaryMuscleEn: 'Core Stability', equipment: 'bodyweight' },
  { id: 'ab_wheel_rollout', name: 'Ab Wheel Rollout (Lăn con lăn tập bụng)', nameEn: 'Ab Wheel Rollout', category: 'core', primaryMuscle: 'Cơ bụng & cơ lưng dưới', primaryMuscleEn: 'Deep Core', equipment: 'bodyweight' },
  { id: 'russian_twist', name: 'Russian Twist (Vặn người kiểu Nga)', nameEn: 'Russian Twist', category: 'core', primaryMuscle: 'Cơ liên sườn', primaryMuscleEn: 'Obliques', equipment: 'bodyweight' },

  // CHÂN & MÔNG (LEGS & GLUTES)
  { id: 'barbell_squat', name: 'Barbell Back Squat (Gánh đùi tạ đòn)', nameEn: 'Barbell Back Squat', category: 'leg', primaryMuscle: 'Cơ đùi trước & Mông', primaryMuscleEn: 'Quads & Glutes', equipment: 'barbell' },
  { id: 'leg_press', name: 'Leg Press (Đạp đùi trên máy nghiêng)', nameEn: 'Leg Press', category: 'leg', primaryMuscle: 'Đùi trước & Mông', primaryMuscleEn: 'Quads & Glutes', equipment: 'machine' },
  { id: 'rdl', name: 'Romanian Deadlift / RDL (RDL đùi sau & mông)', nameEn: 'Romanian Deadlift (RDL)', category: 'leg', primaryMuscle: 'Đùi sau (Hamstrings) & Mông', primaryMuscleEn: 'Hamstrings & Glutes', equipment: 'barbell' },
  { id: 'bulgarian_split_squat', name: 'Bulgarian Split Squat (Squat 1 chân)', nameEn: 'Bulgarian Split Squat', category: 'leg', primaryMuscle: 'Đùi trước & Mông sâu', primaryMuscleEn: 'Unilateral Legs & Glutes', equipment: 'dumbbell' },
  { id: 'leg_extension', name: 'Leg Extension (Đá đùi trước máy)', nameEn: 'Leg Extension', category: 'leg', primaryMuscle: 'Cơ đùi trước (Quads)', primaryMuscleEn: 'Quads Isolation', equipment: 'machine' },
  { id: 'lying_leg_curl', name: 'Lying Leg Curl (Móc đùi sau máy)', nameEn: 'Lying Leg Curl', category: 'leg', primaryMuscle: 'Đùi sau (Hamstrings)', primaryMuscleEn: 'Hamstrings Isolation', equipment: 'machine' },
  { id: 'hip_thrust', name: 'Barbell Hip Thrust (Đẩy hông tạ đòn)', nameEn: 'Barbell Hip Thrust', category: 'leg', primaryMuscle: 'Cơ mông tối đa (Glutes)', primaryMuscleEn: 'Glute Max', equipment: 'barbell' },
  { id: 'standing_calf_raise', name: 'Standing Calf Raise (Nhón bắp chân đứng)', nameEn: 'Standing Calf Raise', category: 'leg', primaryMuscle: 'Bắp chân', primaryMuscleEn: 'Calves', equipment: 'machine' },
];

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

