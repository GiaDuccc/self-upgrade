import { axiosClient } from '~/apis/axiosClient';
import { IUser } from '~/interface/user.interface';

export const signUpAPI = async (payload: {
  email: string;
  password: string;
}): Promise<{
  user: IUser;
  emailSent: boolean;
  devVerifyCode?: string;
  message: string;
}> => {
  const res = await axiosClient.post('/auth/signUp', payload);
  return res.data;
};

export const verifyEmailAPI = async (payload: {
  email: string;
  code?: string;
  token?: string;
}): Promise<{
  user: IUser;
  message: string;
}> => {
  const res = await axiosClient.post('/auth/verifyEmail', payload);
  return res.data;
};

export const resendVerificationAPI = async (payload: {
  email: string;
}): Promise<{
  emailSent: boolean;
  devVerifyCode?: string;
  message: string;
}> => {
  const res = await axiosClient.post('/auth/resendVerification', payload);
  return res.data;
};

export const signInClientAPI = async (payload: {
  email: string;
  password: string;
}): Promise<{
  user: IUser;
  accessToken: string;
}> => {
  const res = await axiosClient.post('/auth/signInClient', payload);
  return res.data;
};

export const signOutClientAPI = async (): Promise<{ loggedOut: boolean }> => {
  const res = await axiosClient.delete('/auth/signOutClient');
  return res.data;
};

export const checkServerHealthAPI = async (): Promise<boolean> => {
  try {
    const res = await axiosClient.get('/status', { timeout: 3500 });
    return res.data?.status === 'OK';
  } catch {
    return false;
  }
};

