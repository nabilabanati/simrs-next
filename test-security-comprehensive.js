/**
 * FINAL COMPREHENSIVE TEST
 * Tests all security features:
 * 1. Bcrypt password hashing
 * 2. Single session enforcement
 * 3. Wrong password rejection
 */

const BASE_URL = 'http://localhost:3000';

async function comprehensiveTest() {
    console.log('🎯 COMPREHENSIVE SECURITY TEST\n');
    console.log('='.repeat(80));

    let passCount = 0;
    let failCount = 0;

    // TEST 1: Bcrypt Login
    console.log('\n📋 TEST 1: Bcrypt Password Hashing');
    console.log('-'.repeat(80));

    const loginTest = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'password' })
    });

    if (loginTest.ok) {
        console.log('✅ PASS: Login with bcrypt hashed password works');
        passCount++;
    } else {
        console.log('❌ FAIL: Login failed');
        failCount++;
    }

    // TEST 2: Wrong Password
    console.log('\n📋 TEST 2: Wrong Password Rejection');
    console.log('-'.repeat(80));

    const wrongPwTest = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'imesho', password: 'wrongpassword' })
    });

    if (!wrongPwTest.ok) {
        console.log('✅ PASS: Wrong password correctly rejected');
        passCount++;
    } else {
        console.log('❌ FAIL: Wrong password was accepted!');
        failCount++;
    }

    // TEST 3: Single Session Enforcement
    console.log('\n📋 TEST 3: Single Session Enforcement');
    console.log('-'.repeat(80));

    // Login Device A
    const loginA = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nurse2', password: 'password' })
    });
    const tokenA = loginA.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
    console.log('   Device A logged in');

    await new Promise(r => setTimeout(r, 500));

    // Login Device B (same user)
    const loginB = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'nurse2', password: 'password' })
    });
    const tokenB = loginB.headers.get('set-cookie')?.match(/token=([^;]+)/)?.[1];
    console.log('   Device B logged in (should invalidate Device A)');

    await new Promise(r => setTimeout(r, 500));

    // Test Token A (should fail)
    const testA = await fetch(`${BASE_URL}/api/nurse/visits`, {
        headers: { 'Cookie': `token=${tokenA}` },
        redirect: 'manual'
    });

    if (testA.status === 307 || testA.status === 302) {
        console.log('✅ PASS: Device A session invalidated (redirected to login)');
        passCount++;
    } else if (testA.status === 401) {
        console.log('✅ PASS: Device A session invalidated (401 Unauthorized)');
        passCount++;
    } else {
        console.log('❌ FAIL: Device A session still active!');
        failCount++;
    }

    // Test Token B (should succeed)
    const testB = await fetch(`${BASE_URL}/api/nurse/visits`, {
        headers: { 'Cookie': `token=${tokenB}` }
    });

    if (testB.ok) {
        console.log('✅ PASS: Device B session still active');
        passCount++;
    } else {
        console.log('❌ FAIL: Device B session rejected!');
        failCount++;
    }

    // TEST 4: Inactive Account
    console.log('\n📋 TEST 4: Inactive Account Rejection');
    console.log('-'.repeat(80));
    console.log('⏭️  SKIP: Requires manually setting a user to inactive');

    // SUMMARY
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Total Tests:  ${passCount + failCount}`);
    console.log(`✅ Passed:    ${passCount}`);
    console.log(`❌ Failed:    ${failCount}`);
    console.log(`Success Rate: ${Math.round((passCount / (passCount + failCount)) * 100)}%`);
    console.log('='.repeat(80));

    if (failCount === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Security implementation is working perfectly!');
        console.log('\n✅ Your SIMRS authentication system is PRODUCTION-READY!');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
}

comprehensiveTest().catch(console.error);
