-- Create main tables for BlackBurn fitness platform

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  nickname TEXT,
  gender TEXT CHECK (gender IN ('male','female','other')) DEFAULT 'other',
  age INT,
  height_cm INT,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' | 'admin'
  referred_by BIGINT, -- telegram_id of referrer
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id BIGINT UNIQUE REFERENCES users(telegram_id) ON DELETE CASCADE,
  balance_toman BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_ledger (
  id BIGSERIAL PRIMARY KEY,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  amount_toman BIGINT NOT NULL,
  reason TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(telegram_id) ON DELETE CASCADE,
  nickname TEXT,
  gender TEXT,
  age INT,
  height_cm INT,
  last_weight_kg NUMERIC,
  premium BOOLEAN DEFAULT FALSE,
  plan_status TEXT DEFAULT 'none', -- 'none'|'processing'|'ready'
  onboarding_state TEXT DEFAULT 'ask_nickname',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weights (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  kg NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  method TEXT, -- 'bank_transfer'
  amount_toman BIGINT NOT NULL,
  friend_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending'|'approved'|'rejected'|'more_proof'
  receipt_url TEXT,
  admin_note TEXT,
  admin_decided_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_telegram_id BIGINT REFERENCES users(telegram_id),
  referee_telegram_id BIGINT REFERENCES users(telegram_id),
  credited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(telegram_id) ON DELETE CASCADE,
  content TEXT,
  file_url TEXT,
  delivered_by BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit (
  id BIGSERIAL PRIMARY KEY,
  admin_telegram_id BIGINT,
  action TEXT,
  target_user BIGINT,
  meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_walletledger_wallet ON wallet_ledger(wallet_id);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_weights_user_id ON weights(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_telegram_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit(admin_telegram_id);

-- Helper function for referral credits count
CREATE OR REPLACE FUNCTION referrer_credits_this_month(referrer BIGINT)
RETURNS INT AS $$
  SELECT COUNT(*)::INT FROM wallet_ledger wl
  JOIN wallets w ON wl.wallet_id = w.id
  JOIN users u ON w.user_id = u.telegram_id
  WHERE u.telegram_id = referrer
    AND wl.reason = 'referral_reward'
    AND wl.created_at >= date_trunc('month', now());
$$ LANGUAGE sql;