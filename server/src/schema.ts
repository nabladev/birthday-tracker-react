
import { z } from 'zod';

// Friend schema
export const friendSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Friend = z.infer<typeof friendSchema>;

// Birthday schema
export const birthdaySchema = z.object({
  id: z.number(),
  friend_id: z.number(),
  birth_date: z.coerce.date(),
  birth_year: z.number().nullable(), // Some people don't want to share their birth year
  reminder_days: z.number().int().nonnegative().default(7), // Days before birthday to remind
  is_active: z.boolean().default(true),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Birthday = z.infer<typeof birthdaySchema>;

// Birthday with friend details for display
export const birthdayWithFriendSchema = z.object({
  id: z.number(),
  friend_id: z.number(),
  birth_date: z.coerce.date(),
  birth_year: z.number().nullable(),
  reminder_days: z.number().int().nonnegative(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  friend: friendSchema
});

export type BirthdayWithFriend = z.infer<typeof birthdayWithFriendSchema>;

// Input schemas for creating friends
export const createFriendInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateFriendInput = z.infer<typeof createFriendInputSchema>;

// Input schemas for updating friends
export const updateFriendInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateFriendInput = z.infer<typeof updateFriendInputSchema>;

// Input schemas for creating birthdays
export const createBirthdayInputSchema = z.object({
  friend_id: z.number(),
  birth_date: z.coerce.date(),
  birth_year: z.number().nullable().optional(),
  reminder_days: z.number().int().nonnegative().default(7),
  is_active: z.boolean().default(true)
});

export type CreateBirthdayInput = z.infer<typeof createBirthdayInputSchema>;

// Input schemas for updating birthdays
export const updateBirthdayInputSchema = z.object({
  id: z.number(),
  friend_id: z.number().optional(),
  birth_date: z.coerce.date().optional(),
  birth_year: z.number().nullable().optional(),
  reminder_days: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional()
});

export type UpdateBirthdayInput = z.infer<typeof updateBirthdayInputSchema>;

// Calendar query input
export const getCalendarDataInputSchema = z.object({
  year: z.number().int(),
  month: z.number().int().min(1).max(12).optional() // If provided, get specific month, otherwise get whole year
});

export type GetCalendarDataInput = z.infer<typeof getCalendarDataInputSchema>;

// Calendar day data
export const calendarDaySchema = z.object({
  date: z.coerce.date(),
  birthdays: z.array(birthdayWithFriendSchema)
});

export type CalendarDay = z.infer<typeof calendarDaySchema>;

// Delete input schema
export const deleteByIdInputSchema = z.object({
  id: z.number()
});

export type DeleteByIdInput = z.infer<typeof deleteByIdInputSchema>;
