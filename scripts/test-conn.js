const https = require('https');

const url = 'https://gbphrsbunholnhvwmvff.supabase.co';

console.log(`Testing connection to ${url}...`);

const start = Date.now();

https.get(url, (res) => {
    console.log('statusCode:', res.statusCode);
    console.log('headers:', res.headers);
    console.log('Time taken:', Date.now() - start, 'ms');

    res.on('data', (d) => {
        // consume data
    });

}).on('error', (e) => {
    console.error('Error:', e);
});
