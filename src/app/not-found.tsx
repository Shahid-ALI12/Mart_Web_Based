'use client';

// ============================================================
// MEGA MART — Professional 404 Not Found Page
// Green theme with Mega Mart branding
// ============================================================

import Link from 'next/link';
import { ShoppingBag, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-50 opacity-60" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-50 opacity-60" />
      </div>

      <div className="relative z-10 text-center max-w-lg">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Mega Mart</span>
        </div>

        {/* 404 Number */}
        <div className="mb-6">
          <span className="text-[120px] sm:text-[160px] font-black leading-none text-emerald-600 opacity-20 select-none">
            404
          </span>
        </div>

        {/* Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 text-base sm:text-lg mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back to shopping!
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 min-w-[180px] justify-center"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors min-w-[180px] justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
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
