// One-time script to add admins and agents to db.json with bcrypt hashes
// Run: node server/seed-auth.js

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'db.json');

const db = JSON.parse(readFileSync(DB_PATH, 'utf8'));

// Add admins collection
db.admins = [
  {
    id: 'ADM-001',
    username: 'admin',
    name: 'System Admin',
    passwordHash: bcrypt.hashSync('admin123', 10)
  }
];

// Add agents collection
db.agents = [
  {
    id: 'AGT-001',
    name: 'Ravi Mehta',
    zone: 'South Bangalore',
    passwordHash: bcrypt.hashSync('agent123', 10)
  },
  {
    id: 'AGT-002',
    name: 'Priya Sharma',
    zone: 'North Bangalore',
    passwordHash: bcrypt.hashSync('agent123', 10)
  }
];

writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
console.log('Seeded admins and agents into db.json');
console.log('  Admin: username=admin, password=admin123');
console.log('  Agent: id=AGT-001, password=agent123');
console.log('  Agent: id=AGT-002, password=agent123');
