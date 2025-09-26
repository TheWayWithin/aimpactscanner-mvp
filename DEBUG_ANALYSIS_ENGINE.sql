-- DEBUG QUERIES FOR ANALYSIS ENGINE ISSUES
-- Run these to diagnose why analyses are stuck in processing

-- 1. IDENTIFY STUCK ANALYSES
-- Find analyses that have been processing for more than 5 minutes
SELECT 
    id,
    url,
    created_at,
    status,
    EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_stuck,
    scores,
    error_details
FROM analyses 
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;

-- 2. CHECK FOR ERROR PATTERNS  
-- Look for common error messages in failed analyses
SELECT 
    error_details,
    COUNT(*) as error_count,
    MIN(created_at) as first_occurrence,
    MAX(created_at) as last_occurrence
FROM analyses 
WHERE error_details IS NOT NULL 
GROUP BY error_details
ORDER BY error_count DESC;

-- 3. ANALYSIS SUCCESS RATE BY DATE
-- Track when analyses started failing
SELECT 
    DATE(created_at) as analysis_date,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as stuck_processing,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate_percent
FROM analyses 
WHERE created_at >= NOW() - INTERVAL '14 days'
GROUP BY DATE(created_at)
ORDER BY analysis_date DESC;

-- 4. IDENTIFY PROBLEMATIC URLS
-- Check if specific URLs are consistently failing
SELECT 
    url,
    COUNT(*) as attempts,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as stuck,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
    ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM analyses 
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY url
HAVING COUNT(*) > 1
ORDER BY success_rate ASC, attempts DESC;

-- 5. USER ANALYSIS PATTERNS
-- Check if issues are user-specific
SELECT 
    u.email,
    u.tier,
    COUNT(*) as total_analyses,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN a.status = 'processing' THEN 1 END) as stuck,
    ROUND(COUNT(CASE WHEN a.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM analyses a
JOIN users u ON a.user_id = u.id
WHERE a.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.email, u.tier
HAVING COUNT(*) >= 3
ORDER BY success_rate ASC;

-- 6. RECENT ANALYSIS TIMELINE  
-- Show chronological view of recent analysis attempts
SELECT 
    created_at,
    url,
    status,
    CASE 
        WHEN scores = '{}' THEN 'Empty scores'
        WHEN scores->>'overall' IS NOT NULL THEN 'Has overall score'
        ELSE 'Unknown scores format'
    END as scores_status,
    error_details
FROM analyses 
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 7. DETECT POTENTIAL EDGE FUNCTION ISSUES
-- Look for patterns that suggest function timeouts or crashes
SELECT 
    'Potential timeout issues' as issue_type,
    COUNT(*) as affected_analyses
FROM analyses 
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '5 minutes'
AND error_details IS NULL

UNION ALL

SELECT 
    'Empty scores in completed' as issue_type,
    COUNT(*) as affected_analyses  
FROM analyses
WHERE status = 'completed'
AND scores = '{}'

UNION ALL

SELECT 
    'Recent failures' as issue_type,
    COUNT(*) as affected_analyses
FROM analyses
WHERE status = 'failed'  
AND created_at >= NOW() - INTERVAL '24 hours';

-- 8. CLEANUP COMMAND (RUN AFTER DEBUGGING)
-- Reset stuck analyses to pending for retry (only after fixing root cause)
-- UPDATE analyses 
-- SET status = 'pending', error_details = NULL
-- WHERE status = 'processing' 
-- AND created_at < NOW() - INTERVAL '10 minutes';