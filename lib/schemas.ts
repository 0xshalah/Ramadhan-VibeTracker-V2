import { z } from 'zod';

// ═══════════════════════════════════════════════════════
// 1. Daily Progress Schema (Kontrak Data Ibadah Harian)
// ═══════════════════════════════════════════════════════
export const SholatSchema = z.object({
  subuh: z.boolean().default(false),
  dzuhur: z.boolean().default(false),
  ashar: z.boolean().default(false),
  maghrib: z.boolean().default(false),
  isya: z.boolean().default(false),
});

export const SunnahSchema = z.object({
  tarawih: z.boolean().default(false),
  sahur: z.boolean().default(false),
  sadaqah: z.boolean().default(false),
});

export const DailyProgressSchema = z.object({
  tilawah: z.number().nonnegative().default(0),
  targetTilawah: z.number().min(1).default(20),
  earnedXP: z.number().nonnegative().default(0),
  sholat: SholatSchema.default({}),
  sunnah: SunnahSchema.default({}),
});

export type DailyProgress = z.infer<typeof DailyProgressSchema>;
export type SholatState = z.infer<typeof SholatSchema>;
export type SunnahState = z.infer<typeof SunnahSchema>;

// ═══════════════════════════════════════════════════════
// 2. User Profile Schema
// ═══════════════════════════════════════════════════════
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().nullable().optional(),
  displayName: z.string().nullable().optional(),
  photoURL: z.string().nullable().optional(),
  role: z.enum(['student', 'teacher', 'parent', 'admin']).default('student'),
  targetTilawah: z.number().min(1).optional(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  classCode: z.string().optional(),
  managedClass: z.string().optional(),
  dailyXP: z.record(z.string(), z.number()).optional(),
  lastLogin: z.string().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ═══════════════════════════════════════════════════════
// 3. Notification Schema
// ═══════════════════════════════════════════════════════
export const NotificationSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  body: z.string().default(''),
  time: z.string().optional(),
});

export type AppNotification = z.infer<typeof NotificationSchema>;

// ═══════════════════════════════════════════════════════
// 4. API Insight Payload Schema
// ═══════════════════════════════════════════════════════
export const InsightPayloadSchema = z.object({
  sholatPct: z.number().min(0).max(100),
  tilawah: z.number().nonnegative(),
  targetTilawah: z.number().min(1),
  streak: z.number().nonnegative(),
  sunnahCount: z.number().min(0).max(5),
});

export type InsightPayload = z.infer<typeof InsightPayloadSchema>;
