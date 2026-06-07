ALTER TABLE t_p84792529_smart_bold_plan.users
  ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
  ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255);

UPDATE t_p84792529_smart_bold_plan.users SET password_hash = '' WHERE password_hash IS NULL;

CREATE TABLE IF NOT EXISTS t_p84792529_smart_bold_plan.sms_codes (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 minutes',
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON t_p84792529_smart_bold_plan.sms_codes(phone);
CREATE INDEX IF NOT EXISTS idx_users_oauth ON t_p84792529_smart_bold_plan.users(oauth_provider, oauth_id);