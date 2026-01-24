import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function login() {
  const email = 'testowner@company.com';
  const password = 'BusinessOwner123!';

  console.log('🔐 Business Owner Login...');
  console.log('Email:', email);
  console.log('Business: Test Company ABC\n');
  
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
  console.log('BUSINESS OWNER ACCESS TOKEN:');
  console.log('═'.repeat(80));
  console.log(data.session.access_token);
  console.log('═'.repeat(80));
  console.log('\n⏰ Expires:', new Date(data.session.expires_at * 1000).toLocaleString());
  console.log('\n📋 User Info:');
  console.log('   ID:', data.user.id);
  console.log('   Email:', data.user.email);
  
  console.log('\n🧪 Test Business Owner Endpoints:\n');
  console.log('# Get my subscription');
  console.log(`$token = "${data.session.access_token}"`);
  console.log('Invoke-WebRequest -Uri "http://localhost:5000/api/subscriptions/current" -Headers @{Authorization = "Bearer $token"} -UseBasicParsing | Select-Object -ExpandProperty Content\n');

  process.exit(0);
}

login();
