import { ObjectId } from 'mongodb';
import { GET_DB } from '~/config/mongodb';
import { DisciplineDocument } from '~/types';
import { getDefaultTaskConfig } from '~/utils/statsCalculator';

const DISCIPLINE_COLLECTION_NAME = 'disciplines';

const findOrCreateByUserId = async (
  userId: string | ObjectId
): Promise<DisciplineDocument> => {
  const uid = new ObjectId(userId);
  const existing = await GET_DB()
    .collection<DisciplineDocument>(DISCIPLINE_COLLECTION_NAME)
    .findOne({ userId: uid });

  if (existing) {
    return existing;
  }

  const newDoc: DisciplineDocument = {
    userId: uid,
    records: {},
    taskConfig: getDefaultTaskConfig(),
    createdAt: Date.now(),
    updatedAt: null,
  };

  const inserted = await GET_DB()
    .collection<DisciplineDocument>(DISCIPLINE_COLLECTION_NAME)
    .insertOne(newDoc);

  return {
    ...newDoc,
    _id: inserted.insertedId,
  };
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

export const disciplineModel = {
  DISCIPLINE_COLLECTION_NAME,
  findOrCreateByUserId,
  updateByUserId,
};

