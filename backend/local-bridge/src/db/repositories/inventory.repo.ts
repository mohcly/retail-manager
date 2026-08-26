import Database from 'better-sqlite3';
import { LocalInventoryMovement, LocalStockAdjustment } from '../types.js';

export const createInventoryRepo = (db: Database.Database) => ({
  getInventoryMovementById(id: string): LocalInventoryMovement | undefined {
    return db.prepare('SELECT * FROM inventory_movements WHERE id = ?').get(id) as LocalInventoryMovement | undefined;
  },

  listInventoryMovements(storeId?: string, limit?: number): LocalInventoryMovement[] {
    if (storeId) {
      const rows = db
        .prepare(
          `SELECT * FROM inventory_movements WHERE store_id = ? ORDER BY created_at DESC${limit ? ' LIMIT ?' : ''}`
        )
        .all(limit ? [storeId, limit] : [storeId]);
      return rows as LocalInventoryMovement[];
    }
    const rows = db
      .prepare(`SELECT * FROM inventory_movements ORDER BY created_at DESC${limit ? ' LIMIT ?' : ''}`)
      .all(limit ? [limit] : []);
    return rows as LocalInventoryMovement[];
  },

  insertInventoryMovement(movement: LocalInventoryMovement) {
    db.prepare(
      `
      INSERT INTO inventory_movements (
        id,
        store_id,
        product_id,
        product_name,
        movement_type,
        quantity,
        reason,
        source,
        batch_id,
        created_at,
        created_by
      ) VALUES (
        @id,
        @store_id,
        @product_id,
        @product_name,
        @movement_type,
        @quantity,
        @reason,
        @source,
        @batch_id,
        @created_at,
        @created_by
      )
    `
    ).run({
      ...movement,
      product_name: movement.product_name ?? null,
      reason: movement.reason ?? null,
      source: movement.source ?? null,
      batch_id: movement.batch_id ?? null,
      created_by: movement.created_by ?? null,
    });
  },

  listStockAdjustments(storeId?: string, limit: number = 100): LocalStockAdjustment[] {
    let sql = `
      SELECT sa.*, p.name as product_name
      FROM stock_adjustments sa
      LEFT JOIN products p ON sa.product_id = p.id
    `;
    const params: any[] = [];
    if (storeId) {
      sql += ' WHERE sa.store_id = ?';
      params.push(storeId);
    }
    sql += ' ORDER BY sa.created_at DESC LIMIT ?';
    params.push(limit);
    return db.prepare(sql).all(...params) as LocalStockAdjustment[];
  },

  insertStockAdjustment(adj: LocalStockAdjustment) {
    db.prepare(`
      INSERT INTO stock_adjustments (
        id, store_id, worker_id, product_id, adjustment_type, quantity_adjusted, reason, created_at
      ) VALUES (
        @id, @store_id, @worker_id, @product_id, @adjustment_type, @quantity_adjusted, @reason, @created_at
      )
    `).run({
      id: adj.id,
      store_id: adj.store_id,
      worker_id: adj.worker_id ?? null,
      product_id: adj.product_id,
      adjustment_type: adj.adjustment_type,
      quantity_adjusted: adj.quantity_adjusted,
      reason: adj.reason ?? null,
      created_at: adj.created_at,
    });
  },
});
