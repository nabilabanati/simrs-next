/**
 * Migration Script: Hash all plain text passwords in database
 * 
 * This script will:
 * 1. Fetch all users from database
 * 2. Hash their plain text passwords using bcrypt
 * 3. Update the database with hashed passwords
 * 
 * IMPORTANT: Run this ONCE after implementing bcrypt!
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    console.error('❌ Missing environment variables!');
    console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function hashPasswords() {
    console.log('🔐 Starting password hashing migration...\n');
    console.log('='.repeat(70));

    try {
        // Fetch all users
        console.log('\n1️⃣ Fetching all users from database...');
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, username, password');

        if (fetchError) {
            console.error('❌ Error fetching users:', fetchError.message);
            process.exit(1);
        }

        if (!users || users.length === 0) {
            console.log('⚠️  No users found in database');
            return;
        }

        console.log(`✅ Found ${users.length} users\n`);

        // Hash each password
        console.log('2️⃣ Hashing passwords...');
        const updates = [];

        for (const user of users) {
            // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
            const isAlreadyHashed = user.password?.startsWith('$2a$') || user.password?.startsWith('$2b$');

            if (isAlreadyHashed) {
                console.log(`   ⏭️  ${user.username.padEnd(20)} - Already hashed, skipping`);
                continue;
            }

            // Hash the plain text password
            const hashedPassword = await bcrypt.hash(user.password, 10);
            updates.push({
                id: user.id,
                username: user.username,
                oldPassword: user.password,
                newPassword: hashedPassword
            });

            console.log(`   ✅ ${user.username.padEnd(20)} - Hashed successfully`);
        }

        if (updates.length === 0) {
            console.log('\n✅ All passwords are already hashed! No updates needed.');
            return;
        }

        console.log(`\n3️⃣ Updating ${updates.length} passwords in database...`);

        // Update database
        let successCount = 0;
        let errorCount = 0;

        for (const update of updates) {
            const { error: updateError } = await supabase
                .from('users')
                .update({ password: update.newPassword })
                .eq('id', update.id);

            if (updateError) {
                console.error(`   ❌ ${update.username} - Error:`, updateError.message);
                errorCount++;
            } else {
                console.log(`   ✅ ${update.username} - Updated`);
                successCount++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(70));
        console.log(`Total users:           ${users.length}`);
        console.log(`Already hashed:        ${users.length - updates.length}`);
        console.log(`Successfully updated:  ${successCount}`);
        console.log(`Failed:                ${errorCount}`);
        console.log('='.repeat(70));

        if (successCount > 0) {
            console.log('\n✅ Password migration completed successfully!');
            console.log('\n💡 Next steps:');
            console.log('   1. Test login with existing users');
            console.log('   2. Verify bcrypt is working correctly');
            console.log('   3. Delete this migration script (or keep for reference)');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run migration
hashPasswords();
