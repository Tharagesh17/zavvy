/**
 * Feature Flag System
 * 
 * Controls which features are enabled in different environments.
 * All Pro features are OFF by default in development.
 * Admin can toggle features for testing.
 */

import React from 'react';

export type FeatureName = 
  // Core Features (Always ON)
  | 'AUTH'
  | 'PRODUCTS'
  | 'ORDERS'
  | 'BASIC_WHATSAPP'
  | 'BASIC_ANALYTICS'
  
  // Pro Features (Toggle during development)
  | 'SUBDOMAIN'
  | 'AI_WHATSAPP'
  | 'ADVANCED_ANALYTICS'
  | 'BULK_ACTIONS'
  | 'INVENTORY_ALERTS'
  | 'ORDER_WORKFLOWS'
  | 'CUSTOM_DOMAIN'
  | 'TEAM_MANAGEMENT'
  
  // Support System (Toggle during development)
  | 'FAQ'
  | 'CHATBOT'
  | 'EMAIL_SUPPORT'
  | 'WHATSAPP_SUPPORT'
  
  // Integrations (Toggle during development)
  | 'SHIPROCKET'
  | 'RAZORPAY_SUBSCRIPTION'
  | 'INTERAKT_API';

// Feature configuration interface
interface FeatureConfig {
  enabled: boolean;
  tier: 'core' | 'pro' | 'enterprise' | 'support' | 'integration';
  description: string;
  eta?: string;
}

// Default feature states
export const FEATURES: Record<FeatureName, FeatureConfig> = {
  // Core - Always enabled
  AUTH: {
    enabled: true,
    tier: 'core',
    description: 'Authentication and user management'
  },
  PRODUCTS: {
    enabled: true,
    tier: 'core',
    description: 'Product management'
  },
  ORDERS: {
    enabled: true,
    tier: 'core',
    description: 'Order management'
  },
  BASIC_WHATSAPP: {
    enabled: true,
    tier: 'core',
    description: 'Basic rule-based WhatsApp templates'
  },
  BASIC_ANALYTICS: {
    enabled: true,
    tier: 'core',
    description: 'Basic statistics and counts'
  },
  
  // Pro Features - Disabled in development
  SUBDOMAIN: {
    enabled: false,
    tier: 'pro',
    description: 'Custom subdomain (yourstore.zavvy.app)',
    eta: 'Week 2'
  },
  AI_WHATSAPP: {
    enabled: false,
    tier: 'pro',
    description: 'AI-powered WhatsApp messages with Kimi API',
    eta: 'Week 3'
  },
  ADVANCED_ANALYTICS: {
    enabled: false,
    tier: 'pro',
    description: 'Charts, reports, and AI insights',
    eta: 'Week 4'
  },
  BULK_ACTIONS: {
    enabled: false,
    tier: 'pro',
    description: 'Bulk operations on products and orders',
    eta: 'Week 5'
  },
  INVENTORY_ALERTS: {
    enabled: false,
    tier: 'pro',
    description: 'Low stock alerts and auto-pause',
    eta: 'Week 5'
  },
  ORDER_WORKFLOWS: {
    enabled: false,
    tier: 'pro',
    description: 'Custom order statuses and workflows',
    eta: 'Week 6'
  },
  CUSTOM_DOMAIN: {
    enabled: false,
    tier: 'pro',
    description: 'Full custom domain (yourstore.com)',
    eta: 'Week 7'
  },
  TEAM_MANAGEMENT: {
    enabled: false,
    tier: 'pro',
    description: 'Team members and role-based access',
    eta: 'Week 8'
  },
  
  // Support System - Disabled in development
  FAQ: {
    enabled: false,
    tier: 'support',
    description: 'FAQ system with search',
    eta: 'Week 7'
  },
  CHATBOT: {
    enabled: false,
    tier: 'support',
    description: 'AI chatbot for support',
    eta: 'Week 8'
  },
  EMAIL_SUPPORT: {
    enabled: false,
    tier: 'support',
    description: 'Email ticket system',
    eta: 'Week 8'
  },
  WHATSAPP_SUPPORT: {
    enabled: false,
    tier: 'support',
    description: 'WhatsApp support for Pro users',
    eta: 'Week 9'
  },
  
  // Integrations - Disabled in development
  SHIPROCKET: {
    enabled: false,
    tier: 'integration',
    description: 'Shiprocket shipping integration',
    eta: 'Week 6'
  },
  RAZORPAY_SUBSCRIPTION: {
    enabled: false,
    tier: 'integration',
    description: 'Razorpay subscription payments',
    eta: 'Week 10'
  },
  INTERAKT_API: {
    enabled: false,
    tier: 'integration',
    description: 'Interakt WhatsApp API for automation',
    eta: 'Week 9'
  }
};

// Runtime feature overrides (for development testing)
const runtimeOverrides: Partial<Record<FeatureName, boolean>> = {};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureName): boolean {
  // Check runtime override first (for development)
  if (feature in runtimeOverrides) {
    return runtimeOverrides[feature]!;
  }
  
  // Check environment variable override
  const envOverride = process.env[`NEXT_PUBLIC_FEATURE_${feature}`];
  if (envOverride !== undefined) {
    return envOverride === 'true';
  }
  
  // Return default configuration
  return FEATURES[feature].enabled;
}

/**
 * Enable/disable feature for testing (development only)
 */
export function toggleFeature(feature: FeatureName, enabled: boolean): void {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Feature toggling only available in development');
    return;
  }
  
  runtimeOverrides[feature] = enabled;
  console.log(`[DEV] Feature ${feature} ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Get all features with their status
 */
export function getAllFeatures(): Record<FeatureName, FeatureConfig & { currentStatus: boolean }> {
  const result = {} as Record<FeatureName, FeatureConfig & { currentStatus: boolean }>;
  
  for (const [key, config] of Object.entries(FEATURES)) {
    result[key as FeatureName] = {
      ...config,
      currentStatus: isFeatureEnabled(key as FeatureName)
    };
  }
  
  return result;
}

/**
 * Get features by tier
 */
export function getFeaturesByTier(tier: FeatureConfig['tier']): FeatureName[] {
  return Object.entries(FEATURES)
    .filter(([, config]) => config.tier === tier)
    .map(([key]) => key as FeatureName);
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_APP_ENV === 'development';
}

/**
 * Feature guard component helper
 */
export function featureGuard<T extends object>(
  feature: FeatureName,
  enabledComponent: React.ComponentType<T>,
  disabledComponent?: React.ComponentType<T>
): React.ComponentType<T> {
  return function GuardedComponent(props: T) {
    if (isFeatureEnabled(feature)) {
      return React.createElement(enabledComponent, props);
    }
    
    if (disabledComponent) {
      return React.createElement(disabledComponent, props);
    }
    
    return null;
  };
}

// React hook for feature flags
import { useState, useEffect } from 'react';

export function useFeature(feature: FeatureName): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(feature));
  
  useEffect(() => {
    // Re-check on mount (for SSR compatibility)
    setEnabled(isFeatureEnabled(feature));
  }, [feature]);
  
  return enabled;
}
