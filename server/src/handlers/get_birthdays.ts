
import { db } from '../db';
import { birthdaysTable, friendsTable } from '../db/schema';
import { type BirthdayWithFriend } from '../schema';
import { eq } from 'drizzle-orm';

export const getBirthdays = async (): Promise<BirthdayWithFriend[]> => {
  try {
    // Join birthdays with friends to get complete data
    const results = await db.select()
      .from(birthdaysTable)
      .innerJoin(friendsTable, eq(birthdaysTable.friend_id, friendsTable.id))
      .execute();

    // Transform the joined results to match BirthdayWithFriend schema
    return results.map(result => ({
      id: result.birthdays.id,
      friend_id: result.birthdays.friend_id,
      birth_date: new Date(result.birthdays.birth_date), // Convert string to Date
      birth_year: result.birthdays.birth_year,
      reminder_days: result.birthdays.reminder_days,
      is_active: result.birthdays.is_active,
      created_at: result.birthdays.created_at,
      updated_at: result.birthdays.updated_at,
      friend: {
        id: result.friends.id,
        name: result.friends.name,
        email: result.friends.email,
        phone: result.friends.phone,
        notes: result.friends.notes,
        created_at: result.friends.created_at,
        updated_at: result.friends.updated_at
      }
    }));
  } catch (error) {
    console.error('Get birthdays failed:', error);
    throw error;
  }
};
