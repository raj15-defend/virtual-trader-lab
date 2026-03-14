
-- Activity logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
  ON public.activity_logs FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity logs"
  ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Login attempts table (for security tracking)
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Anyone can insert login attempts (happens before auth)
CREATE POLICY "Anyone can insert login attempts"
  ON public.login_attempts FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users can read their own attempts
CREATE POLICY "Users can view login attempts for their email"
  ON public.login_attempts FOR SELECT TO authenticated
  USING (true);

-- Fraud alerts table
CREATE TABLE public.fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  description text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own fraud alerts"
  ON public.fraud_alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fraud alerts"
  ON public.fraud_alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- AI predictions cache table
CREATE TABLE public.ai_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_symbol text NOT NULL,
  prediction_type text NOT NULL,
  prediction_data jsonb NOT NULL DEFAULT '{}',
  confidence numeric,
  recommendation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour')
);

ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view AI predictions"
  ON public.ai_predictions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "System can insert predictions"
  ON public.ai_predictions FOR INSERT TO authenticated
  WITH CHECK (true);
