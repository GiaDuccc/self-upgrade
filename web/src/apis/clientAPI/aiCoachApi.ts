import { axiosClient } from '~/apis/axiosClient';

export interface AiCoachResponse {
  message: string;
  messageEn?: string;
  error?: string;
}

export const getAiCoachingMessageAPI = async (
  payload: {
    dateKey?: string;
    mode?: 'greeting' | 'feedback';
    changeSignal?: string;
    language?: 'vi' | 'en';
  },
  signal?: AbortSignal
): Promise<AiCoachResponse> => {
  const res = await axiosClient.post('/ai-coach/message', payload, {
    signal,
    timeout: 6800,
  });
  return {
    message: res.data?.message || res.data?.error || '',
    messageEn: res.data?.messageEn || '',
    error: res.data?.error,
  };
};


