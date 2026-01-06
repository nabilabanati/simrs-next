/**
 * Test Script: Single Session Enforcement
 * 
 * This script tests if the single session feature is working:
 * 1. Login from "Device A" (first login)
 * 2. Login from "Device B" (second login - should invalidate Device A)
 * 3. Try to access protected route with Device A token (should fail)
 * 4. Try to access protected route with Device B token (should succeed)
 */

const BASE_URL = 'http://localhost:3000';

// Helper to extract cookie from response
function extractCookie(setCookieHeader) {
    if (!setCookieHeader) return null;
    const tokenMatch = setCookieHeader.match(/token=([^;]+)/);
    return tokenMatch ? tokenMatch[1] : null;
}

async function testSingleSession() {
    console.log('🧪 Testing Single Session Enforcement\n');
    console.log('='.repeat(60));

    try {
        // ===== STEP 1: Login from Device A =====
        console.log('\n📱 STEP 1: Login from Device A');
        console.log('-'.repeat(60));

        const loginA = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Device-A-Chrome' },
            body: JSON.stringify({ username: 'imesho', password: 'password' })
        });

        const dataA = await loginA.json();
        const tokenA = extractCookie(loginA.headers.get('set-cookie'));

        if (!loginA.ok) {
            console.log('❌ Login Device A failed:', dataA.error);
            return;
        }

        console.log('✅ Login Device A successful');
        console.log('   User:', dataA.data.user.username);
        console.log('   Role:', dataA.data.user.role);
        console.log('   Token A:', tokenA ? tokenA.substring(0, 30) + '...' : 'Not found');

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ===== STEP 2: Login from Device B (same user) =====
        console.log('\n📱 STEP 2: Login from Device B (same user)');
        console.log('-'.repeat(60));

        const loginB = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': 'Device-B-Firefox' },
            body: JSON.stringify({ username: 'imesho', password: 'password' })
        });

        const dataB = await loginB.json();
        const tokenB = extractCookie(loginB.headers.get('set-cookie'));

        if (!loginB.ok) {
            console.log('❌ Login Device B failed:', dataB.error);
            return;
        }

        console.log('✅ Login Device B successful');
        console.log('   User:', dataB.data.user.username);
        console.log('   Token B:', tokenB ? tokenB.substring(0, 30) + '...' : 'Not found');
        console.log('   ⚠️  This should have invalidated Device A session!');

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));

        // ===== STEP 3: Try to access with Token A (should FAIL) =====
        console.log('\n🔒 STEP 3: Try to access protected route with Token A');
        console.log('-'.repeat(60));

        const testA = await fetch(`${BASE_URL}/api/master/doctors`, {
            headers: { 'Cookie': `token=${tokenA}` }
        });

        const resultA = await testA.json();

        if (testA.ok) {
            console.log('❌ FAIL: Token A still works! Single session NOT enforced');
            console.log('   Response:', resultA);
        } else {
            console.log('✅ PASS: Token A rejected!');
            console.log('   Error:', resultA.error);
            console.log('   This is CORRECT behavior - old session was invalidated');
        }

        // ===== STEP 4: Try to access with Token B (should SUCCEED) =====
        console.log('\n🔒 STEP 4: Try to access protected route with Token B');
        console.log('-'.repeat(60));

        const testB = await fetch(`${BASE_URL}/api/master/doctors`, {
            headers: { 'Cookie': `token=${tokenB}` }
        });

        const resultB = await testB.json();

        if (testB.ok) {
            console.log('✅ PASS: Token B works!');
            console.log('   This is CORRECT - new session is active');
        } else {
            console.log('❌ FAIL: Token B rejected!');
            console.log('   Error:', resultB.error);
            console.log('   This should NOT happen - new session should work');
        }

        // ===== SUMMARY =====
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));

        const step3Pass = !testA.ok;
        const step4Pass = testB.ok;

        console.log(`Step 3 (Old token rejected): ${step3Pass ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Step 4 (New token works):    ${step4Pass ? '✅ PASS' : '❌ FAIL'}`);

        if (step3Pass && step4Pass) {
            console.log('\n🎉 SINGLE SESSION ENFORCEMENT IS WORKING!');
        } else {
            console.log('\n⚠️  SINGLE SESSION ENFORCEMENT HAS ISSUES');
        }

    } catch (error) {
        console.error('\n❌ Test error:', error.message);
    }
}

// Run the test
testSingleSession();
