# Project Plan - Linked Transparency Feature Implementation

## Executive Summary
Feature enhancement mission to implement linked transparency scoring: award partial credit when homepages link to transparency pages, guiding users to scan those pages for complete assessment.

## Mission Phases

### Phase 1: Architecture Design [x]
- [x] Review existing link detection patterns (lines 1214-1230)
- [x] Design `detectTransparencyLinks()` helper function
- [x] Define link pattern matching (about, privacy, disclosure, etc.)
- [x] Design scoring integration logic
- [x] Document function signatures and return types
- [x] Validate approach with existing codebase patterns

**Findings**: Followed exact same link detection pattern as existing code. No new paradigms introduced.

### Phase 2: Implementation [x]
- [x] Implement `detectTransparencyLinks()` function (lines 914-1002)
- [x] Integrate into `analyzeTransparencyDisclosure()` (lines 1056-1090)
- [x] Add scoring logic for linked pages
- [x] Update evidence messages
- [x] Update recommendation messages with detected links
- [x] Ensure backward compatibility

**Implementation**: 88 lines added, 1 line modified (function signature). Zero breaking changes.

### Phase 3: Testing [x]
- [x] Create test file with comprehensive cases
- [x] Test: No links scenario
- [x] Test: Single link scenario (+15 pts)
- [x] Test: Multiple links scenario (+25 pts)
- [x] Test: Full transparency content (regression)
- [x] Test: External links only (no bonus)
- [x] Validate with freecalchub.com actual HTML

**Test Results**: 12/12 tests passed (100% success rate)

### Phase 4: Deployment [x]
- [x] Test locally with Supabase functions
- [x] Verify all test cases pass
- [x] Deploy to production Edge Function
- [ ] Test with live freecalchub.com URL (user validation required)
- [ ] Monitor for errors or issues (ongoing)

**Deployment**: Successfully deployed to production. Edge Function version updated.

### Phase 5: Documentation [ ]
- [ ] Update progress.md with feature description
- [ ] Document implementation details
- [ ] Record test results and validation
- [ ] Update handoff-notes.md

## Success Criteria
- Root cause identified with evidence
- Scoring algorithm accurately detects transparency signals
- freecalchub.com score reflects actual content improvements
- Recommendations align with scoring criteria
- Test coverage prevents regression

## Risk Assessment
- **MEDIUM**: May need significant refactor of scoring algorithm
- **LOW**: Remedial work may not address actual scoring criteria
- **LOW**: Multiple issues may compound the problem

## Context
**User Report**:
- Site: freecalchub.com
- Current Score: 45/100 (Transparency & Disclosure Standards)
- Status: "Needs Improvement"
- Evidence Found: ✅ Methodology/process info, ✅ Update info
- Missing: Disclosure statements, conflict of interest info, funding sources
- Remedial Work: Completed per `/Users/jamiewatters/DevProjects/freecalchub/docs/Ideation/AIS-Fix about 251008.md`
- Issue: Score unchanged after fixes implemented
