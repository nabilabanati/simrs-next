// Test login with different credentials
async function testLogin() {
    const baseUrl = 'http://localhost:3000';

    const credentials = [
        { username: 'dokter1', password: 'password' },
        { username: 'admin', password: 'password' },
        { username: 'loket1', password: 'password' },
    ];

    for (const cred of credentials) {
        console.log(`\n🔐 Testing: ${cred.username} / ${cred.password}`);

        const res = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cred),
        });

        const data = await res.json();

        console.log(`Status: ${res.status}`);
        console.log(`Response:`, data);
    }
}

testLogin().catch(console.error);
