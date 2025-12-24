/**
 * Clear all authentication tokens and reset API headers
 * Run this in browser console to fix login issues
 */

// Clear all possible token storage keys
const tokenKeys = [
    'eventmax_token',
    'emx_token', 
    'emx_refresh',
    'eventmax_refresh',
    'auth_token',
    'access_token',
    'authToken',
    'token'
];

console.log('🧹 Clearing all authentication tokens...');

tokenKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
        localStorage.removeItem(key);
        console.log(`   ✅ Removed localStorage.${key}`);
    }
    
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) {
        sessionStorage.removeItem(key);
        console.log(`   ✅ Removed sessionStorage.${key}`);
    }
});

// Clear axios default headers
if (window.axios) {
    delete window.axios.defaults.headers.common['Authorization'];
    console.log('   ✅ Cleared axios Authorization header');
}

// Clear any global API client headers
if (window.api) {
    delete window.api.defaults.headers.common['Authorization'];
    console.log('   ✅ Cleared global API Authorization header');
}

console.log('\n🎉 All tokens cleared! Please refresh the page and try logging in again.');
console.log('\n🔑 Admin Credentials:');
console.log('   Email: admin@eventmax.com');
console.log('   Password: admin123');

// Auto-refresh the page after 2 seconds
setTimeout(() => {
    console.log('🔄 Refreshing page...');
    window.location.reload();
}, 2000);
