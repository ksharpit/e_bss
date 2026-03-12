// Electica BSS - Express Backend with PostgreSQL + TimescaleDB + MQTT
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import pool, { rowToCamel, bodyToSnake } from './db.js';
import { initMqtt } from './mqtt.js';

// Initialize Firebase Admin for phone auth verification
const fbServicePath = process.env.FIREBASE_SA_PATH || './server/firebase-service-account.json';
if (existsSync(fbServicePath)) {
  const sa = JSON.parse(readFileSync(fbServicePath, 'utf8'));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
  console.log('Firebase Admin initialized');
} else {
  console.warn('Firebase service account not found at', fbServicePath, '- phone auth verification disabled');
}

const JWT_SECRET = process.env.JWT_SECRET || 'electica-bss-secret-key-change-in-production';
const PORT = process.env.PORT || 3001;

// ---------------------
// Express app
// ---------------------
const app = express();
app.use(cors());
app.use(express.json());

// ---------------------
// Auth middleware
// ---------------------
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---------------------
// Auth routes (public)
// ---------------------

// Admin login
app.post('/auth/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, role: 'admin', name: admin.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email || '', role: 'admin' } });
  } catch (err) {
    console.error('Admin login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Agent login
app.post('/auth/agent/login', async (req, res) => {
  const { agentId, password } = req.body;
  if (!agentId || !password) {
    return res.status(400).json({ error: 'Agent ID and password required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM agents WHERE id = $1', [agentId]);
    const agent = rows[0];
    if (!agent) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = bcrypt.compareSync(password, agent.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: agent.id, role: 'agent', name: agent.name, zone: agent.zone },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      agent: { id: agent.id, name: agent.name, zone: agent.zone, role: 'agent' }
    });
  } catch (err) {
    console.error('Agent login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// User - verify Firebase phone auth token
app.post('/auth/user/verify-firebase', async (req, res) => {
  const { firebaseToken } = req.body;
  if (!firebaseToken) {
    return res.status(400).json({ error: 'Firebase token required' });
  }

  try {
    // Verify Firebase ID token
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const phone = decoded.phone_number; // e.g. "+919876543210"
    if (!phone) {
      return res.status(400).json({ error: 'No phone number in token' });
    }

    // Format phone to match our DB format: "+91 98765-43210"
    const digits = phone.replace(/\D/g, '').slice(-10);
    const formatted = '+91 ' + digits.slice(0, 5) + '-' + digits.slice(5);

    // Look up user by phone (try both formats)
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE phone = $1 OR phone = $2',
      [formatted, phone]
    );
    const user = rows[0];

    if (!user) {
      return res.json({ success: true, isNewUser: true, phone: formatted });
    }

    const u = rowToCamel(user);
    const token = jwt.sign(
      { id: u.id, role: 'user', name: u.name, phone: u.phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      isNewUser: false,
      token,
      user: { id: u.id, name: u.name, phone: u.phone, kycStatus: u.kycStatus }
    });
  } catch (err) {
    console.error('Firebase verify error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// User - register (with Firebase token verification)
app.post('/auth/user/register', async (req, res) => {
  const { firebaseToken, name, vehicle, vehicleId, initials, aadhaar, pan } = req.body;
  if (!firebaseToken || !name) {
    return res.status(400).json({ error: 'Firebase token and name required' });
  }

  try {
    // Verify Firebase token and extract phone
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    const rawPhone = decoded.phone_number;
    if (!rawPhone) {
      return res.status(400).json({ error: 'No phone number in token' });
    }
    const digits = rawPhone.replace(/\D/g, '').slice(-10);
    const phone = '+91 ' + digits.slice(0, 5) + '-' + digits.slice(5);

    // Check if exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE phone = $1 OR phone = $2',
      [phone, rawPhone]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Generate next user ID
    const { rows: maxRows } = await pool.query(
      "SELECT id FROM users WHERE id ~ '^USR-[0-9]+$' ORDER BY id DESC LIMIT 1"
    );
    let nextNum = 1;
    if (maxRows.length > 0) {
      nextNum = parseInt(maxRows[0].id.replace('USR-', ''), 10) + 1;
    }
    const id = `USR-${String(nextNum).padStart(3, '0')}`;

    await pool.query(`
      INSERT INTO users (id, name, initials, phone, vehicle, vehicle_id, aadhaar, pan, kyc_status, deposit_paid, registered_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', false, NOW())
    `, [id, name, initials || name.slice(0, 2).toUpperCase(), phone, vehicle || '', vehicleId || '', aadhaar || '', pan || '']);

    const newUser = { id, name, phone, vehicle: vehicle || '', kycStatus: 'pending', depositPaid: false, batteryId: null };

    const token = jwt.sign(
      { id, role: 'user', name, phone },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('Register error:', err.message);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: 'Token expired. Please verify your phone again.' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Token validation
app.get('/auth/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ---------------------
// Telemetry endpoint
// ---------------------

// GET /telemetry/:batteryId - get recent telemetry for a battery
app.get('/telemetry/:batteryId', authMiddleware, async (req, res) => {
  const { batteryId } = req.params;
  const hours = parseInt(req.query.hours) || 24;

  try {
    const { rows } = await pool.query(`
      SELECT time, voltage, current_draw, soc, soh, cycle_count,
             pod_temp, cell_voltages, ntc_temps, pdu_temps
      FROM battery_telemetry
      WHERE battery_id = $1 AND time > NOW() - INTERVAL '1 hour' * $2
      ORDER BY time DESC
      LIMIT 500
    `, [batteryId, hours]);

    res.json(rows.map(rowToCamel));
  } catch (err) {
    console.error('Telemetry fetch error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /telemetry/:batteryId/latest - latest single reading
app.get('/telemetry/:batteryId/latest', authMiddleware, async (req, res) => {
  const { batteryId } = req.params;

  try {
    const { rows } = await pool.query(`
      SELECT time, voltage, current_draw, soc, soh, cycle_count,
             cap_available, cap_initial, pod_temp,
             cell_voltages, ntc_temps, pdu_temps
      FROM battery_telemetry
      WHERE battery_id = $1
      ORDER BY time DESC LIMIT 1
    `, [batteryId]);

    res.json(rows.length > 0 ? rowToCamel(rows[0]) : null);
  } catch (err) {
    console.error('Telemetry latest error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------
// Generic CRUD routes
// ---------------------
const COLLECTIONS = ['stations', 'batteries', 'users', 'swaps', 'transactions', 'tickets', 'agents'];

// Query parameter keys to skip (pagination/sorting)
const META_KEYS = new Set(['_sort', '_order', '_limit', '_start', '_page', '_per_page']);

// GET /collection - list with filtering
app.get('/:collection', authMiddleware, async (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    let sql = `SELECT * FROM ${collection}`;
    const params = [];
    const conditions = [];

    // Query param filtering
    for (const [key, value] of Object.entries(req.query)) {
      if (META_KEYS.has(key)) continue;
      const col = bodyToSnake({ [key]: value });
      const colName = Object.keys(col)[0];
      params.push(value);
      conditions.push(`${colName}::text = $${params.length}`);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    if (req.query._sort) {
      const sortCol = bodyToSnake({ [req.query._sort]: null });
      const sortField = Object.keys(sortCol)[0];
      const order = req.query._order === 'desc' ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${sortField} ${order}`;
    }

    // Pagination
    if (req.query._limit) {
      const limit = parseInt(req.query._limit);
      const start = parseInt(req.query._start) || 0;
      sql += ` LIMIT ${limit} OFFSET ${start}`;
    }

    const { rows } = await pool.query(sql, params);
    res.json(rows.map(rowToCamel));
  } catch (err) {
    console.error(`GET /${collection} error:`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /collection/:id
app.get('/:collection/:id', authMiddleware, async (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { rows } = await pool.query(`SELECT * FROM ${collection} WHERE id = $1`, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(rowToCamel(rows[0]));
  } catch (err) {
    console.error(`GET /${collection}/${id} error:`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /collection
app.post('/:collection', authMiddleware, async (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const snakeBody = bodyToSnake(req.body);
    if (!snakeBody.id) {
      snakeBody.id = Date.now().toString();
    }

    const cols = Object.keys(snakeBody);
    // Stringify arrays/objects for JSONB columns (pg doesn't auto-convert)
    const vals = Object.values(snakeBody).map(v =>
      (Array.isArray(v) || (v && typeof v === 'object' && !(v instanceof Date))) ? JSON.stringify(v) : v
    );
    const placeholders = vals.map((_, i) => `$${i + 1}`);

    await pool.query(
      `INSERT INTO ${collection} (${cols.join(',')}) VALUES (${placeholders.join(',')})`,
      vals
    );

    res.status(201).json(rowToCamel(snakeBody));
  } catch (err) {
    console.error(`POST /${collection} error:`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /collection/:id
app.patch('/:collection/:id', authMiddleware, async (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const snakeBody = bodyToSnake(req.body);
    const cols = Object.keys(snakeBody);
    // Stringify arrays/objects for JSONB columns (pg doesn't auto-convert)
    const vals = Object.values(snakeBody).map(v =>
      (Array.isArray(v) || (v && typeof v === 'object' && !(v instanceof Date))) ? JSON.stringify(v) : v
    );

    if (cols.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    vals.push(id);

    const { rows } = await pool.query(
      `UPDATE ${collection} SET ${setClause} WHERE id = $${vals.length} RETURNING *`,
      vals
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(rowToCamel(rows[0]));
  } catch (err) {
    console.error(`PATCH /${collection}/${id} error:`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /collection/:id
app.put('/:collection/:id', authMiddleware, async (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const snakeBody = bodyToSnake(req.body);
    snakeBody.id = id;
    const cols = Object.keys(snakeBody);
    // Stringify arrays/objects for JSONB columns (pg doesn't auto-convert)
    const vals = Object.values(snakeBody).map(v =>
      (Array.isArray(v) || (v && typeof v === 'object' && !(v instanceof Date))) ? JSON.stringify(v) : v
    );
    const placeholders = vals.map((_, i) => `$${i + 1}`);

    // Upsert
    const setClause = cols.filter(c => c !== 'id').map((c, i) => `${c} = EXCLUDED.${c}`).join(', ');

    const { rows } = await pool.query(
      `INSERT INTO ${collection} (${cols.join(',')}) VALUES (${placeholders.join(',')})
       ON CONFLICT (id) DO UPDATE SET ${setClause} RETURNING *`,
      vals
    );

    res.json(rowToCamel(rows[0]));
  } catch (err) {
    console.error(`PUT /${collection}/${id} error:`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /collection/:id
app.delete('/:collection/:id', authMiddleware, async (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const { rows } = await pool.query(
      `DELETE FROM ${collection} WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(rowToCamel(rows[0]));
  } catch (err) {
    console.error(`DELETE /${collection}/${id} error:`, err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------------------
// Start server
// ---------------------
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Electica BSS API running on port ${PORT}`);

  // Test DB connection
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    console.error('API will return errors until database is available');
  }

  // Start MQTT client
  initMqtt(pool);
});
