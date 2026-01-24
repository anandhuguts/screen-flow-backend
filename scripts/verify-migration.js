import { supabaseAdmin } from '../supabase/supabaseAdmin.js';

async function verifyMigration() {
  console.log('🔍 Verifying Subscription System Migration...\n');

  const checks = [];

  try {
    // Check 1: subscription_plans table exists and has data
    console.log('1️⃣ Checking subscription_plans table...');
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('plan_type, name, monthly_price');

    if (plansError) {
      checks.push({ name: 'subscription_plans', status: '❌', error: plansError.message });
    } else {
      checks.push({ name: 'subscription_plans', status: '✅', count: plans.length });
      console.log(`   ✅ Found ${plans.length} subscription plans`);
      plans.forEach(p => console.log(`      - ${p.name} (₹${p.monthly_price})`));
    }

    // Check 2: subscriptions table exists
    console.log('\n2️⃣ Checking subscriptions table...');
    const { data: subs, error: subsError } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .limit(1);

    if (subsError) {
      checks.push({ name: 'subscriptions', status: '❌', error: subsError.message });
    } else {
      checks.push({ name: 'subscriptions', status: '✅' });
      console.log('   ✅ subscriptions table accessible');
    }

    // Check 3: subscription_history table exists
    console.log('\n3️⃣ Checking subscription_history table...');
    const { data: history, error: historyError } = await supabaseAdmin
      .from('subscription_history')
      .select('id')
      .limit(1);

    if (historyError) {
      checks.push({ name: 'subscription_history', status: '❌', error: historyError.message });
    } else {
      checks.push({ name: 'subscription_history', status: '✅' });
      console.log('   ✅ subscription_history table accessible');
    }

    // Check 4: subscription_payments table exists
    console.log('\n4️⃣ Checking subscription_payments table...');
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('subscription_payments')
      .select('id')
      .limit(1);

    if (paymentsError) {
      checks.push({ name: 'subscription_payments', status: '❌', error: paymentsError.message });
    } else {
      checks.push({ name: 'subscription_payments', status: '✅' });
      console.log('   ✅ subscription_payments table accessible');
    }

    // Check 5: business_invitations table exists
    console.log('\n5️⃣ Checking business_invitations table...');
    const { data: invitations, error: invitationsError } = await supabaseAdmin
      .from('business_invitations')
      .select('id')
      .limit(1);

    if (invitationsError) {
      checks.push({ name: 'business_invitations', status: '❌', error: invitationsError.message });
    } else {
      checks.push({ name: 'business_invitations', status: '✅' });
      console.log('   ✅ business_invitations table accessible');
    }

    // Check 6: feature_usage_logs table exists
    console.log('\n6️⃣ Checking feature_usage_logs table...');
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('feature_usage_logs')
      .select('id')
      .limit(1);

    if (usageError) {
      checks.push({ name: 'feature_usage_logs', status: '❌', error: usageError.message });
    } else {
      checks.push({ name: 'feature_usage_logs', status: '✅' });
      console.log('   ✅ feature_usage_logs table accessible');
    }

    // Check 7: businesses table has new columns
    console.log('\n7️⃣ Checking businesses table modifications...');
    const { data: businesses, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, is_active, subscription_status, onboarding_completed, created_by')
      .limit(1);

    if (businessError) {
      if (businessError.message.includes('is_active') || 
          businessError.message.includes('subscription_status')) {
        checks.push({ name: 'businesses (modified)', status: '❌', error: 'New columns missing' });
        console.log('   ❌ businesses table not modified yet');
      } else {
        checks.push({ name: 'businesses (modified)', status: '❌', error: businessError.message });
      }
    } else {
      checks.push({ name: 'businesses (modified)', status: '✅' });
      console.log('   ✅ businesses table has new columns');
    }

    // Check 8: profiles table has new columns
    console.log('\n8️⃣ Checking profiles table modifications...');
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, invitation_accepted, invited_by, invited_at')
      .limit(1);

    if (profilesError) {
      if (profilesError.message.includes('invitation_accepted') || 
          profilesError.message.includes('invited_by')) {
        checks.push({ name: 'profiles (modified)', status: '❌', error: 'New columns missing' });
        console.log('   ❌ profiles table not modified yet');
      } else {
        checks.push({ name: 'profiles (modified)', status: '❌', error: profilesError.message });
      }
    } else {
      checks.push({ name: 'profiles (modified)', status: '✅' });
      console.log('   ✅ profiles table has new columns');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION VERIFICATION SUMMARY');
    console.log('='.repeat(50));

    const passed = checks.filter(c => c.status === '✅').length;
    const failed = checks.filter(c => c.status === '❌').length;

    console.log(`\n✅ Passed: ${passed}/${checks.length}`);
    console.log(`❌ Failed: ${failed}/${checks.length}`);

    if (failed > 0) {
      console.log('\n❌ FAILED CHECKS:');
      checks.filter(c => c.status === '❌').forEach(c => {
        console.log(`   - ${c.name}: ${c.error || 'Unknown error'}`);
      });
      console.log('\n⚠️  Please run the missing SQL sections from SUPABASE_MIGRATION_GUIDE.md');
    } else {
      console.log('\n🎉 ALL CHECKS PASSED!');
      console.log('\n✅ Phase 1 (Database Migration) is complete!');
      console.log('\n📋 Next Steps:');
      console.log('   1. Review the subscription plans in Supabase dashboard');
      console.log('   2. Proceed to Phase 2: Backend Controllers');
      console.log('   3. Run: Let me know when ready for Phase 2');
    }

  } catch (error) {
    console.error('\n❌ Verification failed with error:', error.message);
    console.error('Full error:', error);
  }
}

// Run verification
verifyMigration();
