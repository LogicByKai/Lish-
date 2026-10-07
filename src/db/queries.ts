import { db } from './index.ts';
import { users, employees, visits, equipment } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

// Seed database with Lish AI Labs dockets and staff
export async function seedDatabaseIfEmpty() {
  try {
    const existingEmployees = await db.select().from(employees).limit(1);
    if (existingEmployees.length === 0) {
      await db.insert(employees).values([
        { id: 'emp-1', name: 'Kaelen Omondi', role: 'Lead ML Engineer', department: 'Technical Department', email: 'kaelen@lishailabs.ai', badgeNumber: 'LISH-TECH-101', currentlyOnSite: true, lastSeen: 'Today, 08:30 AM' },
        { id: 'emp-2', name: 'Amina Wambui', role: 'Annotation Team Lead', department: 'Annotation Department', email: 'amina@lishailabs.ai', badgeNumber: 'LISH-ANNT-201', currentlyOnSite: true, lastSeen: 'Today, 08:45 AM' },
        { id: 'emp-3', name: 'Brian Kiprop', role: 'Computer Vision Scientist', department: 'Technical Department', email: 'brian@lishailabs.ai', badgeNumber: 'LISH-TECH-102', currentlyOnSite: true, lastSeen: 'Today, 09:00 AM' },
        { id: 'emp-4', name: 'Faith Nduta', role: 'People & Culture Lead', department: 'HR Department', email: 'faith@lishailabs.ai', badgeNumber: 'LISH-HR-301', currentlyOnSite: true, lastSeen: 'Today, 09:15 AM' },
        { id: 'emp-5', name: 'Samuel Otieno', role: 'AI Annotation Specialist', department: 'Annotation Department', email: 'samuel@lishailabs.ai', badgeNumber: 'LISH-ANNT-202', currentlyOnSite: false, lastSeen: 'Yesterday, 05:30 PM' },
        { id: 'emp-6', name: 'Grace Muthoni', role: 'NLP Research Intern', department: 'Interns / Attachees', email: 'grace.intern@lishailabs.ai', badgeNumber: 'LISH-INT-401', currentlyOnSite: true, lastSeen: 'Today, 09:30 AM' },
        { id: 'emp-7', name: 'Kevin Cheruiyot', role: 'Data Quality Attachee', department: 'Interns / Attachees', email: 'kevin.attachee@lishailabs.ai', badgeNumber: 'LISH-INT-402', currentlyOnSite: false, lastSeen: 'Yesterday, 04:45 PM' },
      ]);
    }

    const existingEquipment = await db.select().from(equipment).limit(1);
    if (existingEquipment.length === 0) {
      await db.insert(equipment).values([
        { id: 'eq-1', assetTag: 'LISH-GPU-01', name: 'NVIDIA RTX 4090 Mobile Workstation', category: 'laptop', status: 'available', condition: 'Excellent' },
        { id: 'eq-2', assetTag: 'LISH-TAB-04', name: 'iPad Pro 12.9" (Dataset Annotation Pen Kit)', category: 'testing', status: 'checked_out', checkedOutTo: 'Amina Wambui', checkedOutToBadge: 'LISH-ANNT-201', checkedOutAt: new Date(Date.now() - 3 * 3600000), expectedReturn: '5:00 PM Today', condition: 'Good' },
        { id: 'eq-3', assetTag: 'LISH-KEY-A1', name: 'AI Server Cluster Access Keycard', category: 'access_card', status: 'checked_out', checkedOutTo: 'Kaelen Omondi', checkedOutToBadge: 'LISH-TECH-101', checkedOutAt: new Date(Date.now() - 2 * 3600000), expectedReturn: '6:00 PM Today', condition: 'Active' },
        { id: 'eq-4', assetTag: 'LISH-CAM-02', name: 'Intel RealSense 435i Depth Sensor Kit', category: 'testing', status: 'available', condition: 'Calibrated' },
        { id: 'eq-5', assetTag: 'LISH-BDG-01', name: 'Security Escort Smart Badge #01', category: 'visitor_badge', status: 'available', condition: 'Good' },
      ]);
    }

    const existingVisits = await db.select().from(visits).limit(1);
    if (existingVisits.length === 0) {
      await db.insert(visits).values([
        {
          id: 'vis-1',
          badgeNumber: 'LISH-TECH-101',
          type: 'employee',
          name: 'Kaelen Omondi',
          email: 'kaelen@lishailabs.ai',
          hostEmployee: 'Self',
          department: 'Technical Department',
          purpose: 'Model Training & GPU Cluster Optimization',
          location: 'Lab 1 - Compute Cluster',
          checkInTime: new Date(Date.now() - 180 * 60000),
          status: 'active',
          ndaAgreed: true,
          notes: 'Geofence verified (14m from desk)',
        },
        {
          id: 'vis-2',
          badgeNumber: 'LISH-ANNT-201',
          type: 'employee',
          name: 'Amina Wambui',
          email: 'amina@lishailabs.ai',
          hostEmployee: 'Self',
          department: 'Annotation Department',
          purpose: 'Medical Imaging Segmentation Review',
          location: 'Lab 2 - Data Hub',
          checkInTime: new Date(Date.now() - 150 * 60000),
          status: 'active',
          ndaAgreed: true,
          notes: 'Geofence verified (22m from desk)',
        },
        {
          id: 'vis-3',
          badgeNumber: 'LISH-INT-401',
          type: 'employee',
          name: 'Grace Muthoni',
          email: 'grace.intern@lishailabs.ai',
          hostEmployee: 'Brian Kiprop',
          department: 'Interns / Attachees',
          purpose: 'Transformer Tokenizer Benchmark Testing',
          location: 'Open Workspace Station 4',
          checkInTime: new Date(Date.now() - 120 * 60000),
          status: 'active',
          ndaAgreed: true,
          notes: 'Geofence verified (35m from desk)',
        },
        {
          id: 'vis-4',
          badgeNumber: 'LISH-VIS-501',
          type: 'visitor',
          name: 'Dr. Derrick Oduor',
          email: 'd.oduor@stanford.edu',
          phone: '+254 712 345 678',
          company: 'Stanford AI Institute',
          hostEmployee: 'Kaelen Omondi',
          department: 'Technical Department',
          purpose: 'Guest Research Lecture & Collaboration',
          location: 'Conference Room Alpha',
          checkInTime: new Date(Date.now() - 90 * 60000),
          status: 'active',
          ndaAgreed: true,
          notes: 'Scanned Security Desk QR · Geofence verified (8m)',
        },
        {
          id: 'vis-5',
          badgeNumber: 'LISH-HR-301',
          type: 'employee',
          name: 'Faith Nduta',
          email: 'faith@lishailabs.ai',
          hostEmployee: 'Self',
          department: 'HR Department',
          purpose: 'New Attachee Onboarding & Docket Badging',
          location: 'HR Suite 2B',
          checkInTime: new Date(Date.now() - 75 * 60000),
          status: 'active',
          ndaAgreed: true,
          notes: 'Geofence verified (19m from desk)',
        },
      ]);
    }
  } catch (error) {
    console.error('Database seed error:', error);
  }
}

