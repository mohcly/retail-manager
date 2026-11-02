const fs = require('fs');
const path = require('path');
const Database = require('/Users/mohamedcoulibaly/MVP/Pro/retail-manager/backend/local-bridge/node_modules/better-sqlite3');
const bcrypt = require('/Users/mohamedcoulibaly/MVP/Pro/retail-manager/backend/local-bridge/node_modules/bcryptjs');

const sourceDb = path.join(process.env.HOME, 'Library/Application Support/Retail Manager/data/localbridge.sqlite');
const targetDb = path.join(__dirname, 'localbridge.sqlite');

console.log('Copying SQLite DB from:', sourceDb);
fs.copyFileSync(sourceDb, targetDb);

const db = new Database(targetDb);
db.pragma('foreign_keys = OFF');
const now = new Date().toISOString();
const passwordHash = bcrypt.hashSync('Password123!', 10);

console.log('Configuring isolated demo organizations and stores...');

// 1. STORES DEFINITION
const stihlDibidaniId = 'store-stihl-dibidani';
const stihlNiamakoroId = 'test-store-niamakoro-2';
const holdingStoreId = 'store-holding-niamana';

const validStoreIds = [stihlDibidaniId, stihlNiamakoroId, holdingStoreId];

// STIHL Dibidani
db.prepare(`
  INSERT OR REPLACE INTO stores (id, name, address, phone, default_price_tier, owner_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, ?, ?, ?)
`).run(
  stihlDibidaniId,
  'ETS Madjou Sylla — STIHL Dibidani',
  'Dibidani, Face à Djoliba, Bamako',
  '+223 77 77 90 60',
  'user-stihl-master',
  now,
  now
);

// STIHL Niamakoro
db.prepare(`
  INSERT OR REPLACE INTO stores (id, name, address, phone, default_price_tier, owner_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, ?, ?, ?)
`).run(
  stihlNiamakoroId,
  'Quincaillerie Niamakoro',
  'Niamakoro, Bamako',
  '+223 76 00 00 00',
  'user-stihl-master',
  now,
  now
);

// HOLDING PRO Niamana Dubaï
db.prepare(`
  INSERT OR REPLACE INTO stores (id, name, address, phone, default_price_tier, owner_id, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, ?, ?, ?)
`).run(
  holdingStoreId,
  'Holding Pro (Succursale Niamana Dubaï)',
  'Niamana ATTbougou 1008 Logements, Bamako',
  '+223 79 38 61 74',
  'user-holding-master',
  now,
  now
);

// PURGE any other orphaned/test stores
db.prepare(`DELETE FROM stores WHERE id NOT IN (?, ?, ?)`).run(...validStoreIds);

// 2. DEMO USERS DEFINITION
const demoUsers = [
  {
    id: 'user-stihl-master',
    email: 'master@stihl-mali.com',
    full_name: 'Madjou Sylla (Master)',
    role: 'master',
    storeId: stihlDibidaniId
  },
  {
    id: 'user-stihl-worker',
    email: 'caisse@stihl-mali.com',
    full_name: 'Caissier Dibidani (Worker)',
    role: 'worker',
    storeId: stihlDibidaniId
  },
  {
    id: 'user-holding-master',
    email: 'master@holding-pro.com',
    full_name: 'Directeur Holding Pro (Master)',
    role: 'master',
    storeId: holdingStoreId
  },
  {
    id: 'user-holding-worker',
    email: 'caisse@holding-pro.com',
    full_name: 'Caissier Niamana (Worker)',
    role: 'worker',
    storeId: holdingStoreId
  }
];

const validUserIds = demoUsers.map(u => u.id);

// PURGE any old test users and roles
db.prepare(`DELETE FROM users WHERE id NOT IN (?, ?, ?, ?)`).run(...validUserIds);
db.prepare(`DELETE FROM user_roles WHERE user_id NOT IN (?, ?, ?, ?)`).run(...validUserIds);

