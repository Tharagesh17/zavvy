const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Config
const STATE_FILE = path.join(__dirname, 'monitor-state.json');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using Anon key for reading

if (!SUPABASE_URL || !API_KEY) {
  console.error('Error: Missing Supabase URL or Anon Key.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, API_KEY);

async function checkOrders() {
  // Load state
  let lastChecked = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Default: 24h ago
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
  // Note: Using 'created_at' filter.
  // We fetch a bit overlapping to be safe, then filter by ID.
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
    // Update timestamp anyway to now to avoid re-scanning old window forever
    updateState(new Date().toISOString(), notifiedIds);
    return;
  }

  // Filter out already notified
  const newOrders = orders.filter(o => !notifiedIds.includes(o.id));

  if (newOrders.length === 0) {
    console.log(JSON.stringify([]));
    // Update timestamp to the latest order time or now
    const latestTime = orders[orders.length - 1].created_at;
    updateState(latestTime, notifiedIds);
    return;
  }

  // Output new orders
  console.log(JSON.stringify(newOrders));

  // Update state
  const newIds = newOrders.map(o => o.id);
  const allNotifiedIds = [...notifiedIds, ...newIds].slice(-100); // Keep last 100 to prevent growth
  const latestTime = newOrders[newOrders.length - 1].created_at;
  updateState(latestTime, allNotifiedIds);
}

function updateState(time, ids) {
  fs.writeFileSync(STATE_FILE, JSON.stringify({ lastChecked: time, notifiedIds: ids }, null, 2));
}

checkOrders();
