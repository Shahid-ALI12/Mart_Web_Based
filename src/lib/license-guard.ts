// ============================================================
// MEGA MART — License & Feature Guard
// Checks store license validity and feature availability
// ============================================================

import { db } from '@/lib/db';

interface LicenseCheckResult {
  valid: boolean;
  plan: string;
  features: Record<string, boolean>;
  status: string;
  message: string;
}

/**
 * Check whether a store has a valid, non-expired license.
 *
 * A license is invalid if:
 * - No license record exists for the store
 * - Status is EXPIRED, CANCELLED, or SUSPENDED
 * - Status is TRIAL and the trial period has ended
 * - Status is PAST_DUE
 * - Status is ACTIVE but expiresAt is in the past
 */
export async function checkLicense(storeId: string): Promise<LicenseCheckResult> {
  try {
    const license = await db.license.findUnique({
      where: { storeId },
    });

    if (!license) {
      return {
        valid: false,
        plan: 'none',
        features: {},
        status: 'missing',
        message: 'No license found for this store. Please activate a license.',
      };
    }

    const now = new Date();

    // Parse features JSON
    let features: Record<string, boolean> = {};
    try {
      features = JSON.parse(license.features);
    } catch {
      features = {};
    }

    // Check for hard-invalid statuses
    if (license.status === 'EXPIRED') {
      return {
        valid: false,
        plan: license.plan,
        features,
        status: 'expired',
        message: 'License has expired. Please renew your subscription.',
      };
    }

    if (license.status === 'CANCELLED') {
      return {
        valid: false,
        plan: license.plan,
        features,
        status: 'cancelled',
        message: 'License has been cancelled. Contact support to reactivate.',
      };
    }

    if (license.status === 'SUSPENDED') {
      return {
        valid: false,
        plan: license.plan,
        features,
        status: 'suspended',
        message: 'License is suspended. Contact support for assistance.',
      };
    }

    if (license.status === 'PAST_DUE') {
      return {
        valid: false,
        plan: license.plan,
        features,
        status: 'past_due',
        message: 'Subscription payment is past due. Please update your payment method.',
      };
    }

    // Check trial expiration
    if (license.status === 'TRIAL') {
      if (license.trialEndsAt && license.trialEndsAt < now) {
        return {
          valid: false,
          plan: license.plan,
          features,
          status: 'trial_expired',
          message: 'Trial period has ended. Please upgrade to a paid plan.',
        };
      }
      // Trial is still active
      return {
        valid: true,
        plan: license.plan,
        features,
        status: 'trial',
        message: 'Trial license is active.',
      };
    }

    // Status is ACTIVE — check expiration date
    if (license.status === 'ACTIVE') {
      if (license.expiresAt && license.expiresAt < now) {
        return {
          valid: false,
          plan: license.plan,
          features,
          status: 'expired',
          message: 'License expiration date has passed. Please renew.',
        };
      }

      return {
        valid: true,
        plan: license.plan,
        features,
        status: 'active',
        message: 'License is active and valid.',
      };
    }

    // Unknown status — deny by default
    return {
      valid: false,
      plan: license.plan,
      features,
      status: 'unknown',
      message: `Unknown license status: ${license.status}`,
    };
  } catch (error) {
    return {
      valid: false,
      plan: 'none',
      features: {},
      status: 'error',
      message: `License check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if a specific feature is enabled for a store's license.
 *
 * @param storeId  - The store ID to check
 * @param feature  - The feature key (e.g. 'pos', 'multiStore', 'advancedReports')
 * @returns        - true if the license is valid AND the feature is enabled
 */
export async function checkFeature(storeId: string, feature: string): Promise<boolean> {
  const { valid, features } = await checkLicense(storeId);

  if (!valid) return false;

  return features[feature] === true;
}
