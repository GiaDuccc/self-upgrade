import { StatusCodes } from 'http-status-codes';
import { DEFAULT_USER_PROFILE, PERSONALIZATION_OPTIONS } from '~/config/settings';
import { userModel } from '~/models/userModel';
import { UserProfile } from '~/types';
import ApiError from '~/utils/ApiError';
import { pickUser } from '~/utils/formatters';

const getProfile = async (userId: string) => {
  const user = await userModel.findOneById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng!');
  }

  return {
    user: pickUser(user),
    personalizationOptions: PERSONALIZATION_OPTIONS,
  };
};

const updateProfile = async (
  userId: string,
  profilePayload: Partial<UserProfile>
) => {
  const user = await userModel.findOneById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Không tìm thấy người dùng!');
  }

  const mergedProfile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    ...(user.profile || {}),
    ...profilePayload,
  };

  const updatedUser = await userModel.update(userId, {
    profile: mergedProfile,
    isProfileSetup: true,
  });

  return {
    user: pickUser(updatedUser),
    message: 'Đã lưu thiết lập hồ sơ cá nhân thành công!',
  };
};

export const userService = {
  getProfile,
  updateProfile,
};

