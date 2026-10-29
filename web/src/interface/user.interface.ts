export interface UserProfile {
  name: string;
  gender?: 'male' | 'female';
  age: string;
  weightKg: string;
  heightCm: string;
  sleepTargetHours: string;
  physicalState: string;
  mentalState: string;
  emotionalState: string;
  focusGoal: string;
  coachingStyle: string;
  personalMotto: string;
  workoutGoal?: string;
  workoutLevel?: string;
  macroMode?: 'auto' | 'custom';
  targetCalories?: string | number;
  targetProtein?: string | number;
  targetCarb?: string | number;
  targetFat?: string | number;
  targetFiber?: string | number;
}

export interface IUser {
  _id: string;
  email: string;
  role: 'client' | 'admin';
  isVerified: boolean;
  isProfileSetup: boolean;
  profile: UserProfile;
  createdAt?: number;
  updatedAt?: number | null;
}

export interface StateOption {
  id: string;
  tier?: 'bad' | 'medium' | 'good' | 'perfect';
  tierLabel?: string;
  color?: string;
  label: string;
  desc: string;
  resilienceBonus?: number;
  boostCategories?: string[];
  boostTaskIds?: string[];
}

export interface WorkoutGoalOption {
  id: string;
  label: string;
  labelEn?: string;
  desc?: string;
}

export interface WorkoutLevelOption {
  id: string;
  label: string;
  labelEn?: string;
  desc?: string;
}

export interface PersonalizationOptions {
  physicalStates: StateOption[];
  mentalStates: StateOption[];
  emotionalStates: StateOption[];
  focusGoals: StateOption[];
  coachingStyles: StateOption[];
  workoutGoals?: WorkoutGoalOption[];
  workoutLevels?: WorkoutLevelOption[];
}


