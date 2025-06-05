
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type CreateFriendInput, type UpdateFriendInput } from '../schema';
import { updateFriend } from '../handlers/update_friend';
import { eq } from 'drizzle-orm';

// Test data
const testFriend: CreateFriendInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  notes: 'Old friend from college'
};

describe('updateFriend', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update friend name', async () => {
    // Create initial friend
    const created = await db.insert(friendsTable)
      .values(testFriend)
      .returning()
      .execute();
    
    const friendId = created[0].id;
    
    const updateInput: UpdateFriendInput = {
      id: friendId,
      name: 'Jane Doe'
    };

    const result = await updateFriend(updateInput);

    expect(result.id).toEqual(friendId);
    expect(result.name).toEqual('Jane Doe');
    expect(result.email).toEqual('john@example.com'); // Unchanged
    expect(result.phone).toEqual('555-1234'); // Unchanged
    expect(result.notes).toEqual('Old friend from college'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields', async () => {
    // Create initial friend
    const created = await db.insert(friendsTable)
      .values(testFriend)
      .returning()
      .execute();
    
    const friendId = created[0].id;
    
    const updateInput: UpdateFriendInput = {
      id: friendId,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '555-9999'
    };

    const result = await updateFriend(updateInput);

    expect(result.id).toEqual(friendId);
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane@example.com');
    expect(result.phone).toEqual('555-9999');
    expect(result.notes).toEqual('Old friend from college'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null', async () => {
    // Create initial friend
    const created = await db.insert(friendsTable)
      .values(testFriend)
      .returning()
      .execute();
    
    const friendId = created[0].id;
    
    const updateInput: UpdateFriendInput = {
      id: friendId,
      email: null,
      phone: null,
      notes: null
    };

    const result = await updateFriend(updateInput);

    expect(result.id).toEqual(friendId);
    expect(result.name).toEqual('John Doe'); // Unchanged
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create initial friend
    const created = await db.insert(friendsTable)
      .values(testFriend)
      .returning()
      .execute();
    
    const friendId = created[0].id;
    
    const updateInput: UpdateFriendInput = {
      id: friendId,
      name: 'Updated Name',
      email: 'updated@example.com'
    };

    await updateFriend(updateInput);

    // Verify changes were saved
    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, friendId))
      .execute();

    expect(friends).toHaveLength(1);
    expect(friends[0].name).toEqual('Updated Name');
    expect(friends[0].email).toEqual('updated@example.com');
    expect(friends[0].phone).toEqual('555-1234'); // Unchanged
    expect(friends[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when friend not found', async () => {
    const updateInput: UpdateFriendInput = {
      id: 99999,
      name: 'Non-existent Friend'
    };

    await expect(updateFriend(updateInput)).rejects.toThrow(/Friend with id 99999 not found/i);
  });

  it('should update only provided fields', async () => {
    // Create initial friend
    const created = await db.insert(friendsTable)
      .values(testFriend)
      .returning()
      .execute();
    
    const friendId = created[0].id;
    const originalUpdatedAt = created[0].updated_at;
    
    // Update only the name
    const updateInput: UpdateFriendInput = {
      id: friendId,
      name: 'Only Name Changed'
    };

    const result = await updateFriend(updateInput);

    expect(result.name).toEqual('Only Name Changed');
    expect(result.email).toEqual('john@example.com'); // Unchanged
    expect(result.phone).toEqual('555-1234'); // Unchanged
    expect(result.notes).toEqual('Old friend from college'); // Unchanged
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
