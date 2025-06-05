
import { db } from '../db';
import { birthdaysTable } from '../db/schema';
import { type DeleteByIdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBirthday = async (input: DeleteByIdInput): Promise<{ success: boolean }> => {
  try {
    const result = await db.delete(birthdaysTable)
      .where(eq(birthdaysTable.id, input.id))
      .execute();

    // Check if any rows were affected (deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Birthday deletion failed:', error);
    throw error;
  }
};
