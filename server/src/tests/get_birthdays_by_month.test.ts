
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, birthdaysTable } from '../db/schema';
import { getBirthdaysByMonth } from '../handlers/get_birthdays_by_month';

describe('getBirthdaysByMonth', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return birthdays for the specified month', async () => {
    // Create test friend
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        notes: 'Test friend'
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create birthday in March (month 3)
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-03-15', // March 15th
        birth_year: 1990,
        reminder_days: 7,
        is_active: true
      })
      .execute();

    // Create birthday in April (month 4) - should not be returned
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-04-20', // April 20th
        birth_year: 1985,
        reminder_days: 5,
        is_active: true
      })
      .execute();

    const results = await getBirthdaysByMonth(2024, 3);

    expect(results).toHaveLength(1);
    expect(results[0].birth_date).toEqual(new Date('2024-03-15'));
    expect(results[0].birth_year).toEqual(1990);
    expect(results[0].friend.name).toEqual('John Doe');
    expect(results[0].friend.email).toEqual('john@example.com');
  });

  it('should return empty array when no birthdays in month', async () => {
    // Create test friend
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: null,
        notes: null
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create birthday in January
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-01-10',
        birth_year: null,
        reminder_days: 14,
        is_active: true
      })
      .execute();

    // Query for February - should return empty
    const results = await getBirthdaysByMonth(2024, 2);

    expect(results).toHaveLength(0);
  });

  it('should exclude inactive birthdays', async () => {
    // Create test friend
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Bob Wilson',
        email: null,
        phone: '555-0123',
        notes: 'Birthday person'
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create active birthday
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-06-25',
        birth_year: 1995,
        reminder_days: 3,
        is_active: true
      })
      .execute();

    // Create inactive birthday in same month
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-06-30',
        birth_year: 1990,
        reminder_days: 7,
        is_active: false
      })
      .execute();

    const results = await getBirthdaysByMonth(2024, 6);

    expect(results).toHaveLength(1);
    expect(results[0].birth_date).toEqual(new Date('2024-06-25'));
    expect(results[0].is_active).toBe(true);
  });

  it('should order birthdays by day of month', async () => {
    // Create test friend
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Multi Birthday Friend',
        email: 'multi@example.com',
        phone: null,
        notes: null
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create birthdays on different days in May
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-05-25', // 25th - should be last
        birth_year: 1990,
        reminder_days: 7,
        is_active: true
      })
      .execute();

    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-05-05', // 5th - should be first
        birth_year: 1985,
        reminder_days: 10,
        is_active: true
      })
      .execute();

    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-05-15', // 15th - should be middle
        birth_year: 1995,
        reminder_days: 5,
        is_active: true
      })
      .execute();

    const results = await getBirthdaysByMonth(2024, 5);

    expect(results).toHaveLength(3);
    expect(results[0].birth_date).toEqual(new Date('2024-05-05'));
    expect(results[1].birth_date).toEqual(new Date('2024-05-15'));
    expect(results[2].birth_date).toEqual(new Date('2024-05-25'));
  });

  it('should handle birthdays with null birth_year', async () => {
    // Create test friend
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Ageless Friend',
        email: 'ageless@example.com',
        phone: null,
        notes: 'No year provided'
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create birthday without birth year
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '2024-12-01',
        birth_year: null,
        reminder_days: 14,
        is_active: true
      })
      .execute();

    const results = await getBirthdaysByMonth(2024, 12);

    expect(results).toHaveLength(1);
    expect(results[0].birth_year).toBeNull();
    expect(results[0].friend.name).toEqual('Ageless Friend');
    expect(results[0].reminder_days).toEqual(14);
  });
});
