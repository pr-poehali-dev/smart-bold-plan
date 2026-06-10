CREATE TABLE IF NOT EXISTS t_p84792529_smart_bold_plan.partner_applications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p84792529_smart_bold_plan.users(id),
  org_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);