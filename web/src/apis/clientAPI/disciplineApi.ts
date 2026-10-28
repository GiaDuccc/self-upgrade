import { axiosClient } from '~/apis/axiosClient';
import {
  DayDataResponse,
  MonthDataResponse,
  TaskLevelKey,
  TaskScope,
} from '~/interface/discipline.interface';

export const getMonthDataAPI = async (
  year: number,
  month: number
): Promise<MonthDataResponse> => {
  const res = await axiosClient.get('/disciplines/month', {
    params: { year, month },
  });
  return res.data;
};

export const getDayDataAPI = async (
  dateKey: string
): Promise<DayDataResponse> => {
  const res = await axiosClient.get(`/disciplines/day/${dateKey}`);
  return res.data;
};

export const setTaskLevelAPI = async (payload: {
  dateKey: string;
  taskId: string;
  levelKey: TaskLevelKey;
  hours?: number[];
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/task-level', payload);
  return res.data;
};

export const markAllLevelAPI = async (payload: {
  dateKey: string;
  levelKey: TaskLevelKey;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/mark-all', payload);
  return res.data;
};

export const clearDayAPI = async (payload: {
  dateKey: string;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.delete('/disciplines/clear-day', {
    data: payload,
  });
  return res.data;
};

export const updateNoteAPI = async (payload: {
  dateKey: string;
  note: string;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/note', payload);
  return res.data;
};

export const saveDayCaloriesAPI = async (payload: {
  dateKey: string;
  meals: import('~/interface/discipline.interface').FoodItem[];
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/day/calories', payload);
  return res.data;
};

export const saveDayStatesAPI = async (payload: {
  dateKey: string;
  physicalState: string;
  mentalState: string;
  emotionalState: string;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/day/states', payload);
  return res.data;
};

export const saveDayWorkoutAPI = async (payload: {
  dateKey: string;
  targetMuscles: string[];
  exercises: import('~/interface/discipline.interface').WorkoutExercise[];
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/day/workout', payload);
  return res.data;
};

export const saveDayWaterAPI = async (payload: {
  dateKey: string;
  waterData: import('~/interface/discipline.interface').WaterData;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/day/water', payload);
  return res.data;
};

export const saveDaySleepAPI = async (payload: {
  dateKey: string;
  sleepData: import('~/interface/discipline.interface').SleepData;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.put('/disciplines/day/sleep', payload);
  return res.data;
};

export const saveTaskAPI = async (payload: {
  mode: 'add' | 'edit';
  taskId?: string;
  title: string;
  category: string;
  timeHint: string;
  startTime?: string;
  endTime?: string;
  scope: TaskScope;
  dateKey: string;
  hour?: number;
  columnIndex?: number;
  isAllDay?: boolean;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.post('/disciplines/task', payload);
  return res.data;
};

export const deleteTaskAPI = async (payload: {
  taskId: string;
  scope: TaskScope;
  dateKey: string;
}): Promise<DayDataResponse> => {
  const res = await axiosClient.post('/disciplines/task/delete', payload);
  return res.data;
};

export const exportDisciplineDataAPI = async (): Promise<Record<string, unknown>> => {
  const res = await axiosClient.get('/disciplines/export');
  return res.data;
};

export const importDisciplineDataAPI = async (
  payload: Record<string, unknown>
): Promise<{ message: string }> => {
  const res = await axiosClient.post('/disciplines/import', payload);
  return res.data;
};

