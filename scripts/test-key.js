const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://gbphrsbunholnhvwmvff.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdicGhyc2J1bmhvbG5odndtdmZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg2NjYzMCwiZXhwIjoyMDg1NDQyNjMwfQ.25DeU3PnFbfOhw1Lw1TaMUyszEr6BAAwKlOeZZrDc3U';

console.log('Testing connection to:', SUPABASE_URL);
console.log('Using Key (length):', SERVICE_KEY.length);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function test() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success! Data:', data);
  }
}

test();
