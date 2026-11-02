const fs = require('fs');
const path = require('path');
const Database = require('/Users/mohamedcoulibaly/MVP/Pro/retail-manager/backend/local-bridge/node_modules/better-sqlite3');
const bcrypt = require('/Users/mohamedcoulibaly/MVP/Pro/retail-manager/backend/local-bridge/node_modules/bcryptjs');

const sourceDb = path.join(process.env.HOME, 'Library/Application Support/Retail Manager/data/localbridge.sqlite');
const targetDb = path.join(__dirname, 'localbridge.sqlite');

console.log('Copying SQLite DB from:', sourceDb);
fs.copyFileSync(sourceDb, targetDb);

const db = new Database(targetDb);
const now = new Date().toISOString();
const passwordHash = bcrypt.hashSync('Password123!', 10);

console.log('Setting up demo stores and organizations...');

// 1. STIHL MALI STORE
const stihlStoreId = 'store-stihl-dibidani';
db.prepare(`
  INSERT OR REPLACE INTO stores (id, name, address, phone, default_price_tier, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, ?, ?)
`).run(
  stihlStoreId,
  'ETS Madjou Sylla — STIHL Dibidani',
  'Dibidani, Face à Djoliba, Bamako',
  '+223 77 77 90 60',
  now,
  now
);

// 2. HOLDING PRO STORE
const holdingStoreId = 'store-holding-niamana';
db.prepare(`
  INSERT OR REPLACE INTO stores (id, name, address, phone, default_price_tier, created_at, updated_at)
  VALUES (?, ?, ?, ?, 1, ?, ?)
`).run(
  holdingStoreId,
  'Holding Pro (Succursale Niamana Dubaï)',
  'Niamana ATTbougou 1008 Logements, Bamako',
  '+223 79 38 61 74',
  now,
  now
);

// 3. Demo Accounts Setup
const demoUsers = [
  {
    id: 'user-stihl-master',
    email: 'master@stihl-mali.com',
    full_name: 'Madjou Sylla (Master)',
    role: 'master',
    storeId: stihlStoreId
  },
  {
    id: 'user-stihl-worker',
    email: 'caisse@stihl-mali.com',
    full_name: 'Caissier Dibidani (Worker)',
    role: 'worker',
    storeId: stihlStoreId
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

// 4. Ensure products exist for both stores
// Duplicate existing products for stihlStoreId and holdingStoreId if not present
const existingCountStihl = db.prepare('SELECT count(*) as cnt FROM products WHERE store_id = ?').get(stihlStoreId).cnt;
const existingCountHolding = db.prepare('SELECT count(*) as cnt FROM products WHERE store_id = ?').get(holdingStoreId).cnt;

if (existingCountStihl === 0) {
  console.log('Seeding STIHL store with products...');
  db.prepare(`
    INSERT INTO products (
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
    WHERE store_id != ?
    LIMIT 300
  `).run(stihlStoreId, now, now, stihlStoreId);
}

if (existingCountHolding === 0) {
  console.log('Seeding Holding Pro store with products...');
  db.prepare(`
    INSERT INTO products (
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
    WHERE store_id != ?
    LIMIT 300
  `).run(holdingStoreId, now, now, holdingStoreId);
}

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
  `).run(pId, stihlStoreId, p.name, p.sku, p.price, p.cost, p.qty, now, now);
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

console.log('✅ Demo DB successfully created with:');
console.log('Stores count:', db.prepare('SELECT count(*) as cnt FROM stores').get().cnt);
console.log('Products count:', db.prepare('SELECT count(*) as cnt FROM products').get().cnt);
console.log('Users count:', db.prepare('SELECT count(*) as cnt FROM users').get().cnt);
db.close();
