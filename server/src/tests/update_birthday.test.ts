
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, birthdaysTable } from '../db/schema';
import { type UpdateBirthdayInput, type CreateFriendInput } from '../schema';
import { updateBirthday } from '../handlers/update_birthday';
import { eq } from 'drizzle-orm';

// Test helper to create a friend
const createTestFriend = async (friendData: CreateFriendInput = { name: 'Test Friend' }) => {
  const result = await db.insert(friendsTable)
    .values({
      name: friendData.name,
      email: friendData.email || null,
      phone: friendData.phone || null,
      notes: friendData.notes || null
    })
    .returning()
    .execute();
  return result[0];
};

// Test helper to create a birthday
const createTestBirthday = async (friendId: number) => {
  const result = await db.insert(birthdaysTable)
    .values({
      friend_id: friendId,
      birth_date: '1990-05-15', // Use string format for date column
      birth_year: 1990,
      reminder_days: 7,
      is_active: true
    })
    .returning()
    .execute();
  return result[0];
};

describe('updateBirthday', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update birthday fields', async () => {
    // Create friend and birthday
    const friend = await createTestFriend();
    const birthday = await createTestBirthday(friend.id);

    const updateInput: UpdateBirthdayInput = {
      id: birthday.id,
      birth_date: new Date('1990-06-20'),
      birth_year: 1991,
      reminder_days: 14,
      is_active: false
    };

    const result = await updateBirthday(updateInput);

    // Verify updated fields
    expect(result.id).toEqual(birthday.id);
    expect(result.birth_date).toEqual(new Date('1990-06-20'));
    expect(result.birth_year).toEqual(1991);
    expect(result.reminder_days).toEqual(14);
    expect(result.is_active).toEqual(false);
    expect(result.friend_id).toEqual(friend.id);

    // Verify friend data is included
    expect(result.friend.id).toEqual(friend.id);
    expect(result.friend.name).toEqual('Test Friend');
  });

  it('should update only provided fields', async () => {
    // Create friend and birthday
    const friend = await createTestFriend();
    const birthday = await createTestBirthday(friend.id);

    const updateInput: UpdateBirthdayInput = {
      id: birthday.id,
      reminder_days: 3
    };

    const result = await updateBirthday(updateInput);

    // Verify only reminder_days was updated
    expect(result.reminder_days).toEqual(3);
    expect(result.birth_date).toEqual(new Date('1990-05-15')); // Original value
    expect(result.birth_year).toEqual(1990); // Original value
    expect(result.is_active).toEqual(true); // Original value
  });

  it('should update friend_id when provided', async () => {
    // Create two friends and birthday
    const friend1 = await createTestFriend({ name: 'Friend 1' });
    const friend2 = await createTestFriend({ name: 'Friend 2' });
    const birthday = await createTestBirthday(friend1.id);

    const updateInput: UpdateBirthdayInput = {
      id: birthday.id,
      friend_id: friend2.id
    };

    const result = await updateBirthday(updateInput);

    // Verify friend_id was updated and friend data reflects new friend
    expect(result.friend_id).toEqual(friend2.id);
    expect(result.friend.id).toEqual(friend2.id);
    expect(result.friend.name).toEqual('Friend 2');
  });

  it('should persist changes to database', async () => {
    // Create friend and birthday
    const friend = await createTestFriend();
    const birthday = await createTestBirthday(friend.id);

    const updateInput: UpdateBirthdayInput = {
      id: birthday.id,
      birth_date: new Date('1990-12-25'),
      reminder_days: 30
    };

    await updateBirthday(updateInput);

    // Verify changes are persisted in database
    const savedBirthdays = await db.select()
      .from(birthdaysTable)
      .where(eq(birthdaysTable.id, birthday.id))
      .execute();

    expect(savedBirthdays).toHaveLength(1);
    expect(savedBirthdays[0].birth_date).toEqual('1990-12-25'); // Database stores as string
    expect(savedBirthdays[0].reminder_days).toEqual(30);
  });

  it('should throw error for nonexistent birthday', async () => {
    const updateInput: UpdateBirthdayInput = {
      id: 999999,
      reminder_days: 5
    };

    await expect(updateBirthday(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update birth_year to null', async () => {
    // Create friend and birthday
    const friend = await createTestFriend();
    const birthday = await createTestBirthday(friend.id);

    const updateInput: UpdateBirthdayInput = {
      id: birthday.id,
      birth_year: null
    };

    const result = await updateBirthday(updateInput);

    // Verify birth_year was set to null
    expect(result.birth_year).toBeNull();
  });
});
