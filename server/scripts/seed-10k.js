// 10k Subscriptions Seed Script (Owner: Kishan)
// Generates 10,000 subscriptions, 1,000 customers, plans, products & variants
// to prove sub-2 second dashboard performance under realistic scale.

import { db } from '../src/db.js';
import { queryText } from '../src/sql.js';

async function seed() {
  console.log('🌱 Starting 10k Subscription Seed...');
  const start = performance.now();

  try {
    console.log('1/4 Clearing existing test records...');
    await db.script(queryText('seed_clear_all'));

    console.log('2/4 Inserting base catalogue, plans, and variants...');
    await db.script(queryText('seed_insert_catalogue_defaults'));

    console.log('3/4 Generating 10,000 subscriptions and matching lines via PostgreSQL engine...');
    await db.script(queryText('seed_generate_10k_data'));

    console.log('4/4 Verifying dataset counts...');
    const counts = await db.one('seed_count_check');

    const duration = ((performance.now() - start) / 1000).toFixed(2);
    console.log('\n======================================================');
    console.log(`✅ 10k Seed Completed Successfully in ${duration}s!`);
    console.log(`- Total Subscriptions: ${counts.total_subscriptions}`);
    console.log(`- Active Subscriptions: ${counts.active_subscriptions}`);
    console.log(`- Total Customers:     ${counts.total_customers}`);
    console.log(`- Subscription Lines:  ${counts.total_lines}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ 10k Seed failed:', err.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

seed();
