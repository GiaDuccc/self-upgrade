import { axiosClient } from '~/apis/axiosClient';

export const getAiCoachingMessageAPI = async (
  payload: {
    dateKey?: string;
    mode?: 'greeting' | 'feedback';
    changeSignal?: string;
  },
  signal?: AbortSignal
): Promise<string> => {
  const res = await axiosClient.post('/ai-coach/message', payload, {
    signal,
    timeout: 6800,
  });
  return res.data?.message || res.data?.error || '';
};


