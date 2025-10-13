# AImpactScanner Staging Environment Setup - Project Plan

**Mission**: Production-to-Staging Environment Creation
**Started**: 2025-10-12
**Status**: 🚀 In Progress
**Primary Guide**: DEVOPS-IMPLEMENTATION-PLAN-LESSONS-LEARNED.md

## Mission Objectives

Create a fully functional staging environment for AImpactScanner that mirrors production exactly, following proven DevOps best practices learned from real-world deployments.

## Application Details

- **App Name**: aimpactscanner
- **Production Supabase Ref**: pdmtvkcxnqysujnpcnyh
- **Production Database**: PostgreSQL 15 with 22 migration files
- **Production Stack**: React 19.1.0, Vite 7.0.0, Supabase 2.51.0, Netlify hosting

## Critical Success Factors

Based on lessons learned from DEVOPS-IMPLEMENTATION-PLAN:
1. ✅ **Order Matters**: Database → Auth Schema → OAuth → Frontend → Testing
2. ✅ **Verify Everything**: Don't trust automation alone - verify table counts, data integrity
3. ✅ **Schema First, Data Second**: Ensure perfect schema match before importing data
4. ✅ **Test Each Phase**: Complete verification before moving to next phase

## Phase 0: Prerequisites (30 min) [IN PROGRESS]
- [ ] Verify Supabase dashboard access
- [ ] Verify Netlify dashboard access
- [ ] Verify GitHub repository admin access
- [ ] Document production database schema (table count, structure)
- [ ] Review production environment configuration

## Phase 1: Database First (1 hour) [PENDING]
- [ ] Create Supabase staging project
- [ ] Save staging credentials securely
- [ ] Export production schema using pg_dump
- [ ] Import schema to staging database
- [ ] Verify table count matches production (expected: ~22 tables)
- [ ] Create auth trigger for profile creation
- [ ] Test database connectivity

## Phase 2: Authentication Setup (1 hour) [PENDING]
- [ ] Configure Supabase URL settings for staging
- [ ] Set up Google OAuth credentials
- [ ] Add staging callback URLs to Google Cloud Console
- [ ] Enable Google provider in Supabase dashboard
- [ ] Create GitHub OAuth app for staging
- [ ] Add staging callback URLs to GitHub
- [ ] Enable GitHub provider in Supabase dashboard
- [ ] Test auth configuration

## Phase 3: Frontend Deployment (30 min) [PENDING]
- [ ] Create `develop` branch in repository
- [ ] Configure Netlify branch deployments
- [ ] Set staging environment variables (scoped to develop branch)
- [ ] Verify staging URL assignment
- [ ] Test frontend deployment

## Phase 4: Data Migration (30 min) [PENDING]
- [ ] Export production data (data-only)
- [ ] Import data to staging database
- [ ] Resolve any foreign key constraint errors
- [ ] Verify record counts match production
- [ ] Test data integrity

## Phase 5: Testing & Verification (30 min) [PENDING]
- [ ] Test Google OAuth flow in incognito
- [ ] Test GitHub OAuth flow in incognito
- [ ] Verify profile creation in staging database
- [ ] Test core application functionality
- [ ] Verify deployment pipeline (push to develop → auto-deploy)
- [ ] Check for console errors

## Phase 6: CI/CD Pipeline (30 min) [PENDING]
- [ ] Create GitHub Actions workflow
- [ ] Configure branch-specific deployment jobs
- [ ] Set up branch protection rules for main
- [ ] Set up branch protection rules for develop
- [ ] Test full CI/CD pipeline

## Success Metrics

- ✅ Staging database has EXACT same table count as production
- ✅ Google OAuth creates users successfully
- ✅ GitHub OAuth creates users successfully
- ✅ Users redirect to staging URL (not production)
- ✅ Changes to develop branch auto-deploy to staging
- ✅ No console errors on staging site
- ✅ GitHub Actions tests pass on develop branch
- ✅ Can create PR from develop to main

## Estimated Time

**Total**: 3.5 hours
- Phase 0: 30 minutes
- Phase 1: 1 hour
- Phase 2: 1 hour
- Phase 3: 30 minutes
- Phase 4: 30 minutes
- Phase 5: 30 minutes
- Phase 6: 30 minutes

## Notes

This is a MANUAL IMPLEMENTATION mission - each phase requires actual infrastructure creation and user actions in dashboards and terminals, not just documentation.
