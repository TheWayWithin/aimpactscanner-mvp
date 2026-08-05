# aimpactscanner-mvp — Issue & Project Register

**This is the single source of truth for what is open in this repo.** One row per
issue/project. Detail lives in the linked doc; this file is the index the Mission
Control reconcile (`repo-reconcile.py`) reads and mirrors to the cockpit.

## ID convention (collision-safe)

Mission Control owns the bare `ISS-`/`PRJ-`/`T-` namespaces. **Every aimpactscanner-mvp ID
carries the `AIS-` prefix** so it can never collide with a Mission-Control-native
ID or another repo's. Raise issues here with `python3 ~/shared/scripts/repo-issue.py`.

---

## Open

| ID | Title | Status | Severity | Detail | MC-SYNC |
|----|-------|--------|----------|--------|---------|
| AIS-ISS-4 | Topical Expertise pillar displays 0/100 at 0% weight while its factor T.1.1 scores 55 — confusing report display | ✅ Resolved 2026-07-24 — Deployed to production 2026-07-24: T pillar reports 55/100 at 8.9% weight in API pillar breakdown; report cards data-driven | low | — | pending |
| AIS-ISS-3 | TS.1.4 Sitemap Presence never fetches /sitemap.xml or robots.txt — only greps page HTML for a reference, then wrongly recommends 'create XML sitemap' for sites that have one submitted (jamiewatters.work case, 2026-07-24) | ✅ Resolved 2026-07-24 — Deployed to production 2026-07-24: TS.1.4 100/100 via real fetch (sitemap.xml HTTP 200, 222 URLs, declared in robots.txt); TS.2.4 fetches robots.txt | med | — | pending |
| AIS-ISS-2 | Scanner scores HTTPS Security 0/100 when given an http:// URL even though the site 301-redirects to https — should follow redirects / normalise input and score the final URL (proven on jamiewatters.work: 72 vs 69 for the same site) | ✅ Resolved 2026-07-24 — Deployed to production 2026-07-24: live API scores http:// and https:// jamiewatters.work identically (72/100), M.1.1 100/100 with redirect evidence, resolved URL shown | med | — | pending |
| AIS-ISS-1 | Local main fully diverged from origin/main (ahead 560, behind 560) — likely past force-push/rebase; local branch cannot cleanly push, needs reconciliation | ✅ Resolved 2026-08-05 — Reconciled: local main is in sync with origin/main (0 ahead, 0 behind). The two backup/pre-iss24-* branches taken before the reconciliation are deleted — their only content main lacked was 20 commits from Jul-Aug 2025 including a pre-sanitisation Stripe key, tested 2026-08-05 and DEAD (HTTP 401, identical to an invalid control). Restore SHAs recorded in the fleet-tidy run if ever needed | medium | — | pending |

## Recently closed

| ID | Title | Status | Commit | Detail |
|----|-------|--------|--------|--------|
