import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY  // Using anon key for client-side auth
);

async function login() {
  const email = 'testadmin@local.test';
  const password = 'TestAdmin123!';

  console.log('🔐 Attempting login...');
  console.log('Email:', email);
  console.log('');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  }

  console.log('✅ Login successful!\n');
  console.log('═'.repeat(80));
  console.log('ACCESS TOKEN (copy this):');
  console.log('═'.repeat(80));
  console.log(data.session.access_token);
  console.log('═'.repeat(80));
  console.log('\n⏰ Expires at:', new Date(data.session.expires_at * 1000).toLocaleString());
  console.log('\n📋 User Info:');
  console.log('   ID:', data.user.id);
  console.log('   Email:', data.user.email);
  
  console.log('\n🧪 Test Command:');
  console.log('Copy and run this in PowerShell:\n');
  console.log(`$token = "${data.session.access_token}"`);
  console.log('Invoke-WebRequest -Uri "http://localhost:5000/api/superadmin/statistics" -Headers @{Authorization = "Bearer $token"} -UseBasicParsing | Select-Object -ExpandProperty Content\n');

  process.exit(0);
}

login();
