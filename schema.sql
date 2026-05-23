-- ============================================================
-- WC2026 予想レース — Supabase スキーマ
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行
-- ============================================================

-- 参加者テーブル
CREATE TABLE IF NOT EXISTS participants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  token      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 予想テーブル（参加者ごとに1行）
CREATE TABLE IF NOT EXISTS predictions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  part_a         JSONB,
  part_b         JSONB,
  part_c         JSONB,
  part_d         JSONB,
  part_e         JSONB,
  part_f         JSONB,
  part_f_points  INTEGER DEFAULT NULL,
  submitted      BOOLEAN DEFAULT FALSE,
  submitted_at   TIMESTAMPTZ,
  UNIQUE(participant_id)
);

-- 大会状態テーブル（常に id=1 の1行のみ）
CREATE TABLE IF NOT EXISTS tournament_state (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  group_results    JSONB DEFAULT '{}'::jsonb,
  knockout_results JSONB DEFAULT '{}'::jsonb,
  awards           JSONB DEFAULT '{}'::jsonb,
  japan_results    JSONB DEFAULT '{}'::jsonb,
  last_synced_at   TIMESTAMPTZ,
  raw_api_cache    JSONB DEFAULT '{}'::jsonb
);

-- 初期行を挿入
INSERT INTO tournament_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- アプリ設定テーブル
CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 初期設定値
INSERT INTO app_config (key, value) VALUES
  ('admin_password_hash', '"CHANGE_ME"'),
  ('predictions_locked',  'false'),
  ('dark_horse_pool',     '[]'),
  ('api_key',             '"CHANGE_ME"'),
  ('tournament_start',    'null')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- Row Level Security (RLS)
-- 5人のプライベートゲーム用：全テーブルをpublicで公開
-- ============================================================

ALTER TABLE participants     ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config       ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み書き可能（anon キーで操作できる）
CREATE POLICY "public_all_participants"     ON participants     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_predictions"      ON predictions      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_tournament_state" ON tournament_state FOR ALL USING (true) WITH CHECK (true);

-- app_config: admin_password_hash は SELECT 不可、それ以外は全操作可
CREATE POLICY "config_hide_password" ON app_config
  FOR SELECT USING (key != 'admin_password_hash');
CREATE POLICY "config_write_all" ON app_config
  FOR ALL USING (true) WITH CHECK (true);
