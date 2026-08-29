const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sbqleiyzysrvpgiivztp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicWxlaXl6eXNydnBnaWl2enRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5ODYzNzcsImV4cCI6MjEwMzU2MjM3N30.nCjoOs7u2Yn9GuyhhR1a4i355dusD6HmZr4n0ilFtlc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Creating dummy user...");
  const dummyEmail = `test${Date.now()}@example.com`;
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: dummyEmail,
    password: 'password123'
  });

  if (authError) {
      console.error("Auth error:", authError);
      return;
  }

  console.log("User created, ID:", authData.user.id);
  
  // Wait a sec for triggers
  await new Promise(r => setTimeout(r, 1000));

  console.log("Testing group creation...");
  const { data: convRaw, error: convError } = await supabase
      .from('conversations')
      .insert({
        type: 'group',
        name: 'Test Group',
        created_by: authData.user.id
      })
      .select()
      .single();

  if (convError) {
      console.error('Error creating conversation:', JSON.stringify(convError, null, 2));
  } else {
      console.log('Success:', convRaw);
  }
}

test();
