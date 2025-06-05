
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { friendsTable } from '../db/schema';
import { getFriends } from '../handlers/get_friends';

describe('getFriends', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no friends exist', async () => {
    const result = await getFriends();
    expect(result).toEqual([]);
  });

  it('should return all friends', async () => {
    // Create test friends
    await db.insert(friendsTable)
      .values([
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
          notes: 'Good friend from work'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: null,
          notes: null
        },
        {
          name: 'Bob Wilson',
          email: null,
          phone: '987-654-3210',
          notes: 'College buddy'
        }
      ])
      .execute();

    const result = await getFriends();

    expect(result).toHaveLength(3);
    
    // Verify first friend
    const john = result.find(f => f.name === 'John Doe');
    expect(john).toBeDefined();
    expect(john?.email).toBe('john@example.com');
    expect(john?.phone).toBe('123-456-7890');
    expect(john?.notes).toBe('Good friend from work');
    expect(john?.id).toBeDefined();
    expect(john?.created_at).toBeInstanceOf(Date);
    expect(john?.updated_at).toBeInstanceOf(Date);

    // Verify second friend
    const jane = result.find(f => f.name === 'Jane Smith');
    expect(jane).toBeDefined();
    expect(jane?.email).toBe('jane@example.com');
    expect(jane?.phone).toBeNull();
    expect(jane?.notes).toBeNull();

    // Verify third friend
    const bob = result.find(f => f.name === 'Bob Wilson');
    expect(bob).toBeDefined();
    expect(bob?.email).toBeNull();
    expect(bob?.phone).toBe('987-654-3210');
    expect(bob?.notes).toBe('College buddy');
  });

  it('should return friends in database order', async () => {
    // Create friends in specific order
    const friend1 = await db.insert(friendsTable)
      .values({ name: 'First Friend' })
      .returning()
      .execute();

    const friend2 = await db.insert(friendsTable)
      .values({ name: 'Second Friend' })
      .returning()
      .execute();

    const result = await getFriends();

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(friend1[0].id);
    expect(result[1].id).toBe(friend2[0].id);
    expect(result[0].name).toBe('First Friend');
    expect(result[1].name).toBe('Second Friend');
  });
});
