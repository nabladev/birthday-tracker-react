
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable, birthdaysTable } from '../db/schema';
import { type DeleteByIdInput, type CreateFriendInput } from '../schema';
import { deleteFriend } from '../handlers/delete_friend';
import { eq } from 'drizzle-orm';

// Test input for creating a friend
const testFriendInput: CreateFriendInput = {
  name: 'Test Friend',
  email: 'test@example.com',
  phone: '123-456-7890',
  notes: 'Test notes'
};

describe('deleteFriend', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing friend', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: testFriendInput.name,
        email: testFriendInput.email,
        phone: testFriendInput.phone,
        notes: testFriendInput.notes
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;
    const deleteInput: DeleteByIdInput = { id: friendId };

    // Delete the friend
    const result = await deleteFriend(deleteInput);

    expect(result.success).toBe(true);

    // Verify friend was deleted
    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, friendId))
      .execute();

    expect(friends).toHaveLength(0);
  });

  it('should return false when deleting non-existent friend', async () => {
    const deleteInput: DeleteByIdInput = { id: 999 };

    const result = await deleteFriend(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should cascade delete related birthdays when friend is deleted', async () => {
    // Create a friend first
    const friendResult = await db.insert(friendsTable)
      .values({
        name: testFriendInput.name,
        email: testFriendInput.email,
        phone: testFriendInput.phone,
        notes: testFriendInput.notes
      })
      .returning()
      .execute();

    const friendId = friendResult[0].id;

    // Create a birthday for the friend - date column expects string format
    await db.insert(birthdaysTable)
      .values({
        friend_id: friendId,
        birth_date: '1990-05-15', // Date column expects string format
        birth_year: 1990,
        reminder_days: 7,
        is_active: true
      })
      .execute();

    // Verify birthday exists
    const birthdaysBefore = await db.select()
      .from(birthdaysTable)
      .where(eq(birthdaysTable.friend_id, friendId))
      .execute();

    expect(birthdaysBefore).toHaveLength(1);

    // Delete the friend
    const deleteInput: DeleteByIdInput = { id: friendId };
    const result = await deleteFriend(deleteInput);

    expect(result.success).toBe(true);

    // Verify friend was deleted
    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, friendId))
      .execute();

    expect(friends).toHaveLength(0);

    // Verify birthday was cascade deleted
    const birthdaysAfter = await db.select()
      .from(birthdaysTable)
      .where(eq(birthdaysTable.friend_id, friendId))
      .execute();

    expect(birthdaysAfter).toHaveLength(0);
  });
});
