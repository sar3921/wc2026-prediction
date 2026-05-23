// =============================================================================
// config.js — Supabase client + WC 2026 constants
// =============================================================================

// ---------------------------------------------------------------------------
// Supabase client (credentials stored in localStorage after setup.html)
// ---------------------------------------------------------------------------
function getSupabaseClient() {
  const url = localStorage.getItem('wc_supabase_url');
  const key = localStorage.getItem('wc_supabase_anon_key');
  if (!url || !key) return null;
  return window.supabase.createClient(url, key);
}

// ---------------------------------------------------------------------------
// WC 2026 — 48 qualified teams
// ---------------------------------------------------------------------------
const ALL_TEAMS = [
  // UEFA (16)
  'Germany','England','France','Spain','Portugal','Netherlands',
  'Belgium','Austria','Switzerland','Croatia','Serbia','Scotland',
  'Turkey','Ukraine','Denmark','Hungary',
  // CONMEBOL (6)
  'Argentina','Brazil','Uruguay','Colombia','Ecuador','Venezuela',
  // CONCACAF (6 — including 3 hosts)
  'United States','Mexico','Canada','Panama','Honduras','Jamaica',
  // CAF (9)
  'Morocco','Senegal','Egypt','Ivory Coast','Cameroon',
  'Nigeria','South Africa','Algeria','DR Congo',
  // AFC (8)
  'Japan','South Korea','Iran','Saudi Arabia',
  'Australia','Jordan','Iraq','Uzbekistan',
  // OFC (1)
  'New Zealand',
  // Intercontinental playoff spots (2) — placeholder until confirmed
  'Slovenia','Greece',
];

// ---------------------------------------------------------------------------
// WC 2026 Groups (drawn December 5, 2024 — verify before deployment)
// Update this object with the official group draw results.
// ---------------------------------------------------------------------------
const WC2026_GROUPS = {
  A: ['United States', 'Uruguay', 'Bolivia', 'Panama'],
  B: ['Mexico', 'Jamaica', 'Venezuela', 'Ecuador'],
  C: ['Canada', 'Morocco', 'Croatia', 'Belgium'],
  D: ['Japan', 'Germany', 'Australia', 'Ivory Coast'],
  E: ['Spain', 'Colombia', 'Hungary', 'Senegal'],
  F: ['England', 'Argentina', 'Serbia', 'Algeria'],
  G: ['France', 'Brazil', 'Portugal', 'DR Congo'],
  H: ['Netherlands', 'South Korea', 'United States', 'Honduras'],
  I: ['Austria', 'Iran', 'Nigeria', 'Greece'],
  J: ['Switzerland', 'Jordan', 'Turkey', 'Cameroon'],
  K: ['Denmark', 'Saudi Arabia', 'South Africa', 'Slovenia'],
  L: ['Ukraine', 'Iraq', 'Egypt', 'New Zealand'],
};
// NOTE: Groups above are estimates. Verify with the official FIFA draw results
// and update if needed. Japan's opponents (Group D) are critical for PART E.

// ---------------------------------------------------------------------------
// Japan's 3 group-stage matches for PART E prediction
// Update opponents and dates to match the official schedule.
// ---------------------------------------------------------------------------
const JAPAN_GROUP_MATCHES = [
  { match: 1, opponent: 'Germany',      date: '2026-06-??' },
  { match: 2, opponent: 'Australia',    date: '2026-06-??' },
  { match: 3, opponent: 'Ivory Coast',  date: '2026-06-??' },
];

// ---------------------------------------------------------------------------
// Team name display map (English → カタカナ)
// Internal data and API matching always use English keys.
// ---------------------------------------------------------------------------
const TEAM_NAMES_JA = {
  // UEFA
  'Germany':       'ドイツ',
  'England':       'イングランド',
  'France':        'フランス',
  'Spain':         'スペイン',
  'Portugal':      'ポルトガル',
  'Netherlands':   'オランダ',
  'Belgium':       'ベルギー',
  'Austria':       'オーストリア',
  'Switzerland':   'スイス',
  'Croatia':       'クロアチア',
  'Serbia':        'セルビア',
  'Scotland':      'スコットランド',
  'Turkey':        'トルコ',
  'Ukraine':       'ウクライナ',
  'Denmark':       'デンマーク',
  'Hungary':       'ハンガリー',
  // CONMEBOL
  'Argentina':     'アルゼンチン',
  'Brazil':        'ブラジル',
  'Uruguay':       'ウルグアイ',
  'Colombia':      'コロンビア',
  'Ecuador':       'エクアドル',
  'Venezuela':     'ベネズエラ',
  // CONCACAF
  'United States': 'アメリカ',
  'Mexico':        'メキシコ',
  'Canada':        'カナダ',
  'Panama':        'パナマ',
  'Honduras':      'ホンジュラス',
  'Jamaica':       'ジャマイカ',
  // CAF
  'Morocco':       'モロッコ',
  'Senegal':       'セネガル',
  'Egypt':         'エジプト',
  'Ivory Coast':   'コートジボワール',
  'Cameroon':      'カメルーン',
  'Nigeria':       'ナイジェリア',
  'South Africa':  '南アフリカ',
  'Algeria':       'アルジェリア',
  'DR Congo':      'コンゴ民主共和国',
  // AFC
  'Japan':         '日本',
  'South Korea':   '韓国',
  'Iran':          'イラン',
  'Saudi Arabia':  'サウジアラビア',
  'Australia':     'オーストラリア',
  'Jordan':        'ヨルダン',
  'Iraq':          'イラク',
  'Uzbekistan':    'ウズベキスタン',
  // OFC
  'New Zealand':   'ニュージーランド',
  // プレーオフ枠
  'Slovenia':      'スロベニア',
  'Greece':        'ギリシャ',
  'Bolivia':       'ボリビア',
};

// 英語名 → 表示名（カタカナがあればカタカナ、なければ英語そのまま）
function teamJa(en) {
  return TEAM_NAMES_JA[en] || en;
}

// ---------------------------------------------------------------------------
// Round labels (Japanese)
// ---------------------------------------------------------------------------
const ROUND_LABELS = {
  group:    'グループ敗退',
  r32:      'ベスト32',
  r16:      'ベスト16',
  qf:       'ベスト8',
  sf:       'ベスト4',
  final:    '決勝',
  champion: '優勝',
};
const ROUND_ORDER = ['group','r32','r16','qf','sf','final','champion'];

// ---------------------------------------------------------------------------
// API base (football-data.org)
// ---------------------------------------------------------------------------
const API_BASE = 'https://api.football-data.org/v4';
const WC_CODE  = 'WC';

// API stage string → our round key
const API_STAGE_MAP = {
  'GROUP_STAGE':    'group',
  'LAST_32':        'r32',
  'LAST_16':        'r16',
  'QUARTER_FINALS': 'qf',
  'SEMI_FINALS':    'sf',
  'FINAL':          'final',
};
