/**
 * API Test with Debug Output
 */

const BASE_URL = 'http://localhost:3000';

async function testLoginDebug() {
    console.log('\n🔍 DEBUG: Testing Login API\n');

    const credentials = [
        { username: 'loket1', password: 'password', role: 'loket' },
        { username: 'imesho', password: 'password', role: 'dokter' },
        { username: 'nurse2', password: 'password', role: 'perawat' },
    ];

    for (const cred of credentials) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${cred.username} (${cred.role})`);
        console.log('='.repeat(60));

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: cred.username,
                    password: cred.password
                })
            });

            console.log(`\nStatus: ${response.status} ${response.statusText}`);

            const text = await response.text();
            console.log(`\nRaw Response (first 500 chars):`);
            console.log(text.substring(0, 500));

            try {
                const data = JSON.parse(text);
                console.log(`\nParsed JSON:`);
                console.log(JSON.stringify(data, null, 2));

                if (data.success && data.token) {
                    console.log(`\n✅ SUCCESS!`);
                    console.log(`Token: ${data.token.substring(0, 40)}...`);
                    console.log(`User: ${data.user.nama} (${data.user.role})`);
                } else if (data.error) {
                    console.log(`\n❌ ERROR: ${data.error}`);
                } else {
                    console.log(`\n⚠️ UNEXPECTED RESPONSE FORMAT`);
                    console.log(`Keys in response: ${Object.keys(data).join(', ')}`);
                }
            } catch (e) {
                console.log(`\n❌ Failed to parse JSON: ${e.message}`);
            }

        } catch (error) {
            console.log(`\n❌ Request failed: ${error.message}`);
        }
    }
}

testLoginDebug().catch(console.error);
