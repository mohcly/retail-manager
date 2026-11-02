import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db/index.js';
import { authenticateRequest, getAccessibleStoreIds } from './utils/auth.js';

const rolesQuerySchema = z.object({
  role: z.enum(['master', 'worker', 'deliverer']).optional(),
});

const deliveriesQuerySchema = z.object({
  deliverer_id: z.string().optional(),
  store_id: z.string().optional(),
});

export async function registerTeamRoutes(app: FastifyInstance) {
  app.get('/rest/v1/users', async (request, reply) => {
    const claims = authenticateRequest(request, reply, ['master', 'worker']);
    if (!claims) return;

    const accessibleStoreIds = getAccessibleStoreIds(claims);
    const allRoles = db.listUserRoles();
    const allowedUserIds = new Set(
      allRoles
        .filter(
          (r) =>
            (r.store_id && accessibleStoreIds.includes(r.store_id)) ||
            r.user_id === claims.sub
        )
        .map((r) => r.user_id)
    );
    allowedUserIds.add(claims.sub);

    const users = db.listUsers().filter((u) => allowedUserIds.has(u.id));
    return reply.send(
      users.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone ?? null,
        created_at: user.created_at,
        updated_at: user.updated_at ?? user.created_at,
      }))
    );
  });

  app.get('/rest/v1/user_roles', async (request, reply) => {
    const claims = authenticateRequest(request, reply, ['master', 'worker']);
    if (!claims) return;

    const parsed = rolesQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationFailed', details: parsed.error.flatten() });
    }

    const accessibleStoreIds = getAccessibleStoreIds(claims);
    const allRoles = db.listUserRoles(parsed.data.role);
    const filteredRoles = allRoles.filter(
      (r) =>
        (r.store_id && accessibleStoreIds.includes(r.store_id)) ||
        r.user_id === claims.sub
    );
    return reply.send(filteredRoles);
  });

  app.get('/rest/v1/deliverer_stats', async (request, reply) => {
    const claims = authenticateRequest(request, reply, ['master']);
    if (!claims) return;

    const parsed = deliveriesQuerySchema.safeParse(request.query ?? {});
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationFailed', details: parsed.error.flatten() });
    }

    const deliveries = db.listDeliveries(parsed.data.store_id, parsed.data.deliverer_id);
    const stats = deliveries.reduce((acc, delivery) => {
      if (!delivery.deliverer_id) return acc;
      if (!acc[delivery.deliverer_id]) {
        acc[delivery.deliverer_id] = { total: 0, completed: 0 };
      }
      acc[delivery.deliverer_id].total += 1;
      if (delivery.status === 'delivered') {
        acc[delivery.deliverer_id].completed += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return reply.send(stats);
  });
}
