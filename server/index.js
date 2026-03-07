// Electica BSS - Express Backend
// Replaces json-server with real CRUD + JWT authentication

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db.json');
const JWT_SECRET = process.env.JWT_SECRET || 'electica-bss-secret-key-change-in-production';
const PORT = process.env.PORT || 3001;

// ---------------------
// Database helpers
// ---------------------
function readDb() {
  return JSON.parse(readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

function getCollection(name) {
  const db = readDb();
  return db[name] || [];
}

function saveCollection(name, data) {
  const db = readDb();
  db[name] = data;
  writeDb(db);
}

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
  // Auth enforcement flag - set to true once all apps have login
  const ENFORCE_AUTH = true;

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    if (!ENFORCE_AUTH) return next();
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (!ENFORCE_AUTH) return next();
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---------------------
// Auth routes (public)
// ---------------------

// Admin login
app.post('/auth/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const admins = getCollection('admins');
  const admin = admins.find(a => a.username === username);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, role: 'admin', name: admin.name },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email || '', role: 'admin' } });
});

// Agent login
app.post('/auth/agent/login', (req, res) => {
  const { agentId, password } = req.body;
  if (!agentId || !password) {
    return res.status(400).json({ error: 'Agent ID and password required' });
  }

  const agents = getCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  if (!agent) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, agent.passwordHash);
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
});

// User - send OTP (demo: always succeeds)
app.post('/auth/user/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number required' });
  }
  // In production, integrate Twilio/MSG91 here
  res.json({ success: true, message: 'OTP sent' });
});

// User - verify OTP
app.post('/auth/user/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    return res.status(400).json({ error: 'Phone and OTP required' });
  }

  // Demo: any 6-digit OTP works
  if (otp.length !== 6) {
    return res.status(400).json({ error: 'OTP must be 6 digits' });
  }

  const users = getCollection('users');
  const user = users.find(u => u.phone === phone);

  if (!user) {
    return res.json({ success: true, isNewUser: true, phone });
  }

  const token = jwt.sign(
    { id: user.id, role: 'user', name: user.name, phone: user.phone },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    isNewUser: false,
    token,
    user: { id: user.id, name: user.name, phone: user.phone, kycStatus: user.kycStatus }
  });
});

// User - register (new user after OTP)
app.post('/auth/user/register', (req, res) => {
  const { name, phone, vehicle } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone required' });
  }

  const users = getCollection('users');

  // Check if already exists
  if (users.find(u => u.phone === phone)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Generate next user ID
  const nums = users.map(u => parseInt(u.id.replace('USR-', ''), 10)).filter(n => !isNaN(n));
  const nextNum = nums.length ? Math.max(...nums) + 1 : 1;
  const id = `USR-${String(nextNum).padStart(3, '0')}`;

  const newUser = {
    id,
    name,
    phone,
    vehicle: vehicle || '',
    kycStatus: 'pending',
    depositPaid: false,
    batteryId: null,
    registeredAt: new Date().toISOString().split('T')[0],
    onboardedAt: null
  };

  users.push(newUser);
  saveCollection('users', users);

  const token = jwt.sign(
    { id: newUser.id, role: 'user', name: newUser.name, phone: newUser.phone },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.status(201).json({ token, user: newUser });
});

// Token validation endpoint
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
// Generic CRUD routes (protected)
// ---------------------
const COLLECTIONS = ['stations', 'batteries', 'users', 'swaps', 'transactions', 'tickets', 'agents'];

// GET /collection - list with optional query filtering
app.get('/:collection', authMiddleware, (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  let items = getCollection(collection);

  // Query parameter filtering (like json-server)
  const query = req.query;
  for (const [key, value] of Object.entries(query)) {
    if (key === '_sort' || key === '_order' || key === '_limit' || key === '_start' || key === '_page' || key === '_per_page') continue;
    items = items.filter(item => String(item[key]) === String(value));
  }

  // Sorting
  if (query._sort) {
    const field = query._sort;
    const order = query._order === 'desc' ? -1 : 1;
    items.sort((a, b) => {
      if (a[field] < b[field]) return -1 * order;
      if (a[field] > b[field]) return 1 * order;
      return 0;
    });
  }

  // Pagination
  if (query._limit) {
    const start = parseInt(query._start) || 0;
    const limit = parseInt(query._limit);
    items = items.slice(start, start + limit);
  }

  res.json(items);
});

// GET /collection/:id - single item
app.get('/:collection/:id', authMiddleware, (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const items = getCollection(collection);
  const item = items.find(i => String(i.id) === String(id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }

  res.json(item);
});

// POST /collection - create
app.post('/:collection', authMiddleware, (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const items = getCollection(collection);
  const newItem = req.body;

  // Auto-generate ID if not provided
  if (!newItem.id) {
    newItem.id = Date.now().toString();
  }

  items.push(newItem);
  saveCollection(collection, items);

  res.status(201).json(newItem);
});

// PATCH /collection/:id - partial update
app.patch('/:collection/:id', authMiddleware, (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const items = getCollection(collection);
  const index = items.findIndex(i => String(i.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  items[index] = { ...items[index], ...req.body };
  saveCollection(collection, items);

  res.json(items[index]);
});

// PUT /collection/:id - full replace
app.put('/:collection/:id', authMiddleware, (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const items = getCollection(collection);
  const index = items.findIndex(i => String(i.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  items[index] = { ...req.body, id };
  saveCollection(collection, items);

  res.json(items[index]);
});

// DELETE /collection/:id
app.delete('/:collection/:id', authMiddleware, (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) {
    return res.status(404).json({ error: 'Not found' });
  }

  const items = getCollection(collection);
  const index = items.findIndex(i => String(i.id) === String(id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const removed = items.splice(index, 1);
  saveCollection(collection, items);

  res.json(removed[0]);
});

// ---------------------
// Start server
// ---------------------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Electica BSS API running on port ${PORT}`);
});
