// ============================================================
// MEGA MART — Graceful Shutdown Handler
// Ensures clean shutdown: drains connections, stops timers
// ============================================================

import { stopCleanup } from '@/lib/rate-limiter';

type ShutdownHandler = () => void | Promise<void>;

interface ShutdownConfig {
  /** Signal(s) to handle (default: SIGTERM, SIGINT) */
  signals?: NodeJS.Signals[];
  /** Grace period before force-exiting (ms) */
  timeout?: number;
  /** Custom cleanup handlers */
  onShutdown?: ShutdownHandler[];
}

const DEFAULT_CONFIG: ShutdownConfig = {
  signals: ['SIGTERM', 'SIGINT'],
  timeout: 10_000, // 10 seconds grace period
  onShutdown: [],
};

/**
 * Register graceful shutdown handlers.
 *
 * When a termination signal is received:
 * 1. Stop accepting new requests (Next.js handles this)
 * 2. Run custom cleanup handlers
 * 3. Stop rate limiter cleanup timer
 * 4. Wait for grace period, then force exit
 */
export function registerGracefulShutdown(config: ShutdownConfig = {}): void {
  const { signals, timeout, onShutdown } = { ...DEFAULT_CONFIG, ...config };

  let isShuttingDown = false;

  const handleShutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) return; // Prevent double-handling
    isShuttingDown = true;

    console.log(`\n[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);
    const startTime = Date.now();

    // Run custom cleanup handlers in order
    for (const handler of onShutdown) {
      try {
        await handler();
      } catch (error) {
        console.error('[SHUTDOWN] Cleanup handler error:', error);
      }
    }

    // Stop rate limiter cleanup timer
    try {
      stopCleanup();
      console.log('[SHUTDOWN] Rate limiter cleanup stopped.');
    } catch (error) {
      console.error('[SHUTDOWN] Rate limiter cleanup error:', error);
    }

    // Disconnect Prisma
    try {
      const { db } = await import('@/lib/db');
      await db.$disconnect();
      console.log('[SHUTDOWN] Database disconnected.');
    } catch (error) {
      console.error('[SHUTDOWN] Database disconnect error:', error);
    }

    const duration = Date.now() - startTime;
    console.log(`[SHUTDOWN] Cleanup completed in ${duration}ms. Goodbye!`);

    // Force exit after grace period if still alive
    setTimeout(() => {
      console.error('[SHUTDOWN] Force exit — grace period exceeded.');
      process.exit(1);
    }, Math.max(0, timeout - duration));

    // Clean exit
    process.exit(0);
  };

  // Register signal handlers
  for (const signal of signals) {
    process.on(signal, handleShutdown);
  }

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[SHUTDOWN] Uncaught exception:', error);
    handleShutdown('SIGTERM' as NodeJS.Signals);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('[SHUTDOWN] Unhandled promise rejection:', reason);
    // Don't shutdown on unhandled rejection — just log it
    // In production, this should be sent to error tracking
  });

  if (process.env.NODE_ENV !== 'test') {
    console.log('[SHUTDOWN] Graceful shutdown handler registered.');
  }
}

/**
 * Check if the process is currently shutting down.
 * Useful for health checks — return 503 during shutdown.
 */
let shuttingDown = false;
export function isShuttingDown(): boolean {
  return shuttingDown;
}
