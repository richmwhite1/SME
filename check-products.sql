-- Quick check to see if products exist
SELECT 
  id, 
  title, 
  is_flagged, 
  is_sme_certified,
  created_at
FROM protocols
ORDER BY created_at DESC
LIMIT 25;




