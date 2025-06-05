
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type UpdateFriendInput, type Friend } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFriend = async (input: UpdateFriendInput): Promise<Friend> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof friendsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.email !== undefined) {
      updateData.email = input.email;
    }
    
    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }
    
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Set updated_at timestamp
    updateData.updated_at = new Date();

    // Update the friend record
    const result = await db.update(friendsTable)
      .set(updateData)
      .where(eq(friendsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Friend with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Friend update failed:', error);
    throw error;
  }
};
