import { supabaseAdmin } from '../supabase/supabaseAdmin.js';

// Script to generate an access token for testing
async function generateToken() {
  try {
    // User ID for designpods (from your list)
    const userId = '83e78d45-a92c-4dde-9c7f-da4eb3b06571';

    console.log('🔑 Generating access token for user:', userId);
    console.log('User: designpods\n');

    // Create a session for this user
    const { data, error } = await supabaseAdmin.auth.admin.createSession({
      user_id: userId
    });

    if (error) {
      console.error('❌ Error generating token:', error.message);
      process.exit(1);
    }

    if (!data || !data.access_token) {
      console.error('❌ No token returned');
      process.exit(1);
    }

    console.log('✅ Token generated successfully!\n');
    console.log('═'.repeat(80));
    console.log('ACCESS TOKEN:');
    console.log('═'.repeat(80));
    console.log(data.access_token);
    console.log('═'.repeat(80));
    console.log('\n📋 Copy the token above and use it in your API requests');
    console.log('⏰ Token expires at:', new Date(data.expires_at * 1000).toLocaleString());
    console.log('\n💡 Usage example:');
    console.log('Authorization: Bearer ' + data.access_token.substring(0, 50) + '...\n');

    // Also show how to test
    console.log('🧪 Quick test command:');
    console.log('$token = "' + data.access_token + '"');
    console.log('Invoke-WebRequest -Uri "http://localhost:5000/api/superadmin/statistics" -Headers @{Authorization = "Bearer $token"} -UseBasicParsing | Select-Object -ExpandProperty Content');

  } catch (error) {
    console.error('❌ Script error:', error.message);
    process.exit(1);
  }
}

generateToken();
