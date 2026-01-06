/**
 * Simple Test: Single Session Enforcement
 */

const BASE_URL = 'http://localhost:3000';

async function test() {
    console.log('🧪 Testing Single Session\n');

    // Login 1
    console.log('1️⃣ Login Device A...');
    const r1 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'password' })
    });
    const d1 = await r1.json();
    const token1 = r1.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
    console.log('✅ Token A:', token1?.substring(0, 20) + '...\n');

    await new Promise(r => setTimeout(r, 500));

    // Login 2 (same user)
    console.log('2️⃣ Login Device B (same user)...');
    const r2 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'password' })
    });
    const d2 = await r2.json();
    const token2 = r2.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
    console.log('✅ Token B:', token2?.substring(0, 20) + '...\n');

    await new Promise(r => setTimeout(r, 500));

    // Test Token A (should fail)
    console.log('3️⃣ Test Token A (should FAIL)...');
    const t1 = await fetch(`${BASE_URL}/api/master/doctors`, {
        headers: { 'Cookie': `token=${token1}` }
    });

    console.log('   Status:', t1.status);
    console.log('   Content-Type:', t1.headers.get('content-type'));

    try {
        const result1 = await t1.json();
        if (t1.ok) {
            console.log('   ❌ FAIL - Token A still works!');
        } else {
            console.log('   ✅ PASS - Token A rejected:', result1.error);
        }
    } catch (e) {
        console.log('   Response is not JSON (might be redirect)');
        console.log('   ⚠️ Need to check withRoles implementation\n');
    }

    // Test Token B (should succeed)
    console.log('\n4️⃣ Test Token B (should SUCCEED)...');
    const t2 = await fetch(`${BASE_URL}/api/master/doctors`, {
        headers: { 'Cookie': `token=${token2}` }
    });

    console.log('   Status:', t2.status);
    console.log('   Content-Type:', t2.headers.get('content-type'));

    try {
        const result2 = await t2.json();
        if (t2.ok) {
            console.log('   ✅ PASS - Token B works! Got', result2.data?.length || 0, 'doctors');
        } else {
            console.log('   ❌ FAIL - Token B rejected:', result2.error);
        }
    } catch (e) {
        console.log('   Response is not JSON (might be redirect)');
    }
}

test().catch(console.error);
