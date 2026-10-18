import { axiosClient } from '~/apis/axiosClient';

export const getAiCoachingMessageAPI = async (payload: {
  dateKey?: string;
  mode?: 'greeting' | 'feedback';
}): Promise<string> => {
  const res = await axiosClient.post('/ai-coach/message', payload);
  return res.data.message;
};

