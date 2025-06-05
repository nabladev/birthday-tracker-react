
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { birthdaysTable, friendsTable } from '../db/schema';
import { type CreateBirthdayInput } from '../schema';
import { createBirthday } from '../handlers/create_birthday';
import { eq } from 'drizzle-orm';

describe('createBirthday', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testFriendId: number;

  beforeEach(async () => {
    // Create a test friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Test Friend',
        email: 'test@example.com',
        phone: '123-456-7890',
        notes: 'Test notes'
      })
      .returning()
      .execute();

    testFriendId = friendResult[0].id;
  });

  it('should create a birthday with all fields', async () => {
    const testInput: CreateBirthdayInput = {
      friend_id: testFriendId,
      birth_date: new Date('1990-05-15'),
      birth_year: 1990,
      reminder_days: 5,
      is_active: true
    };

    const result = await createBirthday(testInput);

    // Validate birthday fields
    expect(result.friend_id).toEqual(testFriendId);
    expect(result.birth_date).toEqual(new Date('1990-05-15'));
    expect(result.birth_year).toEqual(1990);
    expect(result.reminder_days).toEqual(5);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Validate friend details are included
    expect(result.friend).toBeDefined();
    expect(result.friend.id).toEqual(testFriendId);
    expect(result.friend.name).toEqual('Test Friend');
    expect(result.friend.email).toEqual('test@example.com');
  });

  it('should create a birthday with defaults applied', async () => {
    const testInput: CreateBirthdayInput = {
      friend_id: testFriendId,
      birth_date: new Date('1985-12-25'),
      birth_year: null,
      reminder_days: 7, // Default value
      is_active: true   // Default value
    };

    const result = await createBirthday(testInput);

    expect(result.friend_id).toEqual(testFriendId);
    expect(result.birth_date).toEqual(new Date('1985-12-25'));
    expect(result.birth_year).toBeNull();
    expect(result.reminder_days).toEqual(7);
    expect(result.is_active).toEqual(true);
  });

  it('should save birthday to database', async () => {
    const testInput: CreateBirthdayInput = {
      friend_id: testFriendId,
      birth_date: new Date('1992-03-10'),
      birth_year: 1992,
      reminder_days: 3,
      is_active: false
    };

    const result = await createBirthday(testInput);

    // Query database to verify record was saved
    const birthdays = await db.select()
      .from(birthdaysTable)
      .where(eq(birthdaysTable.id, result.id))
      .execute();

    expect(birthdays).toHaveLength(1);
    expect(birthdays[0].friend_id).toEqual(testFriendId);
    expect(new Date(birthdays[0].birth_date)).toEqual(new Date('1992-03-10')); // Convert string to Date for comparison
    expect(birthdays[0].birth_year).toEqual(1992);
    expect(birthdays[0].reminder_days).toEqual(3);
    expect(birthdays[0].is_active).toEqual(false);
  });

  it('should throw error when friend does not exist', async () => {
    const testInput: CreateBirthdayInput = {
      friend_id: 99999, // Non-existent friend ID
      birth_date: new Date('1990-01-01'),
      birth_year: 1990,
      reminder_days: 7,
      is_active: true
    };

    await expect(createBirthday(testInput)).rejects.toThrow(/friend with id 99999 not found/i);
  });

  it('should handle birthday without birth year', async () => {
    const testInput: CreateBirthdayInput = {
      friend_id: testFriendId,
      birth_date: new Date('2000-08-20'),
      birth_year: null,
      reminder_days: 14,
      is_active: true
    };

    const result = await createBirthday(testInput);

    expect(result.birth_year).toBeNull();
    expect(result.birth_date).toEqual(new Date('2000-08-20'));
    expect(result.reminder_days).toEqual(14);
  });
});
