/**
 * Quick API Test for SIMRS-Next
 * Tests basic authentication flow
 */

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   SIMRS-Next Quick API Test           ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Test 1: Login
    console.log('🧪 Testing Login API...');
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'admin123'
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log('✅ Login PASS');
            console.log(`User: ${data.user?.nama || 'Unknown'}`);
            console.log(`Role: ${data.user?.role || 'Unknown'}`);
            console.log(`Token: ${data.token?.substring(0, 20)}...`);
        } else {
            console.log('❌ Login FAIL');
            console.log(`Error: ${data.error}`);
        }
    } catch (error) {
        console.log('❌ Login ERROR:', error.message);
    }

    console.log('\n' + '─'.repeat(50) + '\n');

    // Test 2: Invalid Login
    console.log('🧪 Testing Invalid Login...');
    try {
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'wrong',
                password: 'wrong'
            })
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.status === 401) {
            console.log('✅ Invalid Login Test PASS (correctly rejected)');
        } else {
            console.log('❌ Invalid Login Test FAIL (should return 401)');
        }
    } catch (error) {
        console.log('❌ Test ERROR:', error.message);
    }

    console.log('\n' + '─'.repeat(50) + '\n');

    // Test 3: Logout
    console.log('🧪 Testing Logout API...');
    try {
        const response = await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log('✅ Logout PASS');
        } else {
            console.log('❌ Logout FAIL');
        }
    } catch (error) {
        console.log('❌ Test ERROR:', error.message);
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         Test Complete!                 ║');
    console.log('╚════════════════════════════════════════╝\n');
}

testAPI().catch(console.error);
