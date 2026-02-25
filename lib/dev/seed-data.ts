/**
 * Development Environment Configuration
 * 
 * Mock data, test utilities, and development helpers
 */

// Mock seller data for development
export const MOCK_SELLERS = [
  {
    id: 'dev-seller-1',
    email: 'dev1@zavvy.local',
    phone: '+919999999991',
    business_name: 'Test Store One',
    tier: 'free',
    subdomain: null,
  },
  {
    id: 'dev-seller-2',
    email: 'dev2@zavvy.local',
    phone: '+919999999992',
    business_name: 'Test Store Pro',
    tier: 'pro',
    subdomain: 'testpro',
  },
  {
    id: 'admin-seller',
    email: 'admin@zavvy.local',
    phone: '+919999999999',
    business_name: 'Admin Store',
    tier: 'pro',
    subdomain: 'admin',
    is_admin: true,
  }
];

// Mock products
export const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    seller_id: 'dev-seller-1',
    name: 'Blue Cotton T-Shirt',
    description: 'Comfortable cotton t-shirt in blue color',
    price: 49900, // ₹499 in paise
    stock: 50,
    images: ['https://placehold.co/400x400/3B82F6/FFFFFF?text=Blue+Tee'],
    is_active: true,
  },
  {
    id: 'prod-2',
    seller_id: 'dev-seller-1',
    name: 'Red Hoodie',
    description: 'Warm hoodie for winter',
    price: 129900,
    stock: 3, // Low stock for testing alerts
    images: ['https://placehold.co/400x400/EF4444/FFFFFF?text=Hoodie'],
    is_active: true,
  },
  {
    id: 'prod-3',
    seller_id: 'dev-seller-2',
    name: 'Premium Sneakers',
    description: 'High quality running shoes',
    price: 299900,
    stock: 100,
    images: [
      'https://placehold.co/400x400/10B981/FFFFFF?text=Shoes+1',
      'https://placehold.co/400x400/059669/FFFFFF?text=Shoes+2'
    ],
    is_active: true,
  }
];

// Mock orders
export const MOCK_ORDERS = [
  {
    id: 'order-1',
    seller_id: 'dev-seller-1',
    product_id: 'prod-1',
    buyer_name: 'Rahul Sharma',
    buyer_phone: '+919876543210',
    buyer_address: {
      line1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    amount: 49900,
    payment_method: 'upi',
    payment_status: 'pending',
    order_status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: 'order-2',
    seller_id: 'dev-seller-1',
    product_id: 'prod-2',
    buyer_name: 'Priya Patel',
    buyer_phone: '+919876543211',
    buyer_address: {
      line1: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    amount: 129900,
    payment_method: 'cod',
    payment_status: 'pending',
    cod_status: 'pending_approval',
    order_status: 'pending',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    id: 'order-3',
    seller_id: 'dev-seller-2',
    product_id: 'prod-3',
    buyer_name: 'Amit Kumar',
    buyer_phone: '+919876543212',
    buyer_address: {
      line1: '789 Lake View',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    amount: 299900,
    payment_method: 'upi',
    payment_status: 'paid',
    order_status: 'confirmed',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  }
];

/**
 * Generate random test data
 */
export function generateTestOrder(overrides: Partial<typeof MOCK_ORDERS[0]> = {}) {
  const names = ['Amit', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Anjali'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune', 'Hyderabad'];
  
  return {
    id: `test-order-${Date.now()}`,
    buyer_name: names[Math.floor(Math.random() * names.length)],
    buyer_phone: `+9198${Math.floor(Math.random() * 100000000)}`,
    buyer_address: {
      line1: `${Math.floor(Math.random() * 1000)} Test Street`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: 'Test State',
      pincode: `${Math.floor(Math.random() * 900000) + 100000}`
    },
    amount: Math.floor(Math.random() * 50000) + 10000,
    payment_method: Math.random() > 0.5 ? 'upi' : 'cod',
    payment_status: 'pending',
    order_status: 'pending',
    created_at: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Development utilities
 */
export const devUtils = {
  // Log with development prefix
  log: (message: string, data?: unknown) => {
    console.log(`[DEV] ${message}`, data || '');
  },
  
  // Simulate API delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random ID
  generateId: (prefix: string = 'dev') => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  
  // Format currency for display
  formatCurrency: (paise: number) => `₹${(paise / 100).toFixed(2)}`,
  
  // Mock current user (for testing)
  getCurrentUser: () => MOCK_SELLERS[2], // Admin user
};
