-- Clean up schema for production fix
-- Note: We drop these specific tables to ensure they are recreated correctly by schema.sql
-- This resolves issues with malformed 'notifications' and the rename from 'protocols' to 'products'

BEGIN;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS protocols CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

COMMIT;
