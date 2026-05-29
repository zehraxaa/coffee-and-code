const https = require('https');

const SUPABASE_URL = 'https://mcqeidrqprvngpghnifd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_BhYJz4XOmHwY9V752KV8gA_g7VHqdqX';

function fetchTable(table) {
  return new Promise((resolve, reject) => {
    const url = new URL(`/rest/v1/${table}?select=*`, SUPABASE_URL);
    const options = {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(data); }
      });
    }).on('error', reject);
  });
}

(async function() {
  try {
    const campaigns = await fetchTable('campaigns');
    console.log('=== CAMPAIGNS ===');
    if (Array.isArray(campaigns)) {
      campaigns.forEach(function(c) {
        console.log('ID:', c.id);
        console.log('  title:', c.title);
        console.log('  discount_percent:', c.discount_percent);
        console.log('  applicable_item_ids:', JSON.stringify(c.applicable_item_ids));
        console.log('  expires_at:', c.expires_at);
        console.log('  start_date:', c.start_date, '-> end_date:', c.end_date);
        console.log('  start_time:', c.start_time, '-> end_time:', c.end_time);
        console.log('');
      });
      if (campaigns.length === 0) console.log('  (no campaigns found)');
    } else {
      console.log('Unexpected response:', JSON.stringify(campaigns));
    }

    const menuItems = await fetchTable('menu_items');
    console.log('\n=== MENU ITEMS ===');
    if (Array.isArray(menuItems)) {
      menuItems.forEach(function(m) {
        console.log('  ' + m.id + ' -> ' + m.name + ' (price: ' + m.price + ')');
      });
    } else {
      console.log('Unexpected response:', JSON.stringify(menuItems));
    }
  } catch (e) {
    console.error('Error:', e);
  }
})();
