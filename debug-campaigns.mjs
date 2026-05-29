import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://mcqeidrqprvngpghnifd.supabase.co', 'sb_publishable_BhYJz4XOmHwY9V752KV8gA_g7VHqdqX');

const { data: campaigns, error: cErr } = await supabase.from('campaigns').select('*');
console.log('=== CAMPAIGNS ===');
if (cErr) console.log('Error:', cErr);
else {
  campaigns.forEach(c => {
    console.log(`ID: ${c.id}`);
    console.log(`  title: ${c.title}`);
    console.log(`  discount_percent: ${c.discount_percent}`);
    console.log(`  applicable_item_ids: ${JSON.stringify(c.applicable_item_ids)}`);
    console.log(`  expires_at: ${c.expires_at}`);
    console.log(`  start_date: ${c.start_date} -> end_date: ${c.end_date}`);
    console.log(`  start_time: ${c.start_time} -> end_time: ${c.end_time}`);
    console.log('');
  });
}

const { data: menuItems, error: mErr } = await supabase.from('menu_items').select('id, name').limit(5);
console.log('=== MENU ITEMS (sample) ===');
if (mErr) console.log('Error:', mErr);
else menuItems.forEach(m => console.log(`  ${m.id} -> ${m.name}`));

process.exit(0);
