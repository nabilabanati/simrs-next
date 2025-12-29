/**
 * Debug: Check session invalidation in database
 */

const BASE_URL = 'http://localhost:3000';

async function debugSession() {
    console.log('🔍 Debugging Session Invalidation\n');

    // Login 1
    console.log('1️⃣ Login Device A...');
    const r1 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'password' })
    });
    const d1 = await r1.json();
    const token1 = r1.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];

    // Decode JWT to see sessionId
    const payload1 = JSON.parse(Buffer.from(token1.split('.')[1], 'base64').toString());
    console.log('   Session ID:', payload1.sessionId);
    console.log('   User:', payload1.username);
    console.log('   Role:', payload1.role);

    await new Promise(r => setTimeout(r, 1000));

    // Login 2 (same user) - should invalidate session 1
    console.log('\n2️⃣ Login Device B (same user - should invalidate Device A)...');
    const r2 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'password' })
    });
    const d2 = await r2.json();
    const token2 = r2.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];

    const payload2 = JSON.parse(Buffer.from(token2.split('.')[1], 'base64').toString());
    console.log('   Session ID:', payload2.sessionId);
    console.log('   User:', payload2.username);

    console.log('\n📊 Summary:');
    console.log('   Session A ID:', payload1.sessionId);
    console.log('   Session B ID:', payload2.sessionId);
    console.log('   Are they different?', payload1.sessionId !== payload2.sessionId ? '✅ YES' : '❌ NO');

    console.log('\n💡 Next: Check database to see if Session A is marked as is_active=false');
    console.log('   Run this SQL query in Supabase:');
    console.log(`   SELECT id, user_id, is_active, created_at FROM sessions WHERE id IN ('${payload1.sessionId}', '${payload2.sessionId}') ORDER BY created_at;`);
}

debugSession().catch(console.error);
