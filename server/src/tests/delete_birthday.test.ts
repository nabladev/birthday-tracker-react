
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, birthdaysTable } from '../db/schema';
import { type DeleteByIdInput } from '../schema';
import { deleteBirthday } from '../handlers/delete_birthday';
import { eq } from 'drizzle-orm';

// Test input
const testInput: DeleteByIdInput = {
  id: 1
};

describe('deleteBirthday', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing birthday', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Test Friend',
        email: 'test@example.com',
        phone: '123-456-7890',
        notes: 'Test notes'
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create a birthday
    const birthdayResult = await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '1990-06-15',
        birth_year: 1990,
        reminder_days: 7,
        is_active: true
      })
      .returning()
      .execute();

    const birthdayId = birthdayResult[0].id;

    // Delete the birthday
    const result = await deleteBirthday({ id: birthdayId });

    expect(result.success).toBe(true);

    // Verify the birthday was deleted
    const birthdays = await db.select()
      .from(birthdaysTable)
      .where(eq(birthdaysTable.id, birthdayId))
      .execute();

    expect(birthdays).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent birthday', async () => {
    const result = await deleteBirthday({ id: 999 });

    expect(result.success).toBe(false);
  });

  it('should not affect other birthdays when deleting one', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: 'Test Friend',
        email: 'test@example.com',
        phone: '123-456-7890',
        notes: 'Test notes'
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create two birthdays
    const birthdayResults = await db.insert(birthdaysTable)
      .values([
        {
          friend_id: friendId,
          birth_date: '1990-06-15',
          birth_year: 1990,
          reminder_days: 7,
          is_active: true
        },
        {
          friend_id: friendId,
          birth_date: '1985-12-25',
          birth_year: 1985,
          reminder_days: 5,
          is_active: true
        }
      ])
      .returning()
      .execute();

    const firstBirthdayId = birthdayResults[0].id;
    const secondBirthdayId = birthdayResults[1].id;

    // Delete the first birthday
    const result = await deleteBirthday({ id: firstBirthdayId });

    expect(result.success).toBe(true);

    // Verify only the first birthday was deleted
    const remainingBirthdays = await db.select()
      .from(birthdaysTable)
      .execute();

    expect(remainingBirthdays).toHaveLength(1);
    expect(remainingBirthdays[0].id).toEqual(secondBirthdayId);
    expect(remainingBirthdays[0].birth_date).toEqual('1985-12-25');
  });
});
