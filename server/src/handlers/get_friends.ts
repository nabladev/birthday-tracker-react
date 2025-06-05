
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type Friend } from '../schema';

export const getFriends = async (): Promise<Friend[]> => {
  try {
    const results = await db.select()
      .from(friendsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get friends:', error);
    throw error;
  }
};
