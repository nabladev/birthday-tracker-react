
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type DeleteByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteFriend = async (input: DeleteByIdInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(friendsTable)
      .where(eq(friendsTable.id, input.id))
      .execute();

    // Check if any rows were affected (friend existed and was deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Friend deletion failed:', error);
    throw error;
  }
};
