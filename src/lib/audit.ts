// ============================================================
// MEGA MART — Audit Logging
// Creates AuditLog entries for tracking user actions
// ============================================================

import { db } from '@/lib/db';

interface AuditLogInput {
  /** User performing the action (null for system/anonymous actions) */
  userId?: string | null;
  /** Action verb: e.g. 'create', 'update', 'delete', 'login', 'export' */
  action: string;
  /** Entity type: e.g. 'product', 'order', 'user', 'license' */
  entity: string;
  /** ID of the affected entity */
  entityId?: string | null;
  /** Additional details (will be JSON-stringified if object) */
  details?: Record<string, unknown> | string | null;
  /** IP address of the client */
  ipAddress?: string | null;
}

/**
 * Write an audit log entry to the database.
 *
 * This is fire-and-forget — errors are logged to console
 * but do not throw, to avoid disrupting the main operation.
 */
export async function auditLog(input: AuditLogInput): Promise<void> {
  try {
    const detailsStr = input.details
      ? typeof input.details === 'string'
        ? input.details
        : JSON.stringify(input.details)
      : null;

    await db.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        details: detailsStr,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (error) {
    // Audit logging should never break the main operation
    console.error('[AUDIT LOG ERROR]', error);
  }
}

/**
 * Retrieve audit logs with pagination.
 */
export async function getAuditLogs(options: {
  entity?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const { entity, entityId, userId, limit = 50, offset = 0 } = options;

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return { logs, total, limit, offset };
}
