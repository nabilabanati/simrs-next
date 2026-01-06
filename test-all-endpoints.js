/**
 * Comprehensive API Endpoint Testing Script
 * Tests all 41 endpoints for SIMRS Prototype
 * 
 * Test Users:
 * - Nurse: nurse2 (password)
 * - Doctor: imesho (password)
 * - Cashier: kasir1 (password)
 * - Loket: loket1 (password)
 */

const BASE_URL = 'http://localhost:3000';

// Test user credentials
const USERS = {
    nurse: {
        username: 'nurse2',
        password: 'password',
        uuid: '0f093768-b434-4a59-a18b-8d7b2392de86',
        nurse_id: '835a22f7-4b98-414d-bfde-ad176abc2b5c',
        poli_id: 'f6b74bba-4f35-455e-8984-a80e6ade2b78'
    },
    doctor: {
        username: 'imesho',
        password: 'password',
        uuid: '76cea6c2-2bc5-4c28-a5b8-08625f54f3be',
        doctor_id: '15c746fd-c3f5-4f3f-9a19-804030a00d3b',
        poli_id: 'f6b74bba-4f35-455e-8984-a80e6ade2b78'
    },
    cashier: {
        username: 'kasir1',
        password: 'password'
    },
    loket: {
        username: 'loket1',
        password: 'password'
    }
};

// Store cookies for authenticated requests
let cookies = {
    nurse: '',
    doctor: '',
    cashier: '',
    loket: ''
};

// Test results
const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    tests: []
};

// Helper function to make API calls
async function apiCall(method, endpoint, body = null, role = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    // Add cookie if role is specified
    if (role && cookies[role]) {
        options.headers['Cookie'] = cookies[role];
    }

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    // Store cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie && role) {
        cookies[role] = setCookie.split(';')[0];
    }

    const data = await response.json();
    return { status: response.status, data };
}

