import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

import {
  seedDatabaseIfEmpty,
  getOrCreateUser,
  getVisits,
  insertVisit,
  updateVisitCheckOut,
  findActiveVisitByBadgeOrId,
  getEmployees,
  insertEmployee,
  updateEmployeePresence,
  getEquipment,
  checkoutEquipmentItem,
  returnEquipmentItem,
} from './src/db/queries.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security Desk Config
const SECURITY_DESK_CONFIG = {
  companyName: 'Lish AI Labs',
  locationName: 'Lish AI Labs Main Security Desk',
  // Default office coordinates (can be overridden by client or browser current loc)
  latitude: -1.2921,
  longitude: 36.8219,
  maxDistanceMeters: 300,
  dockets: [
    { id: 'tech', name: 'Technical Department', prefix: 'LISH-TECH' },
    { id: 'annotation', name: 'Annotation Department', prefix: 'LISH-ANNT' },
    { id: 'hr', name: 'HR Department', prefix: 'LISH-HR' },
    { id: 'interns', name: 'Interns / Attachees', prefix: 'LISH-INT' },
    { id: 'visitor', name: 'Visitor / External Guest', prefix: 'LISH-VIS' },
  ],
};

// In-memory token session storage for users
interface Session {
  token: string;
  userId: string;
  email: string;
  name: string;
  role: string;
  badgeNumber: string;
  department: string;
  createdAt: number;
}
const activeSessions = new Map<string, Session>();

// Seed default users for quick testing
const defaultUsers = [
  { id: 'usr-1', email: 'admin@lishailabs.ai', name: 'Security Administrator', role: 'admin', badgeNumber: 'LISH-SEC-001', department: 'HR Department', hash: '' },
  { id: 'usr-2', email: 'kaelen@lishailabs.ai', name: 'Kaelen Omondi', role: 'employee', badgeNumber: 'LISH-TECH-101', department: 'Technical Department', hash: '' },
  { id: 'usr-3', email: 'amina@lishailabs.ai', name: 'Amina Wambui', role: 'employee', badgeNumber: 'LISH-ANNT-201', department: 'Annotation Department', hash: '' },
  { id: 'usr-4', email: 'faith@lishailabs.ai', name: 'Faith Nduta', role: 'employee', badgeNumber: 'LISH-HR-301', department: 'HR Department', hash: '' },
  { id: 'usr-5', email: 'grace.intern@lishailabs.ai', name: 'Grace Muthoni', role: 'employee', badgeNumber: 'LISH-INT-401', department: 'Interns / Attachees', hash: '' },
];

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

defaultUsers[0].hash = hashPassword('Admin@123');
defaultUsers[1].hash = hashPassword('Kaelen@123');
defaultUsers[2].hash = hashPassword('Amina@123');
defaultUsers[3].hash = hashPassword('Faith@123');
defaultUsers[4].hash = hashPassword('Grace@123');

