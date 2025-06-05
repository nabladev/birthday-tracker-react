
import { db } from '../db';
import { birthdaysTable, friendsTable } from '../db/schema';
import { type UpdateBirthdayInput, type BirthdayWithFriend } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBirthday = async (input: UpdateBirthdayInput): Promise<BirthdayWithFriend> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.friend_id !== undefined) {
      updateData.friend_id = input.friend_id;
    }
    if (input.birth_date !== undefined) {
      // Convert Date to YYYY-MM-DD string format for date column
      updateData.birth_date = input.birth_date.toISOString().split('T')[0];
    }
    if (input.birth_year !== undefined) {
      updateData.birth_year = input.birth_year;
    }
    if (input.reminder_days !== undefined) {
      updateData.reminder_days = input.reminder_days;
    }
    if (input.is_active !== undefined) {
      updateData.is_active = input.is_active;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the birthday record
    const result = await db.update(birthdaysTable)
      .set(updateData)
      .where(eq(birthdaysTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Birthday with id ${input.id} not found`);
    }

    const updatedBirthday = result[0];

    // Fetch the friend details to return complete birthday with friend
    const birthdayWithFriend = await db.select()
      .from(birthdaysTable)
      .innerJoin(friendsTable, eq(birthdaysTable.friend_id, friendsTable.id))
      .where(eq(birthdaysTable.id, updatedBirthday.id))
      .execute();

    if (birthdayWithFriend.length === 0) {
      throw new Error(`Birthday with id ${input.id} not found after update`);
    }

    const result_data = birthdayWithFriend[0];
    return {
      id: result_data.birthdays.id,
      friend_id: result_data.birthdays.friend_id,
      birth_date: new Date(result_data.birthdays.birth_date), // Convert string back to Date
      birth_year: result_data.birthdays.birth_year,
      reminder_days: result_data.birthdays.reminder_days,
      is_active: result_data.birthdays.is_active,
      created_at: result_data.birthdays.created_at,
      updated_at: result_data.birthdays.updated_at,
      friend: {
        id: result_data.friends.id,
        name: result_data.friends.name,
        email: result_data.friends.email,
        phone: result_data.friends.phone,
        notes: result_data.friends.notes,
        created_at: result_data.friends.created_at,
        updated_at: result_data.friends.updated_at
      }
    };
  } catch (error) {
    console.error('Birthday update failed:', error);
    throw error;
  }
};
