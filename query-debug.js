// Debug script to query database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://opbcoxndpszxnuwixmrm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wYmNveG5kcHN6eG51d2l4bXJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMzQyMjAsImV4cCI6MjA4MDYxMDIyMH0.-K1VtHKv8nqa-TLkmEul_8GJWp4zB8ra06vvdoSHuiM'
);

async function runQueries() {
  try {
    console.log('=== Query 1: SELECT * FROM visits LIMIT 1 ===');
    const { data: visits, error: e1 } = await supabase.from('visits').select('*').limit(1);
    if (e1) console.error('Error:', e1);
    else console.log(JSON.stringify(visits, null, 2));

    console.log('\n=== Query 2: SELECT id, nama FROM doctors LIMIT 3 ===');
    const { data: doctors, error: e2 } = await supabase.from('doctors').select('id, nama').limit(3);
    if (e2) {
      console.error('Error with nama field, trying different column names...');
      const { data: docs, error: e2b } = await supabase.from('doctors').select('*').limit(3);
      if (e2b) console.error('Error:', e2b);
      else console.log(JSON.stringify(docs, null, 2));
    } else {
      console.log(JSON.stringify(doctors, null, 2));
    }

    console.log('\n=== Query 3: SELECT id, queue_number, loket_id, status FROM queue_tickets LIMIT 3 ===');
    const { data: tickets, error: e3 } = await supabase.from('queue_tickets').select('id, queue_number, loket_id, status').limit(3);
    if (e3) {
      console.error('Error, trying all columns...');
      const { data: tix, error: e3b } = await supabase.from('queue_tickets').select('*').limit(3);
      if (e3b) console.error('Error:', e3b);
      else console.log(JSON.stringify(tix, null, 2));
    } else {
      console.log(JSON.stringify(tickets, null, 2));
    }

    console.log('\n=== Query 4: SELECT * FROM penjamin LIMIT 3 ===');
    const { data: penjamin, error: e4 } = await supabase.from('penjamin').select('*').limit(3);
    if (e4) console.error('Error:', e4);
    else console.log(JSON.stringify(penjamin, null, 2));

    console.log('\n=== Query 5: COUNT visits WHERE queue_ticket_id IS NOT NULL ===');
    const { count, error: e5 } = await supabase.from('visits').select('*', { count: 'exact', head: true }).not('queue_ticket_id', 'is', null);
    if (e5) console.error('Error:', e5);
    else console.log('Count:', count);

  } catch (error) {
    console.error('Fatal error:', error.message);
  }
}

runQueries();
