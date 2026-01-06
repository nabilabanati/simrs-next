/**
 * Test Rate Limiting - Correct Password Bypass Bug
 * 
 * This tests if rate limiting can be bypassed by entering
 * correct password after failed attempts.
 */

const BASE_URL = 'http://localhost:3000';

async function testCorrectPasswordBypass() {
    console.log('🧪 Testing Correct Password Bypass Bug\n');
    console.log('='.repeat(80));

    const testUsername = 'imesho'; // Real user
    const wrongPassword = 'wrongpassword';
    const correctPassword = 'password'; // Real password

    console.log('\n📋 TEST: Correct Password After Failed Attempts');
    console.log('-'.repeat(80));
    console.log(`Username: ${testUsername}`);
    console.log(`Correct Password: ${correctPassword}`);
    console.log('');

    // Try 4 failed logins
    console.log('Step 1: Try 4 WRONG passwords');
    for (let i = 1; i <= 4; i++) {
        console.log(`\nAttempt ${i} (WRONG password):`);

        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUsername,
                password: wrongPassword + i
            })
        });

        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.error}`);

        await new Promise(r => setTimeout(r, 500));
    }

    // Try 5th attempt with CORRECT password
    console.log('\n\nStep 2: Try 5th attempt with CORRECT password');
    console.log('-'.repeat(80));
    console.log('⚠️ CRITICAL TEST: Should this be BLOCKED or ALLOWED?');
    console.log('');

    const finalAttempt = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: testUsername,
            password: correctPassword // CORRECT PASSWORD!
        })
    });

    const finalData = await finalAttempt.json();

    console.log(`Attempt 5 (CORRECT password):`);
    console.log(`   Status: ${finalAttempt.status}`);

    if (finalAttempt.status === 429) {
        console.log('   ✅ BLOCKED! (Correct behavior)');
        console.log(`   Message: ${finalData.error}`);
        console.log('');
        console.log('🎉 PASS: Rate limiting works correctly!');
        console.log('   Even with correct password, user is blocked after 5 attempts.');
    } else if (finalAttempt.ok) {
        console.log('   ❌ LOGIN SUCCESS! (Bug - should be blocked)');
        console.log(`   User: ${finalData.data?.user?.username}`);
        console.log('');
        console.log('🐛 FAIL: Rate limiting has a bypass bug!');
        console.log('   User can bypass rate limit by entering correct password.');
        console.log('   This defeats the purpose of rate limiting!');
    } else {
        console.log(`   Status: ${finalAttempt.status}`);
        console.log(`   Message: ${finalData.error}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 EXPECTED BEHAVIOR:');
    console.log('='.repeat(80));
    console.log('After 4 failed attempts:');
    console.log('  - Attempt 5 with WRONG password → Should be BLOCKED (429)');
    console.log('  - Attempt 5 with CORRECT password → Should ALSO be BLOCKED (429)');
    console.log('');
    console.log('Why? To prevent attackers from:');
    console.log('  1. Trying 4 wrong passwords');
    console.log('  2. Then trying the real password on 5th attempt');
    console.log('  3. If successful, they bypass rate limiting!');
    console.log('='.repeat(80));
}

testCorrectPasswordBypass().catch(console.error);