// Test logger
function logTest(name, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${name}`);
    if (message) console.log(`   ${message}`);

    results.tests.push({ name, passed, message });
    if (passed) results.passed++;
    else results.failed++;
}

function skipTest(name, reason) {
    console.log(`⏭️  SKIP - ${name}`);
    console.log(`   Reason: ${reason}`);
    results.tests.push({ name, passed: null, message: reason });
    results.skipped++;
}

// ============================================
// AUTHENTICATION TESTS (3 endpoints)
// ============================================
async function testAuthentication() {
    console.log('\n🔐 TESTING AUTHENTICATION MODULE\n');

    // 1. POST /api/auth/login - Nurse
    try {
        const res = await apiCall('POST', '/api/auth/login', {
            username: USERS.nurse.username,
            password: USERS.nurse.password
        }, 'nurse');
        logTest('POST /api/auth/login (Nurse)', res.status === 200 && res.data.user,
            `Status: ${res.status}, Role: ${res.data.user?.role}`);
    } catch (error) {
        logTest('POST /api/auth/login (Nurse)', false, error.message);
    }

    // 2. POST /api/auth/login - Doctor
    try {
        const res = await apiCall('POST', '/api/auth/login', {
            username: USERS.doctor.username,
            password: USERS.doctor.password
        }, 'doctor');
        logTest('POST /api/auth/login (Doctor)', res.status === 200 && res.data.user,
            `Status: ${res.status}, Role: ${res.data.user?.role}`);
    } catch (error) {
        logTest('POST /api/auth/login (Doctor)', false, error.message);
    }

    // 3. POST /api/auth/login - Cashier
    try {
        const res = await apiCall('POST', '/api/auth/login', {
            username: USERS.cashier.username,
            password: USERS.cashier.password
        }, 'cashier');
        logTest('POST /api/auth/login (Cashier)', res.status === 200 && res.data.user,
            `Status: ${res.status}, Role: ${res.data.user?.role}`);
    } catch (error) {
        logTest('POST /api/auth/login (Cashier)', false, error.message);
    }

    // 4. POST /api/auth/logout
    try {
        const res = await apiCall('POST', '/api/auth/logout', null, 'nurse');
        logTest('POST /api/auth/logout', res.status === 200, `Status: ${res.status}`);
        // Re-login nurse for subsequent tests
        await apiCall('POST', '/api/auth/login', {
            username: USERS.nurse.username,
            password: USERS.nurse.password
        }, 'nurse');
    } catch (error) {
        logTest('POST /api/auth/logout', false, error.message);
    }
}

// ============================================
// NURSE MODULE TESTS (6 endpoints)
// ============================================
async function testNurseModule() {
    console.log('\n👩‍⚕️ TESTING NURSE MODULE\n');

    // 5. GET /api/nurse/visits
    try {
        const res = await apiCall('GET', '/api/nurse/visits', null, 'nurse');
        logTest('GET /api/nurse/visits', res.status === 200,
            `Status: ${res.status}, Visits: ${res.data.data?.length || 0}`);
    } catch (error) {
        logTest('GET /api/nurse/visits', false, error.message);
    }

    // 6. GET /api/nurse/profile
    try {
        const res = await apiCall('GET', '/api/nurse/profile', null, 'nurse');
        logTest('GET /api/nurse/profile', res.status === 200,
            `Status: ${res.status}, Name: ${res.data.data?.users?.nama}`);
    } catch (error) {
        logTest('GET /api/nurse/profile', false, error.message);
    }

    // 7. POST /api/nurse/pick-patient (requires visit_id)
    skipTest('POST /api/nurse/pick-patient', 'Requires active visit_id from visits');

    // 8. POST /api/nurse/save-ttv (requires visit_id and TTV data)
    skipTest('POST /api/nurse/save-ttv', 'Requires active visit_id and TTV data');

    // 9. POST /api/nurse/cancel-ttv (requires visit_id)
    skipTest('POST /api/nurse/cancel-ttv', 'Requires active visit_id');

    // 10. GET /api/nurse/visit-history
    try {
        const res = await apiCall('GET', '/api/nurse/visit-history', null, 'nurse');
        logTest('GET /api/nurse/visit-history', res.status === 200,
            `Status: ${res.status}, History count: ${res.data.data?.length || 0}`);
    } catch (error) {
        logTest('GET /api/nurse/visit-history', false, error.message);
    }
}

// ============================================
// DOCTOR MODULE TESTS (18 endpoints)
// ============================================
async function testDoctorModule() {
    console.log('\n👨‍⚕️ TESTING DOCTOR MODULE\n');

    // 11. GET /api/doctor/visits
    try {
        const res = await apiCall('GET', '/api/doctor/visits', null, 'doctor');
        logTest('GET /api/doctor/visits', res.status === 200,
            `Status: ${res.status}, Visits: ${res.data.data?.length || 0}`);
    } catch (error) {
        logTest('GET /api/doctor/visits', false, error.message);
    }

    // 12. GET /api/doctor/patients
    try {
        const res = await apiCall('GET', `/api/doctor/patients?user_id=${USERS.doctor.uuid}`, null, 'doctor');
        logTest('GET /api/doctor/patients', res.status === 200,
            `Status: ${res.status}, Patients: ${res.data.data?.length || 0}`);
    } catch (error) {
        logTest('GET /api/doctor/patients', false, error.message);
    }

    // 13. GET /api/doctor/visit-detail (requires visit_id)
    skipTest('GET /api/doctor/visit-detail', 'Requires active visit_id');

    // 14. GET /api/doctor/patient-history (requires patient_id)
    skipTest('GET /api/doctor/patient-history', 'Requires patient_id');

    // 15. GET /api/doctor/patient-medical-record (requires visit_id)
    skipTest('GET /api/doctor/patient-medical-record', 'Requires visit_id');

    // 16. POST /api/doctor/complete-visit (requires visit_id)
    skipTest('POST /api/doctor/complete-visit', 'Requires completed visit_id with SOAP');

    // 17. POST /api/doctor/generate-payment-code (requires visit_id)
    skipTest('POST /api/doctor/generate-payment-code', 'Requires completed visit_id');

    // 18. GET /api/doctor/get-invoice (requires visit_id)
    skipTest('GET /api/doctor/get-invoice', 'Requires visit_id');

    // 19. GET /api/doctor/get-accumulated-invoice (requires visit_id)
    skipTest('GET /api/doctor/get-accumulated-invoice', 'Requires visit_id');

    // 20. GET /api/doctor/get-prescriptions
    try {
        const res = await apiCall('GET', `/api/doctor/get-prescriptions?user_id=${USERS.doctor.uuid}`, null, 'doctor');
        logTest('GET /api/doctor/get-prescriptions', res.status === 200,
            `Status: ${res.status}, Prescriptions: ${res.data.data?.length || 0}`);
    } catch (error) {
        logTest('GET /api/doctor/get-prescriptions', false, error.message);
    }

    // 21-24. Doctor Schedule CRUD
    try {
        const res = await apiCall('GET', `/api/doctor/schedule?user_id=${USERS.doctor.uuid}`, null, 'doctor');
        logTest('GET /api/doctor/schedule', res.status === 200,
            `Status: ${res.status}, Schedules: ${res.data.data?.length || 0}`);
    } catch (error) {
        logTest('GET /api/doctor/schedule', false, error.message);
    }

    skipTest('POST /api/doctor/schedule', 'Requires schedule data');
    skipTest('PUT /api/doctor/schedule', 'Requires schedule_id and update data');
    skipTest('DELETE /api/doctor/schedule', 'Requires schedule_id');

    // 25-28. Doctor Schedule Override CRUD
    try {
        const res = await apiCall('GET', `/api/doctor/schedule-override?user_id=${USERS.doctor.uuid}`, null, 'doctor');
        logTest('GET /api/doctor/schedule-override', res.status === 200,
            `Status: ${res.status}, Overrides: ${res.data.data?.length || 0}`);
    } catch (error) {
        logTest('GET /api/doctor/schedule-override', false, error.message);
    }

    skipTest('POST /api/doctor/schedule-override', 'Requires override data');
    skipTest('PUT /api/doctor/schedule-override', 'Requires override_id and update data');
    skipTest('DELETE /api/doctor/schedule-override', 'Requires override_id');
}

// ============================================
// CASHIER MODULE TESTS (5 endpoints)
// ============================================
async function testCashierModule() {
    console.log('\n💰 TESTING CASHIER MODULE\n');

    // 29. POST /api/cashier/verify-payment-code (requires payment code)
    skipTest('POST /api/cashier/verify-payment-code', 'Requires valid payment code from doctor');

    // 30. POST /api/cashier/mark-payment-used (requires payment code)
    skipTest('POST /api/cashier/mark-payment-used', 'Requires verified payment code');

    // 31. POST /api/cashier/pay (requires invoice_id)
    skipTest('POST /api/cashier/pay', 'Requires invoice_id');

    // 32. GET /api/cashier/invoice (requires visit_id)
    skipTest('GET /api/cashier/invoice', 'Requires visit_id');

    // 33. POST /api/cashier/void (requires payment_id)
    skipTest('POST /api/cashier/void', 'Requires payment_id');
}

// ============================================
// MEDICAL RECORDS TESTS (2 endpoints)
// ============================================
async function testMedicalRecords() {
    console.log('\n📋 TESTING MEDICAL RECORDS MODULE\n');

    // 34. POST /api/medical-records/soap (requires visit_id and SOAP data)
    skipTest('POST /api/medical-records/soap', 'Requires visit_id and SOAP data');

    // 35. GET /api/medical-records/history (requires patient_id)
    skipTest('GET /api/medical-records/history', 'Requires patient_id');
}

// ============================================
// PRESCRIPTIONS TESTS (5 endpoints)
// ============================================
async function testPrescriptions() {
    console.log('\n💊 TESTING PRESCRIPTIONS MODULE\n');

    // 36. POST /api/prescriptions (requires prescription data)
    skipTest('POST /api/prescriptions', 'Requires prescription data');

    // 37. GET /api/prescriptions (requires visit_id)
    skipTest('GET /api/prescriptions', 'Requires visit_id');

    // 38. GET /api/prescriptions/items (requires prescription_id)
    skipTest('GET /api/prescriptions/items', 'Requires prescription_id');

    // 39. POST /api/prescriptions/items (requires prescription_id and item data)
    skipTest('POST /api/prescriptions/items', 'Requires prescription_id and medicine data');

    // 40. DELETE /api/prescriptions/items (requires item_id)
    skipTest('DELETE /api/prescriptions/items', 'Requires prescription_item_id');
}

// ============================================
// REFERRALS TESTS (2 endpoints)
// ============================================
async function testReferrals() {
    console.log('\n🔄 TESTING REFERRALS MODULE\n');

    // 41. POST /api/referrals (requires referral data)
    skipTest('POST /api/referrals', 'Requires visit_id and referral data');

    // 42. GET /api/referrals (requires visit_id)
    skipTest('GET /api/referrals', 'Requires visit_id');
}

// ============================================
// MAIN TEST RUNNER
// ============================================
async function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   SIMRS API ENDPOINT TESTING - ALL 41 ENDPOINTS        ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`\nBase URL: ${BASE_URL}`);
    console.log(`Test Time: ${new Date().toISOString()}\n`);

    try {
        await testAuthentication();
        await testNurseModule();
        await testDoctorModule();
        await testCashierModule();
        await testMedicalRecords();
        await testPrescriptions();
        await testReferrals();

        // Print summary
        console.log('\n╔════════════════════════════════════════════════════════╗');
        console.log('║                    TEST SUMMARY                        ║');
        console.log('╚════════════════════════════════════════════════════════╝\n');
        console.log(`✅ Passed:  ${results.passed}`);
        console.log(`❌ Failed:  ${results.failed}`);
        console.log(`⏭️  Skipped: ${results.skipped}`);
        console.log(`📊 Total:   ${results.passed + results.failed + results.skipped}`);
        console.log(`\n📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(2)}%`);
        console.log(`   (excluding skipped tests)\n`);

        // Print failed tests
        if (results.failed > 0) {
            console.log('\n❌ FAILED TESTS:\n');
            results.tests
                .filter(t => t.passed === false)
                .forEach(t => console.log(`   - ${t.name}: ${t.message}`));
        }

        console.log('\n✨ Testing completed!\n');

    } catch (error) {
        console.error('\n❌ Fatal error during testing:', error);
        process.exit(1);
    }
}

// Run tests
runAllTests();
