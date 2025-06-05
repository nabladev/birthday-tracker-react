
import { db } from '../db';
import { birthdaysTable, friendsTable } from '../db/schema';
import { type GetCalendarDataInput, type CalendarDay } from '../schema';
import { eq, and, sql, type SQL } from 'drizzle-orm';

export const getCalendarData = async (input: GetCalendarDataInput): Promise<CalendarDay[]> => {
  try {
    // Build the base query to get birthdays with friend details
    let baseQuery = db.select({
      birthday_id: birthdaysTable.id,
      friend_id: birthdaysTable.friend_id,
      birth_date: birthdaysTable.birth_date,
      birth_year: birthdaysTable.birth_year,
      reminder_days: birthdaysTable.reminder_days,
      is_active: birthdaysTable.is_active,
      birthday_created_at: birthdaysTable.created_at,
      birthday_updated_at: birthdaysTable.updated_at,
      friend_id_ref: friendsTable.id,
      friend_name: friendsTable.name,
      friend_email: friendsTable.email,
      friend_phone: friendsTable.phone,
      friend_notes: friendsTable.notes,
      friend_created_at: friendsTable.created_at,
      friend_updated_at: friendsTable.updated_at
    })
    .from(birthdaysTable)
    .innerJoin(friendsTable, eq(birthdaysTable.friend_id, friendsTable.id));

    // Build conditions for date filtering
    const conditions: SQL<unknown>[] = [eq(birthdaysTable.is_active, true)];

    if (input.month) {
      // Filter for specific month and year
      conditions.push(
        sql`EXTRACT(MONTH FROM ${birthdaysTable.birth_date}) = ${input.month}`
      );
      conditions.push(
        sql`(EXTRACT(YEAR FROM ${birthdaysTable.birth_date}) = ${input.year} OR ${birthdaysTable.birth_year} IS NULL)`
      );
    } else {
      // Filter for entire year (or any year if birth_year is null)
      conditions.push(
        sql`(EXTRACT(YEAR FROM ${birthdaysTable.birth_date}) = ${input.year} OR ${birthdaysTable.birth_year} IS NULL)`
      );
    }

    // Apply where clause with all conditions
    const query = baseQuery.where(and(...conditions));

    const results = await query.execute();

    // Group birthdays by date
    const birthdaysByDate = new Map<string, any[]>();

    results.forEach(result => {
      const dateKey = result.birth_date;
      if (!birthdaysByDate.has(dateKey)) {
        birthdaysByDate.set(dateKey, []);
      }

      const birthday = {
        id: result.birthday_id,
        friend_id: result.friend_id,
        birth_date: new Date(result.birth_date),
        birth_year: result.birth_year,
        reminder_days: result.reminder_days,
        is_active: result.is_active,
        created_at: result.birthday_created_at,
        updated_at: result.birthday_updated_at,
        friend: {
          id: result.friend_id_ref,
          name: result.friend_name,
          email: result.friend_email,
          phone: result.friend_phone,
          notes: result.friend_notes,
          created_at: result.friend_created_at,
          updated_at: result.friend_updated_at
        }
      };

      birthdaysByDate.get(dateKey)!.push(birthday);
    });

    // Convert to CalendarDay array
    const calendarDays: CalendarDay[] = [];
    birthdaysByDate.forEach((birthdays, dateKey) => {
      calendarDays.push({
        date: new Date(dateKey),
        birthdays: birthdays
      });
    });

    // Sort by date
    calendarDays.sort((a, b) => a.date.getTime() - b.date.getTime());

    return calendarDays;
  } catch (error) {
    console.error('Get calendar data failed:', error);
    throw error;
  }
};
