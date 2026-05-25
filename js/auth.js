// =============================================================================
// auth.js — Token validation + admin password (SHA-256)
// =============================================================================

function getTokenFromURL() {
  return new URLSearchParams(window.location.search).get('token');
}

async function validateToken(token) {
  if (!token) return null;
  const sb = getSupabaseClient();
  if (!sb) return null;
  const { data, error } = await sb.from('participants').select('*').eq('token', token).single();
  if (error || !data) return null;
  return data;
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyAdminPassword(input) {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { data, error } = await sb
    .from('app_config')
    .select('value')
    .eq('key', 'admin_password_hash')
    .single();
  if (error || !data) return false;
  const storedHash = typeof data.value === 'string' ? data.value : JSON.stringify(data.value);
  const clean = storedHash.replace(/^"|"$/g, '');
  const inputHash = await sha256Hex(input);
  if (clean === inputHash) {
    sessionStorage.setItem('wc_admin', '1');
    return true;
  }
  return false;
}

function isAdminAuthenticated() {
  return sessionStorage.getItem('wc_admin') === '1';
}

function adminLogout() {
  sessionStorage.removeItem('wc_admin');
}

async function isPredictionsLocked() {
  const sb = getSupabaseClient();
  if (!sb) return false;
  const { data } = await sb.from('app_config').select('value').eq('key', 'predictions_locked').single();
  return data?.value === true;
}

function generateToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('');
}

function requireSetup() {
  const url = (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL) || localStorage.getItem('wc_supabase_url');
  const key = (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) || localStorage.getItem('wc_supabase_anon_key');
  if (!url || !key) {
    window.location.href = 'setup.html';
    return true;
  }
  return false;
}
