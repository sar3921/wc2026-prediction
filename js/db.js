// =============================================================================
// db.js — Supabase data access layer
// =============================================================================

function sb() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase未設定: setup.htmlを開いてください');
  return client;
}

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------
async function getParticipants() {
  const { data, error } = await sb().from('participants').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

async function getParticipantByToken(token) {
  const { data, error } = await sb().from('participants').select('*').eq('token', token).single();
  if (error) return null;
  return data;
}

async function addParticipant(name, token) {
  const { data, error } = await sb().from('participants').insert({ name, token }).select().single();
  if (error) throw error;
  return data;
}

async function deleteParticipant(id) {
  const { error } = await sb().from('participants').delete().eq('id', id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------
async function getPrediction(participantId) {
  const { data, error } = await sb()
    .from('predictions')
    .select('*')
    .eq('participant_id', participantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getAllPredictions() {
  const { data, error } = await sb().from('predictions').select('*');
  if (error) throw error;
  return data || [];
}

async function upsertPrediction(participantId, patch) {
  const payload = { participant_id: participantId, ...patch };
  const { error } = await sb()
    .from('predictions')
    .upsert(payload, { onConflict: 'participant_id' });
  if (error) throw error;
}

async function submitPrediction(participantId) {
  const { error } = await sb()
    .from('predictions')
    .upsert(
      { participant_id: participantId, submitted: true, submitted_at: new Date().toISOString() },
      { onConflict: 'participant_id' }
    );
  if (error) throw error;
}

async function resetPrediction(participantId) {
  const { error } = await sb()
    .from('predictions')
    .upsert(
      {
        participant_id: participantId,
        part_a: null, part_b: null, part_c: null,
        part_d: null, part_e: null, part_f: null,
        part_f_points: null,
        submitted: false, submitted_at: null,
      },
      { onConflict: 'participant_id' }
    );
  if (error) throw error;
}

async function setPartFPoints(participantId, points) {
  const { error } = await sb()
    .from('predictions')
    .upsert(
      { participant_id: participantId, part_f_points: points },
      { onConflict: 'participant_id' }
    );
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Tournament state
// ---------------------------------------------------------------------------
async function getTournamentState() {
  const { data, error } = await sb()
    .from('tournament_state')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data || {
    group_results: {},
    knockout_results: {},
    awards: {},
    japan_results: {},
    last_synced_at: null,
  };
}

async function upsertTournamentState(patch) {
  const payload = { id: 1, ...patch };
  const { error } = await sb()
    .from('tournament_state')
    .upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// App config
// ---------------------------------------------------------------------------
async function getConfig(key) {
  const { data, error } = await sb()
    .from('app_config')
    .select('value')
    .eq('key', key)
    .single();
  if (error) return null;
  return data?.value;
}

async function setConfig(key, value) {
  const { error } = await sb()
    .from('app_config')
    .upsert({ key, value }, { onConflict: 'key' });
  if (error) throw error;
}

async function getAllConfig() {
  const { data, error } = await sb()
    .from('app_config')
    .select('key, value')
    .neq('key', 'admin_password_hash');
  if (error) throw error;
  const result = {};
  (data || []).forEach(row => { result[row.key] = row.value; });
  return result;
}
