import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Enable Realtime replication for the orders table
// This adds the table to the supabase_realtime publication
const { error } = await supabase.rpc('exec_sql', {
    sql: `ALTER PUBLICATION supabase_realtime ADD TABLE orders;`
});

if (error) {
    // Try direct query approach
    console.log('RPC failed, trying direct approach...');
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: `ALTER PUBLICATION supabase_realtime ADD TABLE orders;` })
    });
    console.log('Response status:', res.status);
} else {
    console.log('✅ Realtime replication enabled for orders table!');
}

// Verify current realtime tables
const { data: tables } = await supabase
    .from('pg_publication_tables')
    .select('tablename')
    .eq('pubname', 'supabase_realtime');

console.log('Tables in supabase_realtime publication:', tables);
