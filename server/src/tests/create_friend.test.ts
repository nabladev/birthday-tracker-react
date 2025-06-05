
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { type CreateFriendInput } from '../schema';
import { createFriend } from '../handlers/create_friend';
import { eq } from 'drizzle-orm';

const testInput: CreateFriendInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  notes: 'Best friend from college'
};

describe('createFriend', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a friend with all fields', async () => {
    const result = await createFriend(testInput);

    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john@example.com');
    expect(result.phone).toEqual('+1234567890');
    expect(result.notes).toEqual('Best friend from college');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a friend with minimal fields', async () => {
    const minimalInput: CreateFriendInput = {
      name: 'Jane Smith'
    };

    const result = await createFriend(minimalInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save friend to database', async () => {
    const result = await createFriend(testInput);

    const friends = await db.select()
      .from(friendsTable)
      .where(eq(friendsTable.id, result.id))
      .execute();

    expect(friends).toHaveLength(1);
    expect(friends[0].name).toEqual('John Doe');
    expect(friends[0].email).toEqual('john@example.com');
    expect(friends[0].phone).toEqual('+1234567890');
    expect(friends[0].notes).toEqual('Best friend from college');
    expect(friends[0].created_at).toBeInstanceOf(Date);
    expect(friends[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields as null', async () => {
    const inputWithOptionalFields: CreateFriendInput = {
      name: 'Test Friend',
      email: undefined,
      phone: undefined,
      notes: undefined
    };

    const result = await createFriend(inputWithOptionalFields);

    expect(result.name).toEqual('Test Friend');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should create multiple friends successfully', async () => {
    const friend1 = await createFriend({ name: 'Friend 1' });
    const friend2 = await createFriend({ name: 'Friend 2' });

    expect(friend1.id).not.toEqual(friend2.id);
    expect(friend1.name).toEqual('Friend 1');
    expect(friend2.name).toEqual('Friend 2');

    const allFriends = await db.select()
      .from(friendsTable)
      .execute();

    expect(allFriends).toHaveLength(2);
  });
});
