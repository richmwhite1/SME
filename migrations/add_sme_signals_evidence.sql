-- Add sme_signals and truth_evidence columns if they don't exist

DO $$
BEGIN
    -- Add sme_signals column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sme_signals') THEN
        ALTER TABLE products ADD COLUMN sme_signals JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add truth_evidence column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'truth_evidence') THEN
        ALTER TABLE products ADD COLUMN truth_evidence JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add sme_access_note column if missing (fixing potential previous oversight)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sme_access_note') THEN
        ALTER TABLE products ADD COLUMN sme_access_note TEXT;
    END IF;

END $$;
