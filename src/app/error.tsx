'use client';

// ============================================================
// MEGA MART — Error Boundary Page
// Green theme with Mega Mart branding
// ============================================================

import Link from 'next/link';
import { ShoppingBag, RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-red-50 opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-50 opacity-40" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Mega Mart</span>
        </div>

        {/* Error icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Something Went Wrong
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-2 max-w-sm mx-auto">
          An unexpected error occurred. Our team has been notified and is working on a fix.
        </p>

        {/* Error details (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 mb-6 p-4 bg-gray-50 rounded-xl text-left max-w-sm mx-auto">
            <p className="text-xs font-mono text-red-600 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-400 mt-1">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 min-w-[180px] justify-center"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors min-w-[180px] justify-center"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
        </div>

        {/* Help text */}
        <p className="mt-10 text-sm text-gray-400">
          Need help? Contact{' '}
          <a
            href="mailto:support@megamart.com"
            className="text-emerald-600 hover:underline"
          >
            support@megamart.com
          </a>
        </p>
      </div>
    </div>
  );
}
