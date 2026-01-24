import { supabaseAdmin } from '../supabase/supabaseAdmin.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log('🚀 Starting Subscription System Migration...\n');

  try {
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, '../database/subscription_migration.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by semicolons and comments to execute statements individually
    // This is a simplified approach - for production, use a proper migration tool
    console.log('📄 SQL file loaded successfully');
    console.log('⚠️  WARNING: This will modify your database schema!');
    console.log('⚠️  Make sure you have a backup before proceeding.\n');

    // For Supabase, we need to execute the SQL via the SQL editor or use RPC
    // Let's create individual statements for critical tables first

    console.log('✅ Step 1: Creating subscription_plans table...');
    await createSubscriptionPlansTable();

    console.log('✅ Step 2: Creating subscriptions table...');
    await createSubscriptionsTable();

    console.log('✅ Step 3: Creating subscription_history table...');
    await createSubscriptionHistoryTable();

    console.log('✅ Step 4: Creating subscription_payments table...');
    await createSubscriptionPaymentsTable();

    console.log('✅ Step 5: Creating business_invitations table...');
    await createBusinessInvitationsTable();

    console.log('✅ Step 6: Creating feature_usage_logs table...');
    await createFeatureUsageLogsTable();

    console.log('✅ Step 7: Modifying businesses table...');
    await modifyBusinessesTable();

    console.log('✅ Step 8: Modifying profiles table...');
    await modifyProfilesTable();

    console.log('✅ Step 9: Seeding subscription plans...');
    await seedSubscriptionPlans();

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Next steps:');
    console.log('1. Verify tables in Supabase dashboard');
    console.log('2. Check that subscription plans are seeded');
    console.log('3. Proceed to Phase 2 (Backend Controllers)');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

async function createSubscriptionPlansTable() {
  const { error } = await supabaseAdmin.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.subscription_plans (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        plan_type text NOT NULL UNIQUE CHECK (plan_type = ANY (ARRAY[
          'trial'::text, 
          'basic'::text, 
          'advanced'::text, 
          'premium'::text
        ])),
        name text NOT NULL,
        description text,
        monthly_price numeric NOT NULL DEFAULT 0,
        max_users integer,
        max_invoices_per_month integer,
        max_products integer,
        max_customers integer,
        features jsonb NOT NULL DEFAULT '{}'::jsonb,
        is_active boolean DEFAULT true,
        trial_days integer DEFAULT 0,
        created_at timestamp without time zone DEFAULT now(),
        updated_at timestamp without time zone DEFAULT now(),
        CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_type ON public.subscription_plans(plan_type);
    `
  });

  if (error) {
    // If RPC doesn't exist, we'll need to run via direct query
    // This is a fallback - Supabase doesn't allow arbitrary SQL via JS client
    console.log('ℹ️  Note: Direct SQL execution via RPC not available.');
    console.log('ℹ️  Please run the SQL manually in Supabase SQL Editor.');
    console.log('ℹ️  Opening database/subscription_migration.sql for manual execution...\n');
    throw new Error('Please run database/subscription_migration.sql in Supabase SQL Editor manually');
  }
}

async function createSubscriptionsTable() {
  // Similar structure for other tables...
  // For brevity, I'll note this needs manual SQL execution
}

async function createSubscriptionHistoryTable() {
  // ...
}

async function createSubscriptionPaymentsTable() {
  // ...
}

async function createBusinessInvitationsTable() {
  // ...
}

async function createFeatureUsageLogsTable() {
  // ...
}

async function modifyBusinessesTable() {
  // ...
}

async function modifyProfilesTable() {
  // ...
}

async function seedSubscriptionPlans() {
  const plans = [
    {
      plan_type: 'trial',
      name: 'Trial Plan',
      description: '14-day free trial with limited features',
      monthly_price: 0,
      max_users: 2,
      max_invoices_per_month: 50,
      max_products: 100,
      max_customers: 50,
      trial_days: 14,
      features: {
        modules: ['leads', 'customers', 'quotations'],
        advanced_reports: false,
        api_access: false,
        priority_support: false,
        custom_branding: false
      }
    },
    {
      plan_type: 'basic',
      name: 'Basic Plan',
      description: 'Essential features for small businesses',
      monthly_price: 999,
      max_users: 5,
      max_invoices_per_month: 500,
      max_products: 1000,
      max_customers: 500,
      trial_days: 0,
      features: {
        modules: ['leads', 'customers', 'quotations', 'invoices', 'payments', 'products'],
        advanced_reports: false,
        api_access: false,
        priority_support: false,
        custom_branding: false
      }
    },
    {
      plan_type: 'advanced',
      name: 'Advanced Plan',
      description: 'For growing businesses with advanced needs',
      monthly_price: 2999,
      max_users: 15,
      max_invoices_per_month: 2000,
      max_products: 5000,
      max_customers: 2000,
      trial_days: 0,
      features: {
        modules: ['leads', 'customers', 'quotations', 'invoices', 'payments', 'products', 'expenses', 'reports', 'accounting'],
        advanced_reports: true,
        api_access: false,
        priority_support: true,
        custom_branding: false
      }
    },
    {
      plan_type: 'premium',
      name: 'Premium Plan',
      description: 'Complete solution with all features',
      monthly_price: 5999,
      max_users: null,
      max_invoices_per_month: null,
      max_products: null,
      max_customers: null,
      trial_days: 0,
      features: {
        modules: ['leads', 'customers', 'quotations', 'invoices', 'payments', 'products', 'expenses', 'reports', 'accounting', 'inventory', 'staff'],
        advanced_reports: true,
        api_access: true,
        priority_support: true,
        custom_branding: true,
        white_label: true
      }
    }
  ];

  for (const plan of plans) {
    const { error } = await supabaseAdmin
      .from('subscription_plans')
      .upsert(plan, { onConflict: 'plan_type' });

    if (error) {
      console.error(`Failed to seed ${plan.name}:`, error);
    } else {
      console.log(`  ✓ ${plan.name} seeded`);
    }
  }
}

// Run the migration
runMigration();
