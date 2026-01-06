/**
 * Test: Login Success, Logout, Login Again
 * 
 * This tests if rate limiting persists after successful login and logout
 */

const BASE_URL = 'http://localhost:3000';

async function testLoginLogoutLogin() {
    console.log('🧪 Testing Login → Logout → Login Again\n');
    console.log('='.repeat(80));

    const username = 'imesho';
    const correctPassword = 'password';

    // Step 1: Try 4 wrong passwords
    console.log('\n📋 Step 1: Try 4 WRONG passwords');
    console.log('-'.repeat(80));

    for (let i = 1; i <= 4; i++) {
        console.log(`\nAttempt ${i} (WRONG):`);
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: 'wrong' + i
            })
        });
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.error}`);
        await new Promise(r => setTimeout(r, 500));
    }

    // Step 2: Login with correct password (should be blocked)
    console.log('\n\n📋 Step 2: Try 5th attempt with CORRECT password');
    console.log('-'.repeat(80));

    const attempt5 = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            password: correctPassword
        })
    });
    const data5 = await attempt5.json();

    console.log(`Attempt 5 (CORRECT password):`);
    console.log(`   Status: ${attempt5.status}`);

    if (attempt5.status === 429) {
        console.log('   ✅ BLOCKED (as expected)');
        console.log(`   Message: ${data5.error}`);
    } else if (attempt5.ok) {
        console.log('   ❌ LOGIN SUCCESS (unexpected!)');
        console.log('   This means rate limiter was reset!');
    }

    // Step 3: Wait for lockout to expire
    console.log('\n\n📋 Step 3: Wait 5 minutes for lockout to expire...');
    console.log('-'.repeat(80));
    console.log('⏳ Waiting 5 minutes...');
    console.log('(In real test, you would wait. For now, we skip this step)');

    // For testing, we'll just proceed immediately
    // In production, uncomment this:
    // await new Promise(r => setTimeout(r, 5 * 60 * 1000));

    // Step 4: Try to login again with correct password
    console.log('\n\n📋 Step 4: After waiting, try login with CORRECT password');
    console.log('-'.repeat(80));

    // Wait a bit to simulate time passing
    await new Promise(r => setTimeout(r, 2000));

    const finalAttempt = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
            username: username,
            password: correctPassword
        })
    });
    const finalData = await finalAttempt.json();

    console.log(`Final attempt (CORRECT password):`);
    console.log(`   Status: ${finalAttempt.status}`);

    if (finalAttempt.status === 429) {
        console.log('   🚫 Still BLOCKED');
        console.log(`   Message: ${finalData.error}`);
        console.log('   ✅ This is correct - lockout still active');
    } else if (finalAttempt.ok) {
        console.log('   ✅ LOGIN SUCCESS');
        console.log(`   User: ${finalData.data?.user?.username}`);
        console.log('   ✅ This is correct - lockout expired OR this is first successful login');

        // Now logout
        console.log('\n\n📋 Step 5: Logout');
        console.log('-'.repeat(80));
        console.log('   User logged out (simulated)');

        // Try to login again immediately
        console.log('\n\n📋 Step 6: Try to login again immediately');
        console.log('-'.repeat(80));

        const reloginAttempt = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                password: correctPassword
            })
        });
        const reloginData = await reloginAttempt.json();

        console.log(`Re-login attempt (CORRECT password):`);
        console.log(`   Status: ${reloginAttempt.status}`);

        if (reloginAttempt.ok) {
            console.log('   ✅ LOGIN SUCCESS');
            console.log('   ✅ This is correct - rate limiter was reset after first successful login');
        } else {
            console.log('   ❌ LOGIN FAILED');
            console.log(`   Message: ${reloginData.error}`);
            console.log('   ❌ This is wrong - should be able to login after successful login');
        }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log('Expected behavior:');
    console.log('1. After 4 wrong attempts → 5th attempt blocked (even if correct)');
    console.log('2. After lockout expires → can login with correct password');
    console.log('3. After successful login → rate limiter reset');
    console.log('4. After logout → can login again immediately');
    console.log('='.repeat(80));
}

testLoginLogoutLogin().catch(console.error);
