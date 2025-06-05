
import { db } from '../db';
import { birthdaysTable, friendsTable } from '../db/schema';
import { type BirthdayWithFriend } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export const getBirthdaysByMonth = async (year: number, month: number): Promise<BirthdayWithFriend[]> => {
  try {
    // Query birthdays for the specific month, joining with friends data
    const results = await db.select()
      .from(birthdaysTable)
      .innerJoin(friendsTable, eq(birthdaysTable.friend_id, friendsTable.id))
      .where(
        and(
          eq(birthdaysTable.is_active, true),
          // Extract month from birth_date and compare
          sql`EXTRACT(MONTH FROM ${birthdaysTable.birth_date}) = ${month}`
        )
      )
      .orderBy(sql`EXTRACT(DAY FROM ${birthdaysTable.birth_date})`)
      .execute();

    // Transform joined results to match BirthdayWithFriend type
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
    console.error('Failed to get birthdays by month:', error);
    throw error;
  }
};
