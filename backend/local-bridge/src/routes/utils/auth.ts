import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../../env.js';
import type { LocalRole } from '../../db/index.js';
import { db } from '../../db/index.js';

export type Role = LocalRole['role'] | 'any' | 'supabase-sync';

export interface AccessClaims extends jwt.JwtPayload {
  sub: string;
  email: string;
  role: Role;
  store_id?: string | null;
}

export function getAccessibleStoreIds(claims: AccessClaims): string[] {
  if (claims.role === 'master') {
    const ownedStores = db.listStores(claims.sub);
    const ownedIds = ownedStores.map((s) => s.id);
    const userRoles = db.getRolesForUser(claims.sub);
    const roleStoreIds = userRoles
      .map((r) => r.store_id)
      .filter((id): id is string => Boolean(id));
    const all = Array.from(new Set([...ownedIds, ...roleStoreIds]));
    if (all.length === 0 && claims.store_id) {
      all.push(claims.store_id);
    }
    return all;
  } else {
    const userRoles = db.getRolesForUser(claims.sub);
    const roleStoreIds = userRoles
      .map((r) => r.store_id)
      .filter((id): id is string => Boolean(id));
    if (roleStoreIds.length === 0 && claims.store_id) {
      roleStoreIds.push(claims.store_id);
    }
    return Array.from(new Set(roleStoreIds));
  }
}

export function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply,
  allowedRoles?: Role[]
): AccessClaims | undefined {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing bearer token.',
    });
    return undefined;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, env.jwtSecret) as AccessClaims;
    if (payload.role === 'supabase-sync') {
      return payload;
    }
    if (
      allowedRoles &&
      !allowedRoles.includes('any') &&
      !allowedRoles.includes(payload.role)
    ) {
      reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient role to perform this action.',
      });
      return undefined;
    }
    return payload;
  } catch (err) {
    request.log.warn({ err }, 'Failed to verify token');
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token.',
    });
    return undefined;
  }
}
