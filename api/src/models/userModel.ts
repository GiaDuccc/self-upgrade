import Joi from 'joi';
import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { DEFAULT_USER_PROFILE } from '~/config/settings';
import { UserDocument } from '~/types';
import { EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators';

const USER_COLLECTION_NAME = 'users';

const USER_COLLECTION_SCHEMA = Joi.object({
  email: Joi.string()
    .required()
    .pattern(EMAIL_RULE)
    .message(EMAIL_RULE_MESSAGE)
    .trim()
    .lowercase(),
  password: Joi.string().required(),
  role: Joi.string().valid('client', 'admin').default('client'),
  isVerified: Joi.boolean().default(false),
  verifyToken: Joi.string().allow(null, '').default(null),
  verifyCode: Joi.string().allow(null, '').default(null),
  verifyCodeExpires: Joi.number().allow(null).default(null),
  refreshToken: Joi.string().allow(null, '').default(null),
  isProfileSetup: Joi.boolean().default(false),
  profile: Joi.object({
    name: Joi.string().allow('').default(''),
    age: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).default(''),
    heightCm: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).default(''),
    weightKg: Joi.alternatives().try(Joi.number(), Joi.string().allow('')).default(''),
    sleepTargetHours: Joi.alternatives()
      .try(Joi.number(), Joi.string().allow(''))
      .default(DEFAULT_USER_PROFILE.sleepTargetHours),
    physicalState: Joi.string().default(DEFAULT_USER_PROFILE.physicalState),
    mentalState: Joi.string().default(DEFAULT_USER_PROFILE.mentalState),
    emotionalState: Joi.string().default(DEFAULT_USER_PROFILE.emotionalState),
    focusGoal: Joi.string().default(DEFAULT_USER_PROFILE.focusGoal),
    coachingStyle: Joi.string().default(DEFAULT_USER_PROFILE.coachingStyle),
    personalMotto: Joi.string().allow('').default(DEFAULT_USER_PROFILE.personalMotto),
  }).default(DEFAULT_USER_PROFILE),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').allow(null).default(null),
  _destroy: Joi.boolean().default(false),
});

const INVALID_UPDATE_FIELDS = ['_id', 'email', 'createdAt'];

const validateBeforeCreate = async (data: Record<string, unknown>) => {
  return await USER_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false,
  });
};

const createNew = async (data: Record<string, unknown>) => {
  const validData = await validateBeforeCreate(data);
  const createdUser = await GET_DB()
    .collection<UserDocument>(USER_COLLECTION_NAME)
    .insertOne(validData);
  return createdUser;
};

const findOneById = async (id: string | ObjectId) => {
  return await GET_DB()
    .collection<UserDocument>(USER_COLLECTION_NAME)
    .findOne({ _id: new ObjectId(id), _destroy: false });
};

const findOneByEmail = async (email: string) => {
  return await GET_DB()
    .collection<UserDocument>(USER_COLLECTION_NAME)
    .findOne({ email: email.trim().toLowerCase(), _destroy: false });
};

const update = async (
  userId: string | ObjectId,
  updateData: Record<string, unknown>
) => {
  const cleanData = { ...updateData };
  INVALID_UPDATE_FIELDS.forEach((field) => {
    delete cleanData[field];
  });
  cleanData.updatedAt = Date.now();

  const result = await GET_DB()
    .collection<UserDocument>(USER_COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(userId), _destroy: false },
      { $set: cleanData },
      { returnDocument: 'after' }
    );
  return result;
};

export const userModel = {
  USER_COLLECTION_NAME,
  USER_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  findOneByEmail,
  update,
};

