
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, birthdaysTable } from '../db/schema';
import { type GetCalendarDataInput } from '../schema';
import { getCalendarData } from '../handlers/get_calendar_data';

// Test friends
const friend1 = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '123-456-7890',
  notes: 'Best friend'
};

const friend2 = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: null,
  notes: null
};

describe('getCalendarData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get calendar data for a specific year', async () => {
    // Create friends first
    const friendResults = await db.insert(friendsTable)
      .values([friend1, friend2])
      .returning()
      .execute();

    // Create birthdays for 2024
    await db.insert(birthdaysTable)
      .values([
        {
          friend_id: friendResults[0].id,
          birth_date: '2024-03-15',
          birth_year: 1990,
          reminder_days: 7,
          is_active: true
        },
        {
          friend_id: friendResults[1].id,
          birth_date: '2024-07-22',
          birth_year: null, // No birth year
          reminder_days: 3,
          is_active: true
        }
      ])
      .execute();

    const input: GetCalendarDataInput = {
      year: 2024
    };

    const result = await getCalendarData(input);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBeInstanceOf(Date);
    expect(result[0].birthdays).toHaveLength(1);
    expect(result[0].birthdays[0].friend.name).toEqual('John Doe');
    expect(result[0].birthdays[0].birth_year).toEqual(1990);

    expect(result[1].birthdays[0].friend.name).toEqual('Jane Smith');
    expect(result[1].birthdays[0].birth_year).toBeNull();
  });

  it('should get calendar data for a specific month', async () => {
    // Create friend
    const friendResults = await db.insert(friendsTable)
      .values([friend1])
      .returning()
      .execute();

    // Create birthdays in different months
    await db.insert(birthdaysTable)
      .values([
        {
          friend_id: friendResults[0].id,
          birth_date: '2024-03-15',
          birth_year: 1990,
          reminder_days: 7,
          is_active: true
        },
        {
          friend_id: friendResults[0].id,
          birth_date: '2024-07-22',
          birth_year: 1985,
          reminder_days: 3,
          is_active: true
        }
      ])
      .execute();

    const input: GetCalendarDataInput = {
      year: 2024,
      month: 3
    };

    const result = await getCalendarData(input);

    expect(result).toHaveLength(1);
    expect(result[0].date.getMonth()).toEqual(2); // March is month 2 (0-indexed)
    expect(result[0].birthdays).toHaveLength(1);
    expect(result[0].birthdays[0].birth_year).toEqual(1990);
  });

  it('should only return active birthdays', async () => {
    // Create friend
    const friendResults = await db.insert(friendsTable)
      .values([friend1])
      .returning()
      .execute();

    // Create active and inactive birthdays
    await db.insert(birthdaysTable)
      .values([
        {
          friend_id: friendResults[0].id,
          birth_date: '2024-03-15',
          birth_year: 1990,
          reminder_days: 7,
          is_active: true
        },
        {
          friend_id: friendResults[0].id,
          birth_date: '2024-07-22',
          birth_year: 1985,
          reminder_days: 3,
          is_active: false
        }
      ])
      .execute();

    const input: GetCalendarDataInput = {
      year: 2024
    };

    const result = await getCalendarData(input);

    expect(result).toHaveLength(1);
    expect(result[0].birthdays[0].is_active).toBe(true);
  });

  it('should include birthdays with null birth year for any year', async () => {
    // Create friend
    const friendResults = await db.insert(friendsTable)
      .values([friend1])
      .returning()
      .execute();

    // Create birthday with null birth year
    await db.insert(birthdaysTable)
      .values([
        {
          friend_id: friendResults[0].id,
          birth_date: '1990-03-15', // Different year but null birth_year
          birth_year: null,
          reminder_days: 7,
          is_active: true
        }
      ])
      .execute();

    const input: GetCalendarDataInput = {
      year: 2024 // Searching for 2024 but birthday has null year
    };

    const result = await getCalendarData(input);

    expect(result).toHaveLength(1);
    expect(result[0].birthdays[0].birth_year).toBeNull();
    expect(result[0].birthdays[0].friend.name).toEqual('John Doe');
  });

  it('should sort calendar days by date', async () => {
    // Create friends
    const friendResults = await db.insert(friendsTable)
      .values([friend1, friend2])
      .returning()
      .execute();

    // Create birthdays in reverse chronological order
    await db.insert(birthdaysTable)
      .values([
        {
          friend_id: friendResults[0].id,
          birth_date: '2024-12-25',
          birth_year: 1990,
          reminder_days: 7,
          is_active: true
        },
        {
          friend_id: friendResults[1].id,
          birth_date: '2024-01-01',
          birth_year: 1985,
          reminder_days: 3,
          is_active: true
        }
      ])
      .execute();

    const input: GetCalendarDataInput = {
      year: 2024
    };

    const result = await getCalendarData(input);

    expect(result).toHaveLength(2);
    // Should be sorted by date (January before December)
    expect(result[0].date.getMonth()).toEqual(0); // January
    expect(result[1].date.getMonth()).toEqual(11); // December
  });

  it('should return empty array when no birthdays found', async () => {
    const input: GetCalendarDataInput = {
      year: 2024
    };

    const result = await getCalendarData(input);

    expect(result).toHaveLength(0);
  });
});
