'use server';

/**
 * Development Server Actions
 * 
 * Server-side actions for development database operations
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { MOCK_PRODUCTS, MOCK_ORDERS } from './seed-data';

/**
 * Seed development database with mock data
 */
export async function seedDevelopmentData() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Seeding only available in development');
    return { success: false, error: 'Not in development mode' };
  }
  
  const supabase = createServiceRoleClient();
  
  try {
    // Clear existing test data
    await supabase.from('orders').delete().neq('id', 'placeholder');
    await supabase.from('product_links').delete().neq('id', 'placeholder');
    await supabase.from('products').delete().neq('id', 'placeholder');
    
    // Insert mock products
    for (const product of MOCK_PRODUCTS) {
      await supabase.from('products').upsert(product);
    }
    
    // Insert mock orders
    for (const order of MOCK_ORDERS) {
      await supabase.from('orders').upsert(order);
    }
    
    console.log('[DEV] Database seeded with mock data');
    return { success: true };
  } catch (error) {
    console.error('[DEV] Seeding failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Clear all development data
 */
export async function clearDevelopmentData() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Clearing only available in development');
    return { success: false, error: 'Not in development mode' };
  }
  
  const supabase = createServiceRoleClient();
  
  try {
    await supabase.from('orders').delete().neq('id', 'placeholder');
    await supabase.from('product_links').delete().neq('id', 'placeholder');
    await supabase.from('products').delete().neq('id', 'placeholder');
    
    console.log('[DEV] Development data cleared');
    return { success: true };
  } catch (error) {
    console.error('[DEV] Clear failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
