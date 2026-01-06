// Test script to debug single session enforcement
// Run with: node test-session-debug.js

async function testSingleSession() {
    console.log('🔍 Testing Single Session Enforcement\n');

    const baseUrl = 'http://localhost:3000';

    // Test 1: Login from "Device A"
    console.log('📱 Device A: Logging in as dokter1...');
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'dokter1', password: 'password' }),
    });

    const cookiesA = loginA.headers.get('set-cookie');
    const dataA = await loginA.json();

    console.log('✅ Device A Login:', {
        status: loginA.status,
        sessionId: dataA.data?.user?.sessionId || 'No sessionId in response',
        hasCookie: !!cookiesA
    });

    // Extract token from cookie
    const tokenA = cookiesA?.match(/token=([^;]+)/)?.[1];

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Login from "Device B" (same user)
    console.log('\n📱 Device B: Logging in as dokter1 (same user)...');
    const loginB = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'dokter1', password: 'password' }),
    });

    const cookiesB = loginB.headers.get('set-cookie');
    const dataB = await loginB.json();

    console.log('✅ Device B Login:', {
        status: loginB.status,
        sessionId: dataB.data?.user?.sessionId || 'No sessionId in response',
        hasCookie: !!cookiesB
    });

    const tokenB = cookiesB?.match(/token=([^;]+)/)?.[1];

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Try to access protected route from Device A
    console.log('\n📱 Device A: Trying to access /doctor page...');
    const accessA = await fetch(`${baseUrl}/doctor`, {
        headers: {
            'Cookie': `token=${tokenA}`,
        },
        redirect: 'manual' // Don't follow redirects
    });

    console.log('🔍 Device A Access Result:', {
        status: accessA.status,
        redirected: accessA.status === 307 || accessA.status === 302,
        location: accessA.headers.get('location')
    });

    if (accessA.status === 307 || accessA.status === 302) {
        const redirectUrl = accessA.headers.get('location');
        if (redirectUrl?.includes('session_invalidated')) {
            console.log('✅ SUCCESS! Device A was redirected to login with session_invalidated');
        } else {
            console.log('❌ FAIL! Device A was redirected but not with session_invalidated reason');
        }
    } else if (accessA.status === 200) {
        console.log('❌ FAIL! Device A can still access the page (single session not working)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('- Device A token:', tokenA ? 'Present' : 'Missing');
    console.log('- Device B token:', tokenB ? 'Present' : 'Missing');
    console.log('- Single session working:', accessA.status === 307 || accessA.status === 302 ? 'YES ✅' : 'NO ❌');
}

testSingleSession().catch(console.error);
