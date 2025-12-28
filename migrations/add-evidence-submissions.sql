CREATE TABLE IF NOT EXISTS evidence_submissions (
    origin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    reference_url TEXT,
    submitted_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- status check constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_evidence_status') THEN
        ALTER TABLE evidence_submissions ADD CONSTRAINT check_evidence_status CHECK (status IN ('pending', 'verified', 'rejected'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_evidence_submissions_submitted_by ON evidence_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_evidence_submissions_status ON evidence_submissions(status);

-- Disable RLS
ALTER TABLE evidence_submissions DISABLE ROW LEVEL SECURITY;
