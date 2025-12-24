
import { getDb } from '../lib/db';

async function checkSchema() {
  const db = getDb();
  const columns = await db`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name IN ('tech_docs', 'target_audience', 'core_value_proposition', 'technical_specs', 'sme_access_note', 'youtube_link', 'video_url');
  `;
  console.log(JSON.stringify(columns, null, 2));
  process.exit(0);
}

checkSchema();

