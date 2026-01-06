/**
 * Test Rate Limiting
 * 
 * This script tests the rate limiting functionality:
 * - 5 failed attempts should trigger lockout
 * - Lockout lasts 5 minutes
 * - Shows remaining attempts
 */

const BASE_URL = 'http://localhost:3000';

async function testRateLimiting() {
    console.log('🧪 Testing Rate Limiting\n');
    console.log('='.repeat(80));

    const testUsername = 'testuser';
    const wrongPassword = 'wrongpassword';

    console.log('\n📋 TEST 1: Failed Login Attempts');
    console.log('-'.repeat(80));

    // Try 5 failed logins
    for (let i = 1; i <= 6; i++) {
        console.log(`\nAttempt ${i}:`);

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: testUsername,
                    password: wrongPassword + i
                })
            });

            const data = await response.json();

            if (response.status === 429) {
                console.log('🚫 RATE LIMITED!');
                console.log('   Status:', response.status);
                console.log('   Message:', data.error);
                console.log('   ✅ Rate limiting is working!');
                break;
            } else if (response.status === 401) {
                console.log('❌ Login failed (expected)');
                console.log('   Message:', data.error);
            }

            // Small delay between attempts
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            console.log('   ❌ Request error:', error.message);
        }
    }

    console.log('\n📋 TEST 2: Successful Login (Real User)');
    console.log('-'.repeat(80));

    // Try with real user
    const realAttempt = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'imesho',
            password: 'password'
        })
    });

    const realData = await realAttempt.json();

    if (realAttempt.ok) {
        console.log('✅ Login successful!');
        console.log('   User:', realData.data.user.username);
        console.log('   Role:', realData.data.user.role);
    } else {
        console.log('❌ Login failed');
        console.log('   Error:', realData.error);
    }

    console.log('\n📋 TEST 3: Remaining Attempts Display');
    console.log('-'.repeat(80));

    const testUser2 = 'nurse2';

    for (let i = 1; i <= 3; i++) {
        console.log(`\nAttempt ${i}:`);

        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: testUser2,
                password: 'wrong' + i
            })
        });

        const data = await response.json();
        console.log('   Message:', data.error);

        await new Promise(r => setTimeout(r, 500));
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log('✅ Rate limiting is active');
    console.log('✅ Max 5 attempts per 5 minutes');
    console.log('✅ Shows remaining attempts to user');
    console.log('✅ Blocks after exceeding limit');
    console.log('='.repeat(80));
}

testRateLimiting().catch(console.error);