// User Queries
export async function getOrCreateUser(uid: string, email: string, name?: string, role?: string, department?: string, badgeNumber?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        role: role || 'employee',
        department: department || 'Technical Department',
        badgeNumber: badgeNumber || `LISH-TECH-${Math.floor(100 + Math.random() * 900)}`,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// Visit Queries
export async function getVisits(status?: string, type?: string, query?: string) {
  try {
    let results = await db.select().from(visits).orderBy(desc(visits.checkInTime));
    if (status && status !== 'all') {
      results = results.filter(v => v.status === status);
    }
    if (type && type !== 'all') {
      results = results.filter(v => v.type === type);
    }
    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      results = results.filter(v =>
        v.name.toLowerCase().includes(q) ||
        v.badgeNumber.toLowerCase().includes(q) ||
        (v.company && v.company.toLowerCase().includes(q)) ||
        (v.hostEmployee && v.hostEmployee.toLowerCase().includes(q)) ||
        (v.department && v.department.toLowerCase().includes(q)) ||
        (v.location && v.location.toLowerCase().includes(q))
      );
    }
    return results;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertVisit(newVisit: typeof visits.$inferInsert) {
  try {
    const res = await db.insert(visits).values(newVisit).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function updateVisitCheckOut(id: string, durationMinutes: number) {
  try {
    const now = new Date();
    const res = await db.update(visits)
      .set({
        status: 'checked_out',
        checkOutTime: now,
        durationMinutes,
      })
      .where(eq(visits.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function findActiveVisitByBadgeOrId(id?: string, badgeNumber?: string) {
  try {
    const all = await db.select().from(visits).where(eq(visits.status, 'active'));
    if (id) {
      const match = all.find(v => v.id === id);
      if (match) return match;
    }
    if (badgeNumber) {
      const match = all.find(v => v.badgeNumber.toLowerCase() === badgeNumber.toLowerCase());
      if (match) return match;
    }
    return null;
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// Employees Queries
export async function getEmployees() {
  try {
    return await db.select().from(employees);
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertEmployee(emp: typeof employees.$inferInsert) {
  try {
    const res = await db.insert(employees).values(emp).returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function updateEmployeePresence(badgeNumber: string, currentlyOnSite: boolean, lastSeen?: string) {
  try {
    await db.update(employees)
      .set({
        currentlyOnSite,
        ...(lastSeen ? { lastSeen } : {}),
      })
      .where(eq(employees.badgeNumber, badgeNumber));
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// Equipment Queries
export async function getEquipment() {
  try {
    return await db.select().from(equipment);
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function checkoutEquipmentItem(id: string, userName: string, userBadge: string, expectedReturn?: string) {
  try {
    const res = await db.update(equipment)
      .set({
        status: 'checked_out',
        checkedOutTo: userName,
        checkedOutToBadge: userBadge,
        checkedOutAt: new Date(),
        expectedReturn: expectedReturn || 'End of Day',
      })
      .where(eq(equipment.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function returnEquipmentItem(id: string, condition?: string) {
  try {
    const res = await db.update(equipment)
      .set({
        status: 'available',
        checkedOutTo: null,
        checkedOutToBadge: null,
        checkedOutAt: null,
        ...(condition ? { condition } : {}),
      })
      .where(eq(equipment.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('Database query failed:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}
