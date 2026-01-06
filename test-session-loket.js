// Test single session with correct credentials
async function testSingleSession() {
    console.log('🔍 Testing Single Session Enforcement with loket1\n');

    const baseUrl = 'http://localhost:3000';
    const credentials = { username: 'loket1', password: 'password' };

    // Test 1: Login from "Device A"
    console.log('📱 Device A: Logging in as loket1...');
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    const cookiesA = loginA.headers.get('set-cookie');
    const dataA = await loginA.json();

    console.log('✅ Device A Login:', {
        status: loginA.status,
        sessionId: dataA.data?.sessionExpiresAt ? 'Present' : 'Missing',
        hasCookie: !!cookiesA
    });

    // Extract token from cookie
    const tokenA = cookiesA?.match(/token=([^;]+)/)?.[1];

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Login from "Device B" (same user)
    console.log('\n📱 Device B: Logging in as loket1 (same user)...');
    const loginB = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    const cookiesB = loginB.headers.get('set-cookie');
    const dataB = await loginB.json();

    console.log('✅ Device B Login:', {
        status: loginB.status,
        sessionId: dataB.data?.sessionExpiresAt ? 'Present' : 'Missing',
        hasCookie: !!cookiesB
    });

    const tokenB = cookiesB?.match(/token=([^;]+)/)?.[1];

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Try to access protected route from Device A
    console.log('\n📱 Device A: Trying to access /counter/loket-1 page...');
    const accessA = await fetch(`${baseUrl}/counter/loket-1`, {
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
            console.log('\n✅ SUCCESS! Device A was redirected to login with session_invalidated');
            console.log('🎉 Single session enforcement is WORKING!');
        } else {
            console.log('\n⚠️ Device A was redirected but not with session_invalidated reason');
            console.log('Redirect URL:', redirectUrl);
        }
    } else if (accessA.status === 200) {
        console.log('\n❌ FAIL! Device A can still access the page (single session not working)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('Summary:');
    console.log('- Device A token:', tokenA ? 'Present' : 'Missing');
    console.log('- Device B token:', tokenB ? 'Present' : 'Missing');
    console.log('- Single session working:', (accessA.status === 307 || accessA.status === 302) && accessA.headers.get('location')?.includes('session_invalidated') ? 'YES ✅' : 'NO ❌');
}

testSingleSession().catch(console.error);
