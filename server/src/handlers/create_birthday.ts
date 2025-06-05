
import { db } from '../db';
import { birthdaysTable, friendsTable } from '../db/schema';
import { type CreateBirthdayInput, type BirthdayWithFriend } from '../schema';
import { eq } from 'drizzle-orm';

export const createBirthday = async (input: CreateBirthdayInput): Promise<BirthdayWithFriend> => {
  try {
    // First verify that the friend exists
    const friend = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, input.friend_id))
      .execute();

    if (friend.length === 0) {
      throw new Error(`Friend with ID ${input.friend_id} not found`);
    }

    // Insert birthday record - convert Date to string for date column
    const result = await db.insert(birthdaysTable)
      .values({
        friend_id: input.friend_id,
        birth_date: input.birth_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        birth_year: input.birth_year,
        reminder_days: input.reminder_days,
        is_active: input.is_active
      })
      .returning()
      .execute();

    const birthday = result[0];

    // Return birthday with friend details - convert string back to Date
    return {
      ...birthday,
      birth_date: new Date(birthday.birth_date), // Convert string back to Date
      friend: friend[0]
    };
  } catch (error) {
    console.error('Birthday creation failed:', error);
    throw error;
  }
};
