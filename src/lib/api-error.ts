// ============================================================
// MEGA MART — Standardized API Error Handler
// Consistent error responses across all API routes
// ============================================================

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// ──────────────────────────────────────────────
// Error Types
// ──────────────────────────────────────────────
export enum ApiErrorCode {
  // Client errors (4xx)
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',

  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// ──────────────────────────────────────────────
// API Error Class
// ──────────────────────────────────────────────
export class ApiError extends Error {
  code: ApiErrorCode;
  statusCode: number;
  details?: unknown;
  isOperational: boolean;

  constructor(
    code: ApiErrorCode,
    message: string,
    statusCode: number,
    details?: unknown,
    isOperational = true,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  // Convenience constructors
  static badRequest(message: string, details?: unknown) {
    return new ApiError(ApiErrorCode.BAD_REQUEST, message, 400, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(ApiErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(ApiErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(entity: string, id?: string) {
    const message = id ? `${entity} with ID "${id}" not found` : `${entity} not found`;
    return new ApiError(ApiErrorCode.NOT_FOUND, message, 404);
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError(ApiErrorCode.CONFLICT, message, 409, details);
  }

  static validationError(error: ZodError) {
    const formatted = error.flatten();
    return new ApiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Input validation failed',
      422,
      {
        fieldErrors: formatted.fieldErrors,
        formErrors: formatted.formErrors,
      },
    );
  }

  static rateLimited(retryAfter?: number) {
    return new ApiError(
      ApiErrorCode.RATE_LIMITED,
      'Too many requests. Please try again later.',
      429,
      retryAfter ? { retryAfter } : undefined,
    );
  }

  static internal(message = 'An internal server error occurred', details?: unknown) {
    return new ApiError(ApiErrorCode.INTERNAL_ERROR, message, 500, details, false);
  }

  static databaseError(message = 'Database operation failed') {
    return new ApiError(ApiErrorCode.DATABASE_ERROR, message, 503);
  }

  static serviceUnavailable(service: string) {
    return new ApiError(
      ApiErrorCode.SERVICE_UNAVAILABLE,
      `${service} is currently unavailable. Please try again later.`,
      503,
    );
  }
}

// ──────────────────────────────────────────────
// Error Response Formatter
// ──────────────────────────────────────────────
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
  };
}

function formatErrorResponse(
  apiError: ApiError,
  includeDetails: boolean = true,
): ErrorResponse {
  return {
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(includeDetails && apiError.details ? { details: apiError.details } : {}),
      timestamp: new Date().toISOString(),
    },
  };
}

// ──────────────────────────────────────────────
// Main Error Handler
// ──────────────────────────────────────────────
/**
 * Handle API errors and return standardized NextResponse.
 *
 * Usage in API routes:
 * ```ts
 * try {
 *   // ... business logic
 * } catch (error) {
 *   return handleApiError(error);
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse {
  // Known ApiError — return structured response
  if (error instanceof ApiError) {
    const isDev = process.env.NODE_ENV === 'development';

    // Log non-operational errors (bugs) more prominently
    if (!error.isOperational) {
      console.error('[API ERROR] Non-operational error:', error);
    } else {
      console.warn(`[API] ${error.code} (${error.statusCode}): ${error.message}`);
    }

    return NextResponse.json(
      formatErrorResponse(error, isDev || error.isOperational),
      { status: error.statusCode },
    );
  }

  // ZodError — convert to ApiError
  if (error instanceof ZodError) {
    const apiError = ApiError.validationError(error);
    console.warn(`[API] VALIDATION_ERROR (422): Input validation failed`);
    return NextResponse.json(
      formatErrorResponse(apiError),
      { status: 422 },
    );
  }

  // Prisma known errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: unknown; message?: string };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          formatErrorResponse(
            ApiError.conflict('A record with this value already exists', prismaError.meta),
          ),
          { status: 409 },
        );

      case 'P2025': // Record not found
        return NextResponse.json(
          formatErrorResponse(ApiError.notFound('Record')),
          { status: 404 },
        );

      case 'P2003': // Foreign key constraint failed
        return NextResponse.json(
          formatErrorResponse(
            ApiError.badRequest('Referenced record does not exist', prismaError.meta),
          ),
          { status: 400 },
        );

      case 'P2014': // Required relation violation
        return NextResponse.json(
          formatErrorResponse(
            ApiError.badRequest('Required relation is missing', prismaError.meta),
          ),
          { status: 400 },
        );

      default:
        console.error('[API ERROR] Prisma error:', prismaError);
        return NextResponse.json(
          formatErrorResponse(ApiError.databaseError()),
          { status: 503 },
        );
    }
  }

  // Unknown errors — log and return generic 500
  console.error('[API ERROR] Unexpected error:', error);

  const internalError = ApiError.internal();
  return NextResponse.json(
    formatErrorResponse(internalError, false),
    { status: 500 },
  );
}

// ──────────────────────────────────────────────
// Success Response Helper
// ──────────────────────────────────────────────
/**
 * Create a standardized success response.
 */
export function apiSuccess<T>(
  data: T,
  options: {
    status?: number;
    meta?: Record<string, unknown>;
  } = {},
): NextResponse {
  const { status = 200, meta } = options;

  const response = meta
    ? { data, meta }
    : { data };

  return NextResponse.json(response, { status });
}

/**
 * Create a paginated success response.
 */
export function apiPaginated<T>(
  data: T[],
  options: {
    total: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  },
): NextResponse {
  const { total, page = 1, limit = 20, hasMore } = options;

  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: hasMore ?? page * limit < total,
    },
  });
}

// ──────────────────────────────────────────────
// Async Route Wrapper
// ──────────────────────────────────────────────
/**
 * Wrap an async API route handler with automatic error handling.
 *
 * Usage:
 * ```ts
 * export const GET = asyncRoute(async (request) => {
 *   const data = await fetchData();
 *   return apiSuccess(data);
 * });
 * ```
 */
export function asyncRoute(
  handler: (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse>,
): (request: Request, context?: { params: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
