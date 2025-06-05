
import { serial, text, pgTable, timestamp, integer, boolean, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const friendsTable = pgTable('friends', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'), // Nullable by default
  phone: text('phone'), // Nullable by default
  notes: text('notes'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const birthdaysTable = pgTable('birthdays', {
  id: serial('id').primaryKey(),
  friend_id: integer('friend_id').notNull().references(() => friendsTable.id, { onDelete: 'cascade' }),
  birth_date: date('birth_date').notNull(), // Store as date for day/month queries
  birth_year: integer('birth_year'), // Nullable - some people don't want to share year
  reminder_days: integer('reminder_days').notNull().default(7), // Days before birthday to remind
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const friendsRelations = relations(friendsTable, ({ many }) => ({
  birthdays: many(birthdaysTable),
}));

export const birthdaysRelations = relations(birthdaysTable, ({ one }) => ({
  friend: one(friendsTable, {
    fields: [birthdaysTable.friend_id],
    references: [friendsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Friend = typeof friendsTable.$inferSelect;
export type NewFriend = typeof friendsTable.$inferInsert;
export type Birthday = typeof birthdaysTable.$inferSelect;
export type NewBirthday = typeof birthdaysTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  friends: friendsTable, 
  birthdays: birthdaysTable 
};
