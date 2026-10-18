import { UserDocument } from '~/types';

export const pickUser = (user: Partial<UserDocument> | null) => {
  if (!user) return null;
  return {
    _id: user._id ? user._id.toString() : '',
    email: user.email || '',
    role: user.role || 'client',
    isVerified: Boolean(user.isVerified),
    isProfileSetup: Boolean(user.isProfileSetup),
    profile: user.profile,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

