# AImpactScanner Planning & Strategy
## Updated: November 13, 2025

## Current Sprint: Authenticity & Branding Overhaul

### Mission
Transform AImpactScanner from corporate facade to authentic solopreneur tool with honest, evidence-based claims and real client references.

### Key Principles
1. **Authenticity First**: We are a solopreneur, not a corporation
2. **Evidence-Based**: All claims must be sourced or removed
3. **Real Clients Only**: Use actual 7 sites, not made-up numbers
4. **Overt Benefits**: Clear, dramatic differences between tiers
5. **Pre-Qualified Traffic**: AI searchers have intent - they're ready to buy

## Implementation Plan

### Phase 1: Critical Removals (30 mins)
- [ ] Remove all "5,247 businesses" references
- [ ] Remove "65% of businesses losing traffic" claim
- [ ] Remove fake testimonials (Sarah Chen, etc.)
- [ ] Remove unsourced percentage claims
- [ ] Update test expectations

### Phase 2: Add Real Data (30 mins)
- [ ] Add real client list (7 sites):
  - Freecalchub.com
  - Evolve-7.com
  - Agent-11.com
  - Agents-11.com
  - llmtxtmastery.com
  - aisearchmastery.com
  - MCP-11.com
- [ ] Update social proof sections
- [ ] Add solopreneur messaging

### Phase 3: Reframe Messaging (1 hour)
- [ ] Rewrite TeaserResults warnings (focus on pre-qualified traffic)
- [ ] Update ROI Calculator with honest methodology
- [ ] Fix CompetitorComparison claims
- [ ] Create authentic benefit statements

### Phase 4: Testing (30 mins)
- [ ] Update Playwright tests for new content
- [ ] Verify all changes work
- [ ] Test user flow with authentic messaging

## Key Message Changes

### OLD (Corporate/Fake)
- "You're losing X visitors worth $Y"
- "5,247 businesses trust us"
- "65% of businesses losing traffic"
- "Guaranteed 10x performance"
- Random percentages without sources

### NEW (Authentic/Real)
- "AI-generated traffic is pre-qualified and more likely to convert"
- "Trusted by 7 pioneering sites"
- "AI searchers have specific intent - they're ready to buy"
- "Built by a solopreneur, for solopreneurs"
- "Based on analysis of real client data"

## Benefit Differentiation

### Free Tier (Clear & Overt)
- See your actual AI readiness score
- Identify your biggest AI visibility gaps
- Get 3 analyses per month to track progress
- Perfect for testing the waters

### Coffee Tier ($5/month - Dramatically Different)
- Unlimited analyses for continuous optimization
- Track improvements over time with history
- Perfect for solopreneurs and small teams
- Less than a coffee, more than a report
- Built for people who ship fast and iterate

## Files to Update

### High Priority
- `src/components/Landing.jsx` - Main landing page
- `src/components/LandingEnhanced.jsx` - Enhanced landing
- `src/components/TeaserResults.jsx` - Analysis results
- `src/components/PricingTiers.jsx` - Pricing display
- `src/components/PricingPage.jsx` - Pricing page

### Medium Priority
- `src/components/ROICalculator.jsx` - ROI calculations
- `src/components/CompetitorComparison.jsx` - Competitor data
- `src/components/SmartUpgradePrompt.jsx` - Upgrade messaging

### Test Updates Required
- All tests checking for "5,247"
- All tests checking for "Sarah Chen"
- All tests checking for specific percentages
- Update expectations for new messaging

## Success Criteria
✅ No unsourced statistics remain
✅ All testimonials are real or removed
✅ Benefits are clear, overt, and differentiated
✅ Solopreneur authenticity shines through
✅ AI traffic value properly explained
✅ Real client list displayed
✅ Tests updated and passing

## Technical Debt & Future Enhancements

### Completed Recently
- ✅ LocalStorage-based analysis history
- ✅ Client-side usage tracking (3/month limit)
- ✅ Enhanced dashboard with history
- ✅ Coffee tier unlimited access

### Still Pending
- [ ] PDF export functionality
- [ ] First-time user welcome messages
- [ ] Dynamic issue prioritization (show biggest problem first)
- [ ] Railway + PocketFlow backend migration

## Architecture Notes

### Current Issues
- Database queries timeout after 10 seconds
- Using simplified components as workaround
- All features work without database dependency

### Planned Solution
- Migrate backend to Railway
- Integrate PocketFlow LLM framework (100 lines, zero deps)
- Keep Netlify for frontend
- Keep Supabase for auth/database (connect from Railway)

## Business Model

### Current Reality
- Solopreneur operation
- Zero employees
- Fully automated
- Built as side project while working corporate job

### Competitive Advantage
- Authentic, not corporate
- Real MASTERY-AI Framework compliance
- Evidence-based scoring (30-95% ranges)
- Built by someone who needs it themselves
- No VC funding = no growth-at-all-costs pressure

## Next Steps After Branding Update

1. Complete authenticity overhaul
2. Test with real users
3. Gather genuine testimonials
4. Consider Railway migration for reliability
5. Build dynamic prioritization based on user's actual issues
6. Create case studies from 7 real clients

---

*Remember: Authenticity > Growth Hacks*
*Build what's real, not what sounds impressive*