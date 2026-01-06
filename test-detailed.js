/**
 * Detailed Test: Check what's happening with Token A
 */

const BASE_URL = 'http://localhost:3000';

async function detailedTest() {
    console.log('🔍 Detailed Test\n');

    // Login 1
    const r1 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'password' })
    });
    const token1 = r1.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
    const payload1 = JSON.parse(Buffer.from(token1.split('.')[1], 'base64').toString());
    console.log('1️⃣ Login A - Session:', payload1.sessionId.substring(0, 8) + '...');

    await new Promise(r => setTimeout(r, 500));

    // Login 2
    const r2 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'password' })
    });
    const token2 = r2.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
    const payload2 = JSON.parse(Buffer.from(token2.split('.')[1], 'base64').toString());
    console.log('2️⃣ Login B - Session:', payload2.sessionId.substring(0, 8) + '...\n');

    await new Promise(r => setTimeout(r, 500));

    // Test Token A with detailed logging
    console.log('3️⃣ Testing Token A...');
    const t1 = await fetch(`${BASE_URL}/api/master/doctors`, {
        headers: { 'Cookie': `token=${token1}` }
    });

    const text1 = await t1.text();
    console.log('   Status:', t1.status);
    console.log('   Content-Type:', t1.headers.get('content-type'));
    console.log('   Response length:', text1.length);
    console.log('   First 200 chars:', text1.substring(0, 200));

    // Check if it's HTML
    if (text1.startsWith('<!DOCTYPE') || text1.startsWith('<html')) {
        console.log('   ⚠️ Response is HTML page!');

        // Check if it's an error page or redirect
        if (text1.includes('unauthorized') || text1.includes('Unauthorized')) {
            console.log('   💡 Looks like unauthorized page');
        } else if (text1.includes('forbidden') || text1.includes('Forbidden')) {
            console.log('   💡 Looks like forbidden page');
        } else {
            console.log('   💡 Unknown HTML page - might be a Next.js page');
        }
    }

    console.log('\n4️⃣ Testing Token B...');
    const t2 = await fetch(`${BASE_URL}/api/master/doctors`, {
        headers: { 'Cookie': `token=${token2}` }
    });

    const text2 = await t2.text();
    console.log('   Status:', t2.status);
    console.log('   Content-Type:', t2.headers.get('content-type'));

    try {
        const json2 = JSON.parse(text2);
        console.log('   ✅ Valid JSON - Got', json2.data?.length || 0, 'doctors');
    } catch (e) {
        console.log('   ❌ Not valid JSON');
    }
}

detailedTest().catch(console.error);
