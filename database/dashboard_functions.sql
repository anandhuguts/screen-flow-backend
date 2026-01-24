-- ═══════════════════════════════════════════════════════════════
-- CREATE DASHBOARD FUNCTIONS
-- Run these in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- FUNCTION 1: Get Lead Sources (Fixed)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_lead_sources(b_id uuid)
RETURNS TABLE (
    source text,
    count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.source,
        COUNT(*)::bigint as count
    FROM leads l
    WHERE l.business_id = b_id
    GROUP BY l.source
    ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────
-- FUNCTION 2: Monthly Sales Summary (Check if exists)
-- ─────────────────────────────────────────────────────────────
-- If this function doesn't exist, create it:

CREATE OR REPLACE FUNCTION monthly_sales_summary(b_id uuid)
RETURNS TABLE (
    month text,
    sales numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(p.payment_date, 'Mon') as month,
        SUM(p.amount) as sales
    FROM payments p
    WHERE p.business_id = b_id
      AND p.payment_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY TO_CHAR(p.payment_date, 'Mon'), DATE_PART('month', p.payment_date)
    ORDER BY DATE_PART('month', MIN(p.payment_date));
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════
-- TEST THE FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

-- Test lead sources (replace with your business_id)
SELECT * FROM get_lead_sources('76834d81-ce40-43f5-8082-1e08809663ff');

-- Expected output:
-- source   | count
-- ---------+-------
-- phone    | 1

-- Test monthly sales
SELECT * FROM monthly_sales_summary('76834d81-ce40-43f5-8082-1e08809663ff');

-- Expected output:
-- month | sales
-- ------+-------
-- Jan   | 236
