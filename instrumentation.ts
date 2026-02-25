export async function register() {
    // Only run this in Node.js runtime (not Edge or Browser)
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Force IPv4 DNS resolution — Supabase/Telegram APIs fail on IPv6 on some ISPs
        const { setDefaultResultOrder } = await import('node:dns');
        setDefaultResultOrder('ipv4first');
    }
}
