const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Helper to load env vars from .env.local
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      const env = {};
      for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          env[key] = value;
        }
      }
      return env;
    }
  } catch (e) {
    console.error('Error loading .env.local:', e);
  }
  return {};
}

const env = loadEnv();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const STATE_FILE = path.join(__dirname, 'monitor-state.json');

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkOrders() {
  // Load state
  let lastChecked = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let notifiedIds = [];
  
  if (fs.existsSync(STATE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      if (state.lastChecked) lastChecked = state.lastChecked;
      if (state.notifiedIds) notifiedIds = state.notifiedIds;
    } catch (e) {
      console.error('Error reading state file, using defaults.');
    }
  }

  // Fetch orders created after last check
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .gt('created_at', lastChecked)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching orders:', error.message);
    process.exit(1);
  }

  if (!orders || orders.length === 0) {
    console.log(JSON.stringify([]));
    updateState(new Date().toISOString(), notifiedIds);
    return;
  }

  // Filter out already notified
  const newOrders = orders.filter(o => !notifiedIds.includes(o.id));

  if (newOrders.length === 0) {
    console.log(JSON.stringify([]));
    const latestTime = orders[orders.length - 1].created_at;
    updateState(latestTime, notifiedIds);
    return;
  }

  // Output new orders
  console.log(JSON.stringify(newOrders));

  // Update state
  const newIds = newOrders.map(o => o.id);
  const allNotifiedIds = [...notifiedIds, ...newIds].slice(-100);
  const latestTime = newOrders[newOrders.length - 1].created_at;
  updateState(latestTime, allNotifiedIds);
}

function updateState(time, ids) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastChecked: time, notifiedIds: ids }, null, 2));
}

checkOrders();
