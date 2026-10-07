import { pgTable, serial, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

// Users table (Firebase Auth & application users)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or internal unique identifier
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('employee'),
  department: text('department').default('General'),
  badgeNumber: text('badge_number'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Employees catalog table
export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  department: text('department').notNull(),
  email: text('email').notNull(),
  badgeNumber: text('badge_number').notNull(),
  currentlyOnSite: boolean('currently_on_site').default(false),
  lastSeen: text('last_seen'),
});

// Check-in and check-out visit records table
export const visits = pgTable('visits', {
  id: text('id').primaryKey(),
  badgeNumber: text('badge_number').notNull(),
  type: text('type').notNull(), // 'visitor' | 'employee' | 'contractor'
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  hostEmployee: text('host_employee'),
  department: text('department'),
  purpose: text('purpose').notNull(),
  location: text('location').notNull(),
  checkInTime: timestamp('check_in_time').notNull().defaultNow(),
  checkOutTime: timestamp('check_out_time'),
  status: text('status').notNull().default('active'), // 'active' | 'checked_out'
  durationMinutes: integer('duration_minutes'),
  ndaAgreed: boolean('nda_agreed').default(true),
  notes: text('notes'),
  assignedEquipment: text('assigned_equipment'), // JSON string array
  checkedInBy: text('checked_in_by'),
});

// Equipment & assets table
export const equipment = pgTable('equipment', {
  id: text('id').primaryKey(),
  assetTag: text('asset_tag').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'laptop' | 'testing' | 'access_card' | 'key' | 'av' | 'visitor_badge'
  status: text('status').notNull().default('available'), // 'available' | 'checked_out' | 'maintenance'
  checkedOutTo: text('checked_out_to'),
  checkedOutToBadge: text('checked_out_to_badge'),
  checkedOutAt: timestamp('checked_out_at'),
  expectedReturn: text('expected_return'),
  condition: text('condition').notNull().default('Good'),
});
