# START MISSION PROMPT (for /coord after /clear)

Copy and paste this after running `/clear`:

---

**MISSION**: Tier & Pricing Realignment + Conversion Optimization

**PRIORITY**: P1 HIGH - Revenue Impact

**OBJECTIVE**: Implement conversion-optimized tier selector with Doug Hall Marketing Physics + Annual Pricing to increase conversion from 8-12% to 25-35%

**CURRENT STATUS**:
- ✅ Phase 1 (Strategic Analysis) - COMPLETE
- ✅ Phase 2 (UX Design) - COMPLETE
- 🎯 Phase 3 (Stripe Setup) - READY TO START

**APPROACH**: 8 phased implementation with Playwright test gates between each phase. Test in local dev (http://localhost:5173) before moving to staging.

**KEY DOCUMENTS**:
- `/project-plan.md` (lines 36-404) - Detailed 8-phase implementation plan (Phases 3-10)
- `/IMPLEMENTATION-ROADMAP.md` - Complete code changes reference with examples
- `/DYNAMIC-TIER-SELECTOR-UX-SPEC.md` - Full UX specification (Section 10: Annual Pricing)
- `/handoff-notes.md` - Doug Hall messaging framework + technical requirements

**PHASE OVERVIEW**:
1. Phase 3: Stripe Product Setup (manual - 6 products: 3 monthly + 3 annual)
2. Phase 4: Build billing toggle + basic tier selector (TierSelector.jsx rebuild)
3. Phase 5: Add 7-day trial integration (Growth tier only)
4. Phase 6: Doug Hall dynamic messaging (8 copy variations)
5. Phase 7: Mobile responsive + accessibility polish
6. Phase 8: Analytics tracking + feature gating
7. Phase 9: Staging deployment with full E2E suite
8. Phase 10: Production deployment + monitoring

**CRITICAL REQUIREMENTS**:
- Internal ID "coffee" stays in database → Display as "Solo" in UI
- Default state: Growth tier + Annual billing (anchoring effect)
- Test gate MUST PASS before moving to next phase
- Use staging database (isgzvwpjokcmtizstwru) for ALL testing - NEVER touch production
- All tests run on http://localhost:5173 first, then staging

**EXPECTED TIMELINE**: 10-12 days total

**SUCCESS METRICS**:
- All Playwright test gates pass
- Conversion rate: 8-12% → 25-35%
- Annual billing adoption: 30-40%
- Growth tier adoption: 70% of paid users

**START WITH**: Phase 3 (Stripe Product Setup) - see project-plan.md line 36

Please coordinate specialist agents to execute this mission systematically, ensuring each phase's test gate passes before proceeding.

---

