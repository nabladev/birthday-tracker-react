
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type CreateFriendInput, type Friend } from '../schema';

export const createFriend = async (input: CreateFriendInput): Promise<Friend> => {
  try {
    const result = await db.insert(friendsTable)
      .values({
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Friend creation failed:', error);
    throw error;
  }
};
