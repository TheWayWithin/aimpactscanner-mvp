LLMs.txt Capabilities & Tier Limitations
What the API Offers
The LLMtxtMastery API integration provides these capabilities:
Website Analysis (analyze action)
Analyzes website structure to discover pages
Extracts key content for LLMs.txt generation
Supports options like maxPages and includeSubdomains
Status Checking (status action)
Poll analysis progress (pending → processing → completed/failed)
Get analysis results including discovered pages
File Generation (generate action)
Creates optimized LLMs.txt file from completed analysis
Supports format options and metadata inclusion
File Download (download action)
Download the generated LLMs.txt file as plain text
Usage Statistics (usage action)
Check current usage against monthly limits
View remaining generations for the month
Tier-Based Limitations
Access is LIMITED by user tier:
Tier	Access	Monthly Limit	Price
Free	❌ No access	N/A	Free
Solo (Coffee)	❌ No access	N/A	$5/month
Growth	✅ Yes	25 generations/month	$20/month
Scale	✅ Yes	Unlimited	$50/month
How Limitations are Enforced
Location: supabase/functions/generate-llmstxt/index.ts:38-42
const ALLOWED_TIERS = ['growth', 'scale'];
const TIER_LIMITS: Record<string, number> = {
  growth: 25,  // 25 generations per month
  scale: -1,   // unlimited (-1 means no limit)
};
Enforcement happens at two levels:
Tier Access Check (lines 111-121): Blocks Free/Solo users entirely with 403 error
Usage Limit Check (lines 153-172): For Growth tier only, checks if monthly limit exceeded before starting analysis
Usage Tracking:
Each generation increments a counter in the llmstxt_generations table
Limits reset on the 1st of each month
Client-side UI shows usage progress bar for Growth tier (LLMsTxtPanel.jsx:234-271)
Key Insights
LLMs.txt is a premium feature - Only Growth and Scale tiers can access it
Growth tier has hard limit - Exactly 25 generations per month, tracked in database
Scale tier is truly unlimited - No usage tracking for Scale users
Usage is checked server-side - Client can't bypass limits by manipulating UI
Graceful degradation - If llmstxt_generations table missing, allows request (lines 402-405)

