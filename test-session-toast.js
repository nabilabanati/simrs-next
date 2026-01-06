/**
 * Quick Test: Session Expiration with Toast
 * 
 * This will test if toast appears and redirect works
 */

console.log('🧪 Testing Session Expiration with Toast\n');

// Simulate session expiration
function testSessionExpiration() {
    console.log('1. Simulating session expiration...');

    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.clear();

    console.log('2. Showing toast notification...');

    // Import and show toast
    import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Anda telah login dari perangkat lain. Silakan login kembali.', {
            duration: 3000,
            position: 'top-center',
            style: {
                background: '#EF4444',
                color: '#fff',
                fontWeight: '600',
            },
        });

        console.log('✅ Toast shown!');
    });

    console.log('3. Redirecting to login in 700ms...');

    // Redirect after delay
    setTimeout(() => {
        const loginUrl = '/login?reason=session_invalidated';
        console.log('4. Attempting redirect to:', loginUrl);

        try {
            window.location.replace(loginUrl);
            console.log('✅ Redirect initiated with window.location.replace()');
        } catch (e) {
            console.log('⚠️ Replace failed, trying href...');
            window.location.href = loginUrl;
        }

        // Force reload if still here
        setTimeout(() => {
            if (window.location.pathname !== '/login') {
                console.log('⚠️ Still not on login page, forcing reload...');
                window.location.reload();
            }
        }, 300);
    }, 700);
}

// Run test
console.log('Run this in browser console on any authenticated page:');
console.log('testSessionExpiration()');
console.log('\nOr run automatically in 2 seconds...');

setTimeout(() => {
    console.log('\n🚀 Auto-running test...\n');
    testSessionExpiration();
}, 2000);
