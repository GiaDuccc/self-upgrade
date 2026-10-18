import { axiosClient } from '~/apis/axiosClient';
import { IUser, PersonalizationOptions, UserProfile } from '~/interface/user.interface';

export const getUserProfileAPI = async (): Promise<{
  user: IUser;
  personalizationOptions: PersonalizationOptions;
}> => {
  const res = await axiosClient.get('/users/profile');
  return res.data;
};

export const updateUserProfileAPI = async (
  profilePayload: Partial<UserProfile>
): Promise<{
  user: IUser;
  message: string;
}> => {
  const res = await axiosClient.put('/users/profile', profilePayload);
  return res.data;
};

