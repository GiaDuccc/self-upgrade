import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { DisciplineDocument } from '~/types';
import { getDefaultTaskConfig } from '~/utils/statsCalculator';

const DISCIPLINE_COLLECTION_NAME = 'disciplines';

const findOrCreateByUserId = async (
  userId: string | ObjectId
): Promise<DisciplineDocument> => {
  const uid = new ObjectId(userId);
  const result = await GET_DB()
    .collection<DisciplineDocument>(DISCIPLINE_COLLECTION_NAME)
    .findOneAndUpdate(
      { userId: uid },
      {
        $setOnInsert: {
          userId: uid,
          records: {},
          taskConfig: getDefaultTaskConfig(),
          createdAt: Date.now(),
          updatedAt: null,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

  return result!;
};

const updateByUserId = async (
  userId: string | ObjectId,
  updateData: Partial<DisciplineDocument>
): Promise<DisciplineDocument | null> => {
  const uid = new ObjectId(userId);
  const cleanData: Record<string, unknown> = { ...updateData, updatedAt: Date.now() };
  delete cleanData._id;
  delete cleanData.userId;
  delete cleanData.createdAt;

  const result = await GET_DB()
    .collection<DisciplineDocument>(DISCIPLINE_COLLECTION_NAME)
    .findOneAndUpdate(
      { userId: uid },
      { $set: cleanData },
      { returnDocument: 'after', upsert: true }
    );

  return result;
};

const updateFieldsByUserId = async (
  userId: string | ObjectId,
  setFields: Record<string, unknown> = {},
  unsetFields: Record<string, unknown> = {}
): Promise<DisciplineDocument | null> => {
  const uid = new ObjectId(userId);
  const updateOp: Record<string, unknown> = {
    $set: { ...setFields, updatedAt: Date.now() },
    $setOnInsert: {
      userId: uid,
      taskConfig: getDefaultTaskConfig(),
      createdAt: Date.now(),
    },
  };
  if (Object.keys(unsetFields).length > 0) {
    updateOp.$unset = unsetFields;
  }

  const result = await GET_DB()
    .collection<DisciplineDocument>(DISCIPLINE_COLLECTION_NAME)
    .findOneAndUpdate(
      { userId: uid },
      updateOp,
      { returnDocument: 'after', upsert: true }
    );

  return result;
};

const ensureIndexes = async () => {
  await GET_DB()
    .collection<DisciplineDocument>(DISCIPLINE_COLLECTION_NAME)
    .createIndex({ userId: 1 }, { unique: true });
};

export const disciplineModel = {
  DISCIPLINE_COLLECTION_NAME,
  findOrCreateByUserId,
  updateByUserId,
  updateFieldsByUserId,
  ensureIndexes,
};

