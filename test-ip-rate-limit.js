/**
 * Test: Multiple Usernames from Same IP
 * 
 * This tests if IP-level rate limiting prevents trying many usernames
 */

const BASE_URL = 'http://localhost:3000';

async function testMultipleUsernames() {
    console.log('🧪 Testing Multiple Usernames from Same IP\n');
    console.log('='.repeat(80));

    // Try 10 different usernames (should trigger IP-level block)
    console.log('\n📋 Step 1: Try 10 different WRONG usernames');
    console.log('-'.repeat(80));

    for (let i = 1; i <= 10; i++) {
        console.log(`\nAttempt ${i}: username${i}`);
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `username${i}`,
                password: 'wrongpassword'
            })
        });
        const data = await response.json();
        console.log(`   Status: ${response.status}`);
        console.log(`   Message: ${data.error}`);

        if (response.status === 429) {
            console.log('   🎉 IP-LEVEL BLOCK TRIGGERED!');
            break;
        }

        await new Promise(r => setTimeout(r, 300));
    }

    // Try with correct username (should still be blocked)
    console.log('\n\n📋 Step 2: Try with CORRECT username (should be blocked by IP limit)');
    console.log('-'.repeat(80));

    const correctAttempt = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: 'imesho',
            password: 'password'
        })
    });
    const correctData = await correctAttempt.json();

    console.log(`Attempt with correct credentials:`);
    console.log(`   Status: ${correctAttempt.status}`);

    if (correctAttempt.status === 429) {
        console.log('   ✅ BLOCKED by IP-level limit!');
        console.log(`   Message: ${correctData.error}`);
        console.log('\n🎉 SUCCESS: IP-level rate limiting works!');
        console.log('   Attacker cannot bypass by trying different usernames.');
    } else if (correctAttempt.ok) {
        console.log('   ❌ LOGIN SUCCESS (should be blocked!)');
        console.log('   🐛 BUG: IP-level rate limiting not working!');
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log('Expected behavior:');
    console.log('1. After 10 attempts from same IP (any username) → IP blocked');
    console.log('2. Even correct credentials blocked → prevents username enumeration');
    console.log('3. Must wait 5 minutes before trying again');
    console.log('='.repeat(80));
}

testMultipleUsernames().catch(console.error);
