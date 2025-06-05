
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, birthdaysTable } from '../db/schema';
import { getBirthdays } from '../handlers/get_birthdays';

describe('getBirthdays', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no birthdays exist', async () => {
    const result = await getBirthdays();
    expect(result).toEqual([]);
  });

  it('should return birthdays with friend details', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        notes: 'Best friend'
      })
      .returning()
      .execute();

    const friend = friendResult[0];

    // Create a birthday for the friend
    const birthdayResult = await db.insert(birthdaysTable)
      .values({
        friend_id: friend.id,
        birth_date: '1990-05-15',
        birth_year: 1990,
        reminder_days: 7,
        is_active: true
      })
      .returning()
      .execute();

    const birthday = birthdayResult[0];

    // Get birthdays
    const result = await getBirthdays();

    expect(result).toHaveLength(1);
    const birthdayWithFriend = result[0];

    // Verify birthday fields
    expect(birthdayWithFriend.id).toEqual(birthday.id);
    expect(birthdayWithFriend.friend_id).toEqual(friend.id);
    expect(birthdayWithFriend.birth_date).toBeInstanceOf(Date);
    expect(birthdayWithFriend.birth_date.getFullYear()).toEqual(1990);
    expect(birthdayWithFriend.birth_date.getMonth()).toEqual(4); // May is month 4 (0-indexed)
    expect(birthdayWithFriend.birth_date.getDate()).toEqual(15);
    expect(birthdayWithFriend.birth_year).toEqual(1990);
    expect(birthdayWithFriend.reminder_days).toEqual(7);
    expect(birthdayWithFriend.is_active).toEqual(true);
    expect(birthdayWithFriend.created_at).toBeInstanceOf(Date);
    expect(birthdayWithFriend.updated_at).toBeInstanceOf(Date);

    // Verify friend fields
    expect(birthdayWithFriend.friend.id).toEqual(friend.id);
    expect(birthdayWithFriend.friend.name).toEqual('John Doe');
    expect(birthdayWithFriend.friend.email).toEqual('john@example.com');
    expect(birthdayWithFriend.friend.phone).toEqual('123-456-7890');
    expect(birthdayWithFriend.friend.notes).toEqual('Best friend');
    expect(birthdayWithFriend.friend.created_at).toBeInstanceOf(Date);
    expect(birthdayWithFriend.friend.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple birthdays with their friends', async () => {
    // Create multiple friends
    const friend1Result = await db.insert(friendsTable)
      .values({
        name: 'Alice Smith',
        email: 'alice@example.com'
      })
      .returning()
      .execute();

    const friend2Result = await db.insert(friendsTable)
      .values({
        name: 'Bob Johnson',
        phone: '987-654-3210'
      })
      .returning()
      .execute();

    const friend1 = friend1Result[0];
    const friend2 = friend2Result[0];

    // Create birthdays for both friends
    await db.insert(birthdaysTable)
      .values([
        {
          friend_id: friend1.id,
          birth_date: '1985-03-20',
          birth_year: 1985,
          reminder_days: 5,
          is_active: true
        },
        {
          friend_id: friend2.id,
          birth_date: '1992-12-10',
          birth_year: null, // No birth year provided
          reminder_days: 10,
          is_active: false
        }
      ])
      .execute();

    // Get all birthdays
    const result = await getBirthdays();

    expect(result).toHaveLength(2);

    // Find birthdays by friend name for verification
    const aliceBirthday = result.find(b => b.friend.name === 'Alice Smith');
    const bobBirthday = result.find(b => b.friend.name === 'Bob Johnson');

    expect(aliceBirthday).toBeDefined();
    expect(aliceBirthday!.birth_date).toBeInstanceOf(Date);
    expect(aliceBirthday!.birth_date.getMonth()).toEqual(2); // March is month 2 (0-indexed)
    expect(aliceBirthday!.birth_date.getDate()).toEqual(20);
    expect(aliceBirthday!.birth_year).toEqual(1985);
    expect(aliceBirthday!.reminder_days).toEqual(5);
    expect(aliceBirthday!.is_active).toEqual(true);
    expect(aliceBirthday!.friend.email).toEqual('alice@example.com');

    expect(bobBirthday).toBeDefined();
    expect(bobBirthday!.birth_date).toBeInstanceOf(Date);
    expect(bobBirthday!.birth_date.getMonth()).toEqual(11); // December is month 11 (0-indexed)
    expect(bobBirthday!.birth_date.getDate()).toEqual(10);
    expect(bobBirthday!.birth_year).toBeNull();
    expect(bobBirthday!.reminder_days).toEqual(10);
    expect(bobBirthday!.is_active).toEqual(false);
    expect(bobBirthday!.friend.phone).toEqual('987-654-3210');
  });

  it('should handle friends with minimal data', async () => {
    // Create friend with only required fields
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Minimal Friend'
        // email, phone, notes are null/undefined
      })
      .returning()
      .execute();

    const friend = friendResult[0];

    // Create birthday with default values
    await db.insert(birthdaysTable)
      .values({
        friend_id: friend.id,
        birth_date: '2000-01-01'
        // Other fields will use defaults
      })
      .execute();

    const result = await getBirthdays();

    expect(result).toHaveLength(1);
    const birthdayWithFriend = result[0];

    expect(birthdayWithFriend.birth_date).toBeInstanceOf(Date);
    expect(birthdayWithFriend.birth_date.getFullYear()).toEqual(2000);
    expect(birthdayWithFriend.birth_date.getMonth()).toEqual(0); // January is month 0
    expect(birthdayWithFriend.birth_date.getDate()).toEqual(1);
    expect(birthdayWithFriend.friend.name).toEqual('Minimal Friend');
    expect(birthdayWithFriend.friend.email).toBeNull();
    expect(birthdayWithFriend.friend.phone).toBeNull();
    expect(birthdayWithFriend.friend.notes).toBeNull();
    expect(birthdayWithFriend.reminder_days).toEqual(7); // Default value
    expect(birthdayWithFriend.is_active).toEqual(true); // Default value
  });
});