demoUsers.forEach(u => {
  db.prepare(`
    INSERT OR REPLACE INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(u.id, u.email, passwordHash, u.full_name, u.role, now, now);

  db.prepare(`
    INSERT OR REPLACE INTO user_roles (id, user_id, role, store_id, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run('role-' + u.id, u.id, u.role, u.storeId, now);

  // Update store owner if master
  if (u.role === 'master') {
    db.prepare('UPDATE stores SET owner_id = ? WHERE id = ?').run(u.id, u.storeId);
  }
});
// Ensure STIHL Niamakoro owner is user-stihl-master
db.prepare('UPDATE stores SET owner_id = ? WHERE id = ?').run('user-stihl-master', stihlNiamakoroId);

// 3. SEED PRODUCTS PER STORE FIRST, THEN PURGE ORPHANS
console.log('Seeding STIHL store with catalog...');
db.prepare(`
  INSERT OR IGNORE INTO products (
    id, store_id, name, sku, barcode, description, cost_price, unit_price, wholesale_price,
    quantity, min_quantity, category, created_at, updated_at
  )
  SELECT
    'stihl-' || id,
    ?,
    name,
    sku,
    barcode,
    description,
    cost_price,
    unit_price,
    wholesale_price,
    CASE WHEN quantity <= 0 THEN 25 ELSE quantity END,
    5,
    category,
    ?,
    ?
  FROM products
  LIMIT 250
`).run(stihlDibidaniId, now, now);

console.log('Seeding STIHL Niamakoro store with catalog...');
db.prepare(`
  INSERT OR IGNORE INTO products (
    id, store_id, name, sku, barcode, description, cost_price, unit_price, wholesale_price,
    quantity, min_quantity, category, created_at, updated_at
  )
  SELECT
    'stihl-nk-' || id,
    ?,
    name,
    sku,
    barcode,
    description,
    cost_price,
    unit_price,
    wholesale_price,
    CASE WHEN quantity <= 0 THEN 15 ELSE quantity END,
    5,
    category,
    ?,
    ?
  FROM products
  LIMIT 150
`).run(stihlNiamakoroId, now, now);

console.log('Seeding Holding Pro store with catalog...');
db.prepare(`
  INSERT OR IGNORE INTO products (
    id, store_id, name, sku, barcode, description, cost_price, unit_price, wholesale_price,
    quantity, min_quantity, category, created_at, updated_at
  )
  SELECT
    'holding-' || id,
    ?,
    name,
    sku,
    barcode,
    description,
    cost_price,
    unit_price,
    wholesale_price,
    CASE WHEN quantity <= 0 THEN 30 ELSE quantity END,
    5,
    category,
    ?,
    ?
  FROM products
  LIMIT 250
`).run(holdingStoreId, now, now);

// NOW purge products from stores that no longer exist
db.prepare(`DELETE FROM products WHERE store_id NOT IN (?, ?, ?)`).run(...validStoreIds);

// Ensure specific STIHL products exist in the STIHL store for proper invoice rendering:
const stihlSpecials = [
  { name: 'Tronçonneuse STIHL MS 250', sku: 'MS-250', price: 375000, cost: 300000, qty: 12 },
  { name: 'Tronçonneuse STIHL MS 180', sku: 'MS-180', price: 245000, cost: 195000, qty: 8 },
  { name: 'Chaîne de rechange STIHL 3/8P', sku: 'CH-38P', price: 15000, cost: 10000, qty: 50 },
  { name: 'Guide-chaîne Rollomatic E 45cm', sku: 'GD-45', price: 35000, cost: 25000, qty: 20 },
  { name: 'Huile Moteur 2 Temps STIHL 1L', sku: 'HUILE-2T-1L', price: 7500, cost: 5000, qty: 100 }
];

stihlSpecials.forEach((p, idx) => {
  const pId = 'stihl-spec-' + idx;
  db.prepare(`
    INSERT OR REPLACE INTO products (id, store_id, name, sku, unit_price, cost_price, quantity, min_quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 5, ?, ?)
  `).run(pId, stihlDibidaniId, p.name, p.sku, p.price, p.cost, p.qty, now, now);
});

// Ensure specific Holding Pro products exist:
const holdingSpecials = [
  { name: 'Filtre à Huile Isuzu D-Max', sku: 'FIL-ISUZU-01', price: 12500, cost: 8500, qty: 45 },
  { name: 'Filtre à Gasoil Toyota Hilux', sku: 'FIL-TOY-GAS', price: 18000, cost: 12000, qty: 30 },
  { name: 'Huile Moteur Total Rubia 15W40 5L', sku: 'TOT-RUBIA-5L', price: 22000, cost: 16500, qty: 60 },
  { name: 'Plaquettes de Frein Avant Prado', sku: 'PLAQ-PRADO-AV', price: 35000, cost: 24000, qty: 15 },
  { name: 'Liquide de Frein DOT4 500ml', sku: 'DOT4-500', price: 4500, cost: 2800, qty: 80 }
];

holdingSpecials.forEach((p, idx) => {
  const pId = 'holding-spec-' + idx;
  db.prepare(`
    INSERT OR REPLACE INTO products (id, store_id, name, sku, unit_price, cost_price, quantity, min_quantity, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 5, ?, ?)
  `).run(pId, holdingStoreId, p.name, p.sku, p.price, p.cost, p.qty, now, now);
});

// 4. SUPPLIERS PER ORGANIZATION
db.prepare(`DELETE FROM suppliers WHERE store_id NOT IN (?, ?, ?)`).run(...validStoreIds);

const stihlSuppliers = [
  { id: 'sup-stihl-01', name: 'ANDREAS STIHL AG & Co. KG (Allemagne)', phone: '+49 7151 26-0', email: 'export@stihl.de' },
  { id: 'sup-stihl-02', name: 'ETS Madjou Sylla Import-Export Bamako', phone: '+223 77 77 90 60', email: 'contact@stihl-mali.com' },
  { id: 'sup-stihl-03', name: 'TotalEnergies Marketing Mali SA', phone: '+223 20 22 40 41', email: 'service-clients@totalenergies.ml' },
];

stihlSuppliers.forEach(s => {
  db.prepare(`
    INSERT OR REPLACE INTO suppliers (id, store_id, name, phone, email, address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Bamako, Mali', ?, ?)
  `).run(s.id, stihlDibidaniId, s.name, s.phone, s.email, now, now);
});

const holdingSuppliers = [
  { id: 'sup-holding-01', name: 'Holding Pro General Trading LLC (Dubaï)', phone: '+971 4 000 0000', email: 'supply@holding-pro.com' },
  { id: 'sup-holding-02', name: 'CFAO Motors Mali (Pièces Toyota & Isuzu)', phone: '+223 20 21 29 25', email: 'contact@cfaogroup.com' },
  { id: 'sup-holding-03', name: 'Total Lubricants International Distribution', phone: '+223 20 22 00 00', email: 'lubricants@holding-pro.com' },
];

holdingSuppliers.forEach(s => {
  db.prepare(`
    INSERT OR REPLACE INTO suppliers (id, store_id, name, phone, email, address, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Niamana ATTbougou, Bamako', ?, ?)
  `).run(s.id, holdingStoreId, s.name, s.phone, s.email, now, now);
});

// 5. CLIENTS PER ORGANIZATION
db.prepare(`DELETE FROM clients WHERE store_id NOT IN (?, ?, ?)`).run(...validStoreIds);

const stihlClients = [
  { id: 'cli-stihl-01', name: 'Société des Mines de Loulo (SOMILO)', phone: '+223 20 70 80 00', code: 'CLI-SOMILO' },
  { id: 'cli-stihl-02', name: 'Entreprise Forestière et Agricole du Mali', phone: '+223 66 70 12 34', code: 'CLI-EFAM' },
];

stihlClients.forEach(c => {
  db.prepare(`
    INSERT OR REPLACE INTO clients (id, store_id, name, phone, code, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(c.id, stihlDibidaniId, c.name, c.phone, c.code, now, now);
});

const holdingClients = [
  { id: 'cli-holding-01', name: 'Flotte Transport Express Niamana', phone: '+223 79 00 11 22', code: 'CLI-FTE-01' },
  { id: 'cli-holding-02', name: 'Garage Moderne Niamana Dubaï', phone: '+223 76 55 44 33', code: 'CLI-GMND-02' },
];

holdingClients.forEach(c => {
  db.prepare(`
    INSERT OR REPLACE INTO clients (id, store_id, name, phone, code, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(c.id, holdingStoreId, c.name, c.phone, c.code, now, now);
});

console.log('✅ Demo DB successfully created with isolated data:');
console.log('Stores count:', db.prepare('SELECT count(*) as cnt FROM stores').get().cnt);
console.log('Products count:', db.prepare('SELECT count(*) as cnt FROM products').get().cnt);
console.log('Users count:', db.prepare('SELECT count(*) as cnt FROM users').get().cnt);
console.log('Suppliers count:', db.prepare('SELECT count(*) as cnt FROM suppliers').get().cnt);
console.log('Clients count:', db.prepare('SELECT count(*) as cnt FROM clients').get().cnt);
db.close();
