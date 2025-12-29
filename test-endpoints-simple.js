/**
 * Simplified API Endpoint Testing Script
 * Tests all accessible API endpoints for SIMRS Prototype
 * 
 * Run: node test-endpoints-simple.js
 */

const BASE_URL = 'http://localhost:3000';

// Test credentials
const USERS = {
    nurse: { username: 'nurse2', password: 'password' },
    doctor: { username: 'imesho', password: 'password' },
    cashier: { username: 'kasir1', password: 'password' },
};

const DOCTOR_UUID = '76cea6c2-2bc5-4c28-a5b8-08625f54f3be';

// Results tracking
let passed = 0, failed = 0, skipped = 0;

function log(status, name, message = '') {
    console.log(`${status} - ${name}`);
    if (message) console.log(`   ${message}`);
}

async function apiCall(method, endpoint, body = null) {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        };
        if (body) options.body = JSON.stringify(body);

        const res = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await res.json();
        return { status: res.status, data, ok: res.ok };
    } catch (error) {
        return { status: 0, data: null, ok: false, error: error.message };
    }
}

async function testEndpoint(name, method, endpoint, body = null, expectSuccess = true) {
    const res = await apiCall(method, endpoint, body);
    const success = expectSuccess ? res.ok : !res.ok;

    if (success) {
        passed++;
        log('✅ PASS', name, `Status: ${res.status}`);
    } else {
        failed++;
        log('❌ FAIL', name, `Status: ${res.status}, Error: ${res.data?.error || 'Unknown'}`);
    }
    return res;
}

function skip(name, reason) {
    skipped++;
    log('⏭️  SKIP', name, `Reason: ${reason}`);
}

async function runTests() {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║     SIMRS API ENDPOINT TESTING (Simplified)      ║');
    console.log('╚══════════════════════════════════════════════════╝\n');

    // ===== AUTHENTICATION =====
    console.log('\n🔐 AUTHENTICATION MODULE\n');

    await testEndpoint('POST /api/auth/login (Nurse)', 'POST', '/api/auth/login', USERS.nurse);
    await testEndpoint('POST /api/auth/login (Doctor)', 'POST', '/api/auth/login', USERS.doctor);
    await testEndpoint('POST /api/auth/login (Cashier)', 'POST', '/api/auth/login', USERS.cashier);

    // Re-login as doctor for subsequent tests
    await apiCall('POST', '/api/auth/login', USERS.doctor);

    await testEndpoint('POST /api/auth/logout', 'POST', '/api/auth/logout');

    // Re-login for other tests
    await apiCall('POST', '/api/auth/login', USERS.doctor);

    // ===== NURSE MODULE =====
    console.log('\n👩‍⚕️ NURSE MODULE\n');

    // Login as nurse
    await apiCall('POST', '/api/auth/login', USERS.nurse);

    await testEndpoint('GET /api/nurse/visits', 'GET', '/api/nurse/visits');
    await testEndpoint('GET /api/nurse/profile', 'GET', '/api/nurse/profile');
    await testEndpoint('GET /api/nurse/visit-history', 'GET', '/api/nurse/visit-history');

    skip('POST /api/nurse/pick-patient', 'Requires active visit_id');
    skip('POST /api/nurse/save-ttv', 'Requires visit_id and TTV data');
    skip('POST /api/nurse/cancel-ttv', 'Requires visit_id');

    // ===== DOCTOR MODULE =====
    console.log('\n👨‍⚕️ DOCTOR MODULE\n');

    // Login as doctor
    await apiCall('POST', '/api/auth/login', USERS.doctor);

    await testEndpoint('GET /api/doctor/visits', 'GET', '/api/doctor/visits');
    await testEndpoint('GET /api/doctor/patients', 'GET', `/api/doctor/patients?user_id=${DOCTOR_UUID}`);
    await testEndpoint('GET /api/doctor/get-prescriptions', 'GET', `/api/doctor/get-prescriptions?user_id=${DOCTOR_UUID}`);
    await testEndpoint('GET /api/doctor/schedule', 'GET', `/api/doctor/schedule?user_id=${DOCTOR_UUID}`);
    await testEndpoint('GET /api/doctor/schedule-override', 'GET', `/api/doctor/schedule-override?user_id=${DOCTOR_UUID}`);

    skip('GET /api/doctor/visit-detail', 'Requires visit_id');
    skip('GET /api/doctor/patient-history', 'Requires patient_id');
    skip('GET /api/doctor/patient-medical-record', 'Requires visit_id');
    skip('POST /api/doctor/complete-visit', 'Requires visit_id with SOAP');
    skip('POST /api/doctor/generate-payment-code', 'Requires completed visit_id');
    skip('GET /api/doctor/get-invoice', 'Requires visit_id');
    skip('GET /api/doctor/get-accumulated-invoice', 'Requires visit_id');
    skip('POST /api/doctor/schedule', 'Requires schedule data');
    skip('PUT /api/doctor/schedule', 'Requires schedule_id');
    skip('DELETE /api/doctor/schedule', 'Requires schedule_id');
    skip('POST /api/doctor/schedule-override', 'Requires override data');
    skip('PUT /api/doctor/schedule-override', 'Requires override_id');
    skip('DELETE /api/doctor/schedule-override', 'Requires override_id');

    // ===== CASHIER MODULE =====
    console.log('\n💰 CASHIER MODULE\n');

    skip('POST /api/cashier/verify-payment-code', 'Requires payment code');
    skip('POST /api/cashier/mark-payment-used', 'Requires payment code');
    skip('POST /api/cashier/pay', 'Requires invoice_id');
    skip('GET /api/cashier/invoice', 'Requires visit_id');
    skip('POST /api/cashier/void', 'Requires payment_id');

    // ===== MEDICAL RECORDS =====
    console.log('\n📋 MEDICAL RECORDS MODULE\n');

    skip('POST /api/medical-records/soap', 'Requires visit_id and SOAP data');
    skip('GET /api/medical-records/history', 'Requires patient_id');

    // ===== PRESCRIPTIONS =====
    console.log('\n💊 PRESCRIPTIONS MODULE\n');

    skip('POST /api/prescriptions', 'Requires prescription data');
    skip('GET /api/prescriptions', 'Requires visit_id');
    skip('GET /api/prescriptions/items', 'Requires prescription_id');
    skip('POST /api/prescriptions/items', 'Requires prescription_id and medicine data');
    skip('DELETE /api/prescriptions/items', 'Requires item_id');

    // ===== REFERRALS =====
    console.log('\n🔄 REFERRALS MODULE\n');

    skip('POST /api/referrals', 'Requires referral data');
    skip('GET /api/referrals', 'Requires visit_id');

    // ===== SUMMARY =====
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║                  TEST SUMMARY                    ║');
    console.log('╚══════════════════════════════════════════════════╝\n');
    console.log(`✅ Passed:  ${passed}`);
    console.log(`❌ Failed:  ${failed}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`📊 Total:   ${passed + failed + skipped}`);

    if (passed + failed > 0) {
        console.log(`\n📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
        console.log(`   (excluding skipped tests)\n`);
    }
}

runTests();
