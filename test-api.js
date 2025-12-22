#!/usr/bin/env node

/**
 * Simple API Testing Script for SIMRS-Next
 * Run with: node test-api.js
 */

const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, useAuth = false) {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (useAuth && authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();

        return {
            status: response.status,
            ok: response.ok,
            data,
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message,
        };
    }
}

// Test 1: Login API
async function testLogin() {
    console.log('\n🧪 TEST 1: POST /api/auth/login');
    console.log('━'.repeat(50));

    const result = await apiRequest('/api/auth/login', 'POST', {
        username: 'dokter1',
        password: 'dokter123',
    });

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.ok ? '✅' : '❌'}`);

    if (result.ok && result.data.token) {
        authToken = result.data.token;
        console.log(`Token: ${authToken.substring(0, 20)}...`);
        console.log(`User: ${result.data.user.nama} (${result.data.user.role})`);
        console.log('✅ PASS - Login successful');
    } else {
        console.log('❌ FAIL - Login failed');
        console.log('Error:', result.data.error || result.error);
    }

    return result.ok;
}

// Test 2: Login with Invalid Credentials
async function testLoginInvalid() {
    console.log('\n🧪 TEST 2: POST /api/auth/login (Invalid Credentials)');
    console.log('━'.repeat(50));

    const result = await apiRequest('/api/auth/login', 'POST', {
        username: 'dokter1',
        password: 'wrongpassword',
    });

    console.log(`Status: ${result.status}`);

    if (result.status === 401) {
        console.log('✅ PASS - Correctly rejected invalid credentials');
        console.log(`Error message: ${result.data.error}`);
    } else {
        console.log('❌ FAIL - Should return 401 for invalid credentials');
    }

    return result.status === 401;
}

// Test 3: Get Doctor Visits (requires auth)
async function testGetDoctorVisits() {
    console.log('\n🧪 TEST 3: GET /api/doctor/visits');
    console.log('━'.repeat(50));

    if (!authToken) {
        console.log('❌ SKIP - No auth token available');
        return false;
    }

    // Note: This endpoint might need doctor_id parameter
    // For now, we'll just test if it responds
    const result = await apiRequest('/api/doctor/visits?doctor_id=test', 'GET', null, true);

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.ok ? '✅' : '❌'}`);

    if (result.ok) {
        console.log(`Visits count: ${result.data.visits?.length || 0}`);
        console.log('✅ PASS - API responded successfully');
    } else {
        console.log('Response:', result.data);
    }

    return result.ok;
}

// Test 4: Logout API
async function testLogout() {
    console.log('\n🧪 TEST 4: POST /api/auth/logout');
    console.log('━'.repeat(50));

    const result = await apiRequest('/api/auth/logout', 'POST');

    console.log(`Status: ${result.status}`);
    console.log(`Success: ${result.ok ? '✅' : '❌'}`);

    if (result.ok) {
        console.log('✅ PASS - Logout successful');
        authToken = '';
    } else {
        console.log('❌ FAIL - Logout failed');
    }

    return result.ok;
}

// Run all tests
async function runTests() {
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║     SIMRS-Next API Testing Suite              ║');
    console.log('╚════════════════════════════════════════════════╝');

    const results = {
        total: 0,
        passed: 0,
        failed: 0,
    };

    // Run tests
    const tests = [
        { name: 'Login with valid credentials', fn: testLogin },
        { name: 'Login with invalid credentials', fn: testLoginInvalid },
        { name: 'Get doctor visits', fn: testGetDoctorVisits },
        { name: 'Logout', fn: testLogout },
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
    }

    // Summary
    console.log('\n╔════════════════════════════════════════════════╗');
    console.log('║              TEST SUMMARY                      ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log(`Total Tests: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
    console.log('');
}

// Run the test suite
runTests().catch(console.error);