const registeredUsers = [...defaultUsers];

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: any;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.split(' ')[1];
  const session = activeSessions.get(token);
  if (session) {
    req.user = session;
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());
  app.use(authMiddleware);

  // Initialize and seed database if necessary
  await seedDatabaseIfEmpty();

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      company: 'Lish AI Labs',
      service: 'Lish AI Labs Security Desk Check-In API',
      database: 'Cloud SQL PostgreSQL',
      timestamp: new Date().toISOString(),
    });
  });

  // Security Desk Configuration
  app.get('/api/security-desk-config', (_req: Request, res: Response) => {
    res.json(SECURITY_DESK_CONFIG);
  });

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password, role = 'employee', department = 'Technical Department', badgeNumber } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = registeredUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Determine prefix based on docket
    let prefix = 'LISH-TECH';
    if (department.includes('Annotation')) prefix = 'LISH-ANNT';
    else if (department.includes('HR')) prefix = 'LISH-HR';
    else if (department.includes('Intern')) prefix = 'LISH-INT';

    const assignedBadge = badgeNumber?.trim() || `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newUser = {
      id: `usr-${Date.now()}`,
      email: normalizedEmail,
      name: name.trim(),
      role: ['admin', 'receptionist', 'employee', 'security'].includes(role) ? role : 'employee',
      badgeNumber: assignedBadge,
      department: department.trim(),
      hash: hashPassword(password),
    };
    registeredUsers.push(newUser);

    try {
      await getOrCreateUser(newUser.id, newUser.email, newUser.name, newUser.role, newUser.department, newUser.badgeNumber);
      await insertEmployee({
        id: `emp-${Date.now()}`,
        name: newUser.name,
        role: newUser.department,
        department: newUser.department,
        email: newUser.email,
        badgeNumber: newUser.badgeNumber,
        currentlyOnSite: false,
        lastSeen: 'Recently registered',
      });
    } catch (err) {
      console.warn('Could not sync user to database:', err);
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      token,
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      badgeNumber: newUser.badgeNumber,
      department: newUser.department,
      createdAt: Date.now(),
    });

    res.status(201).json({
      success: true,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, badgeNumber: newUser.badgeNumber, department: newUser.department },
      token,
      message: 'Account created successfully with Unique ID ' + assignedBadge,
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = registeredUsers.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!user || !verifyPassword(password, user.hash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    activeSessions.set(token, {
      token,
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      badgeNumber: user.badgeNumber,
      department: user.department,
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, badgeNumber: user.badgeNumber, department: user.department },
      token,
      message: `Welcome back, ${user.name}`,
    });
  });

  app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ authenticated: false, user: null });
    }
    res.json({
      authenticated: true,
      user: req.user,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token = header.split(' ')[1];
      activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  // ==========================================
  // CLOUD SQL ATTENDANCE & CHECK-IN API
  // ==========================================

  app.get('/api/stats', async (_req: Request, res: Response) => {
    try {
      const allVisits = await getVisits();
      const active = allVisits.filter(v => v.status === 'active');
      const activeVisitors = active.filter(v => v.type === 'visitor');
      const activeEmployees = active.filter(v => v.type === 'employee');
      const activeContractors = active.filter(v => v.type === 'contractor');

      const todayStr = new Date().toISOString().slice(0, 10);
      const totalToday = allVisits.filter(v => new Date(v.checkInTime).toISOString().startsWith(todayStr)).length;

      const completed = allVisits.filter(v => v.status === 'checked_out' && v.durationMinutes);
      const avgDuration = completed.length > 0
        ? Math.round(completed.reduce((acc, c) => acc + (c.durationMinutes || 0), 0) / completed.length)
        : 0;

      const eqList = await getEquipment();
      const eqOut = eqList.filter(e => e.status === 'checked_out').length;

      res.json({
        currentlyOnSite: active.length,
        activeVisitors: activeVisitors.length,
        activeEmployees: activeEmployees.length,
        activeContractors: activeContractors.length,
        totalToday: totalToday || allVisits.length,
        equipmentCheckedOut: eqOut,
        avgDurationMinutes: avgDuration,
        capacityTotal: 150,
        occupancyPercentage: Math.round((active.length / 150) * 100),
      });
    } catch (err: any) {
      console.error('Failed to get stats:', err);
      res.status(500).json({ error: 'Failed to retrieve statistics.' });
    }
  });

  app.get('/api/visits', async (req: Request, res: Response) => {
    try {
      const { status, type, q } = req.query as { status?: string; type?: string; q?: string };
      const list = await getVisits(status, type, q);
      res.json(list);
    } catch (err: any) {
      console.error('Failed to query visits:', err);
      res.status(500).json({ error: 'Failed to load visits.' });
    }
  });

  let counter = 200;

  // First-Time Sign-Up or Security Desk Check-In
  app.post('/api/visits/checkin', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        type = 'employee',
        name,
        email,
        phone,
        company,
        hostEmployee,
        department = 'Technical Department',
        purpose,
        location = 'Lish AI Labs Security Desk',
        ndaAgreed = true,
        notes,
        assignedEquipment = [],
        distanceMeters,
        badgeNumber: existingBadge,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Full name is required for check-in.' });
      }

      // Geofence check: Cannot check in when more than 300m away!
      if (typeof distanceMeters === 'number' && distanceMeters > 300) {
        return res.status(403).json({
          error: `Geofence Violation: You are ${Math.round(distanceMeters)}m away from Lish AI Labs Security Desk. Maximum allowed check-in radius is 300m.`,
          distanceMeters,
          maxAllowed: 300,
        });
      }

      counter += 1;
      let badgeNumber = existingBadge?.trim();

      if (!badgeNumber) {
        // Generate Unique ID based on Docket
        if (department.includes('Technical')) {
          badgeNumber = `LISH-TECH-${counter}`;
        } else if (department.includes('Annotation')) {
          badgeNumber = `LISH-ANNT-${counter}`;
        } else if (department.includes('HR')) {
          badgeNumber = `LISH-HR-${counter}`;
        } else if (department.includes('Intern') || department.includes('Attachee')) {
          badgeNumber = `LISH-INT-${counter}`;
        } else {
          badgeNumber = `LISH-VIS-${counter}`;
        }
      }

      const newId = `vis-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const visitData = {
        id: newId,
        badgeNumber,
        type: (type === 'visitor' || department.includes('Visitor')) ? 'visitor' : 'employee',
        name: name.trim(),
        email: email ? email.trim() : `${name.trim().toLowerCase().replace(/\s+/g, '.')}@lishailabs.ai`,
        phone: phone?.trim(),
        company: company?.trim() || 'Lish AI Labs',
        hostEmployee: hostEmployee?.trim() || 'Self',
        department: department?.trim() || 'Technical Department',
        purpose: purpose?.trim() || 'Daily Shift & Research at Lish AI Labs',
        location: location?.trim() || 'Lish AI Labs - Main Floor',
        checkInTime: new Date(),
        status: 'active',
        ndaAgreed: Boolean(ndaAgreed),
        notes: (typeof distanceMeters === 'number' ? `Geofence verified (${Math.round(distanceMeters)}m) · ` : '') + (notes?.trim() || 'Security Desk QR Check-In'),
        assignedEquipment: Array.isArray(assignedEquipment) ? JSON.stringify(assignedEquipment) : null,
        checkedInBy: req.user?.name || 'Security Desk Mobile QR',
      };

      const savedVisit = await insertVisit(visitData);

      // Register or update in employees directory
      try {
        const emps = await getEmployees();
        const existingEmp = emps.find(e => e.badgeNumber.toLowerCase() === badgeNumber.toLowerCase() || (email && e.email.toLowerCase() === email.toLowerCase()));
        if (existingEmp) {
          await updateEmployeePresence(existingEmp.badgeNumber, true, 'Just now (Security Desk)');
        } else {
          await insertEmployee({
            id: `emp-${Date.now()}`,
            name: savedVisit.name,
            role: `${savedVisit.department || 'Technical'} Member`,
            department: savedVisit.department || 'Technical Department',
            email: savedVisit.email || `${savedVisit.name.toLowerCase().replace(/\s+/g, '.')}@lishailabs.ai`,
            badgeNumber: savedVisit.badgeNumber,
            currentlyOnSite: true,
            lastSeen: 'Just now (Security Desk)',
          });
        }
      } catch (e) {
        console.warn('Could not sync employee record:', e);
      }

      // If assigned equipment, mark checked out
      if (Array.isArray(assignedEquipment) && assignedEquipment.length > 0) {
        for (const eqId of assignedEquipment) {
          try {
            await checkoutEquipmentItem(eqId, savedVisit.name, savedVisit.badgeNumber, 'End of Shift');
          } catch (e) {
            // ignore
          }
        }
      }

      res.status(201).json({
        success: true,
        visit: savedVisit,
        uniqueId: badgeNumber,
        message: `Welcome to Lish AI Labs! Your Unique ID is ${badgeNumber}. Checked in successfully.`,
      });
    } catch (err: any) {
      console.error('Failed to create check-in:', err);
      res.status(500).json({ error: 'Failed to process check-in.' });
    }
  });

  // Check-Out
  app.post('/api/visits/checkout', async (req: Request, res: Response) => {
    try {
      const { id, badgeNumber } = req.body;
      const target = await findActiveVisitByBadgeOrId(id, badgeNumber);
      if (!target) {
        return res.status(404).json({ error: 'Active check-in record not found for this Unique ID.' });
      }

      const outTime = new Date();
      const inTime = new Date(target.checkInTime);
      const duration = Math.max(1, Math.round((outTime.getTime() - inTime.getTime()) / 60000));

      const updated = await updateVisitCheckOut(target.id, duration);

      // Update employee off-site
      try {
        await updateEmployeePresence(target.badgeNumber, false, 'Checked out today');
      } catch (e) {
        // ignore
      }

      // Release equipment
      try {
        const allEq = await getEquipment();
        for (const eq of allEq) {
          if (eq.checkedOutToBadge === target.badgeNumber) {
            await returnEquipmentItem(eq.id, 'Returned on check-out');
          }
        }
      } catch (e) {
        // ignore
      }

      res.json({
        success: true,
        visit: updated,
        message: `${target.name} (${target.badgeNumber}) checked out from Lish AI Labs. Duration: ${duration} minutes.`,
      });
    } catch (err: any) {
      console.error('Failed to checkout:', err);
      res.status(500).json({ error: 'Failed to process check-out.' });
    }
  });

  app.post('/api/visits/bulk-checkout', async (req: Request, res: Response) => {
    try {
      const { ids } = req.body;
      const allActive = (await getVisits()).filter(v => v.status === 'active' && (!ids || ids.includes(v.id)));
      let count = 0;
      for (const v of allActive) {
        const duration = Math.max(1, Math.round((Date.now() - new Date(v.checkInTime).getTime()) / 60000));
        await updateVisitCheckOut(v.id, duration);
        count++;
      }
      res.json({ success: true, count, message: `Checked out ${count} attendees.` });
    } catch (err: any) {
      console.error('Bulk checkout failed:', err);
      res.status(500).json({ error: 'Failed to process bulk check-out.' });
    }
  });

  // Fast Lookup by Unique ID, Email or Name
  app.get('/api/lookup/:query', async (req: Request, res: Response) => {
    try {
      const q = req.params.query.trim().toLowerCase();
      const all = await getVisits();
      const activeMatch = all.find(v =>
        v.status === 'active' && (
          v.badgeNumber.toLowerCase() === q ||
          v.name.toLowerCase() === q ||
          (v.email && v.email.toLowerCase() === q)
        )
      );

      if (activeMatch) {
        return res.json({ found: true, active: true, visit: activeMatch });
      }

      const emps = await getEmployees();
      const empMatch = emps.find(e =>
        e.badgeNumber.toLowerCase() === q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase() === q
      );

      if (empMatch) {
        return res.json({ found: true, active: empMatch.currentlyOnSite, employee: empMatch });
      }

      res.json({ found: false });
    } catch (err: any) {
      console.error('Lookup failed:', err);
      res.status(500).json({ error: 'Lookup operation failed.' });
    }
  });

  app.get('/api/employees', async (_req: Request, res: Response) => {
    try {
      const list = await getEmployees();
      res.json(list);
    } catch (err: any) {
      console.error('Failed to get employees:', err);
      res.status(500).json({ error: 'Failed to load employees.' });
    }
  });

  app.get('/api/equipment', async (_req: Request, res: Response) => {
    try {
      const list = await getEquipment();
      res.json(list);
    } catch (err: any) {
      console.error('Failed to get equipment:', err);
      res.status(500).json({ error: 'Failed to load equipment.' });
    }
  });

  app.post('/api/equipment/checkout', async (req: Request, res: Response) => {
    try {
      const { equipmentId, userName, userBadge, expectedReturn } = req.body;
      const updated = await checkoutEquipmentItem(equipmentId, userName, userBadge, expectedReturn);
      res.json({ success: true, item: updated });
    } catch (err: any) {
      console.error('Equipment checkout failed:', err);
      res.status(500).json({ error: 'Failed to checkout asset.' });
    }
  });

  app.post('/api/equipment/checkin', async (req: Request, res: Response) => {
    try {
      const { equipmentId, conditionNotes } = req.body;
      const updated = await returnEquipmentItem(equipmentId, conditionNotes);
      res.json({ success: true, item: updated });
    } catch (err: any) {
      console.error('Equipment checkin failed:', err);
      res.status(500).json({ error: 'Failed to return asset.' });
    }
  });

  app.get('/api/roster/evacuation', async (_req: Request, res: Response) => {
    try {
      const active = (await getVisits()).filter(v => v.status === 'active');
      const roster = active.map(v => ({
        badgeNumber: v.badgeNumber,
        name: v.name,
        type: v.type,
        location: v.location,
        hostOrDept: v.department || v.company || 'Lish AI Labs',
        checkInTime: v.checkInTime,
        phone: v.phone || 'N/A',
      }));
      res.json({ timestamp: new Date().toISOString(), totalHeadcount: roster.length, roster });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load evacuation roster.' });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Lish AI Labs] Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
