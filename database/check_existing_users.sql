-- ========================================
-- QUICK TEST: Find Existing Users
-- ========================================
-- Run this first to see if you have any users

SELECT 
  p.id,
  p.name,
  p.role,
  p.business_id,
  p.is_active,
  b.name as business_name
FROM profiles p
LEFT JOIN businesses b ON p.business_id = b.id
ORDER BY p.created_at DESC
LIMIT 10;
