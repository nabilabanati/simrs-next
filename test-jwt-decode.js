// Test with JWT decode to see sessionId
const jwt = require('jsonwebtoken');

async function testWithJWTDecode() {
    console.log('🔍 Testing Single Session with JWT Decode\n');

    const baseUrl = 'http://localhost:3000';
    const credentials = { username: 'loket1', password: 'password' };

    // Login Device A
    console.log('📱 Device A: Logging in...');
    const loginA = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    const dataA = await loginA.json();
    const tokenA = dataA.data.token;

    // Decode token A
    const decodedA = jwt.decode(tokenA);
    console.log('Token A decoded:', {
        username: decodedA.username,
        sessionId: decodedA.sessionId,
        exp: new Date(decodedA.exp * 1000).toISOString()
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Login Device B
    console.log('\n📱 Device B: Logging in (same user)...');
    const loginB = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    const dataB = await loginB.json();
    const tokenB = dataB.data.token;

    // Decode token B
    const decodedB = jwt.decode(tokenB);
    console.log('Token B decoded:', {
        username: decodedB.username,
        sessionId: decodedB.sessionId,
        exp: new Date(decodedB.exp * 1000).toISOString()
    });

    console.log('\n🔍 Analysis:');
    console.log('- Session A ID:', decodedA.sessionId);
    console.log('- Session B ID:', decodedB.sessionId);
    console.log('- Are they different?', decodedA.sessionId !== decodedB.sessionId ? 'YES ✅' : 'NO ❌');

    console.log('\n💡 Expected behavior:');
    console.log('1. Session A should be invalidated in database (is_active = false)');
    console.log('2. Session B should be active (is_active = true)');
    console.log('3. When Device A tries to access with Token A, middleware should:');
    console.log('   - Decode Token A');
    console.log('   - Check session', decodedA.sessionId, 'in database');
    console.log('   - Find is_active = false');
    console.log('   - Redirect to login with session_invalidated');
}

testWithJWTDecode().catch(console.error);
