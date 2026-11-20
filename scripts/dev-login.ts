// Prints a one-time sign-in URL for a test account, so local testing does not wait for email.
// Run: node --env-file=.env.local scripts/dev-login.ts [email] [origin]
import { createClient } from '@supabase/supabase-js';

const email = process.argv[2] ?? 'ix-test@example.com';
const origin = process.argv[3] ?? 'http://localhost:3000';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
if (error) throw error;
console.log(`${origin}/auth/callback?token_hash=${data.properties.hashed_token}&type=${data.properties.verification_type}`);
