# AImpactScanner Claude Code Prompts

## Debug & Fix Prompts

### Schema Cache Error
```
Fix the persistent PGRST204 schema cache error in our Supabase Edge Function. The error shows "Could not find the analysis_duration column" despite the column existing in the analyses table. Review the current Edge Function code, database schema, and implement a robust solution with fallback strategies.
```

### Performance Optimization
```
Optimize our Puppeteer-based web scraping in the Edge Function to complete 25-factor analysis within 35-50 seconds. Focus on parallel processing, efficient data extraction, and memory management within the 60-second Edge Function timeout limit.
```

### Real-time Progress Issues
```
Debug and enhance our real-time progress tracking system using Supabase subscriptions. Ensure robust error handling, reconnection logic, and efficient progress updates every 2-3 seconds during analysis.
```

## Development Prompts

### Component Creation
```
Create a new React component for [component name] that [functionality]. Follow our existing patterns in Auth.jsx, use AI Search Mastery brand styling with CSS variables, and ensure proper error handling and loading states.
```

### Database Migration
```
Create a Supabase migration for [changes needed]. Follow our existing schema patterns, include proper RLS policies, add necessary indexes for performance, and ensure compatibility with our current table structure.
```

### Edge Function Development
```
Implement a new Edge Function or enhance existing one for [functionality]. Use Deno/TypeScript, handle the 60-second timeout limit, implement proper error handling, and ensure efficient database operations.
```

## Architecture Prompts

### Full Stack Feature
```
Design and implement [feature name] across our React frontend and Supabase backend. Consider our current architecture, performance targets (35-50 seconds, 20+ concurrent users), and maintain brand consistency throughout.
```

### Code Review
```
Review [file/component] for security vulnerabilities, performance issues, and adherence to our coding standards. Check for proper error handling, memory leaks, and compatibility with our Supabase setup.
```

### Testing Strategy
```
Create comprehensive tests for [component/function]. Include unit tests, integration tests, and edge cases. Consider our Supabase setup, real-time subscriptions, and Edge Function constraints.
```

## Analysis & Planning Prompts

### Technical Investigation
```
Investigate [issue/requirement] in our codebase. Analyze the current implementation, identify potential problems, and propose solutions that align with our technical stack and performance requirements.
```

### Architecture Decision
```
Help me make an architectural decision about [topic]. Consider our current React + Supabase stack, performance targets, scalability requirements, and the 3-week MVP timeline.
```

### Refactoring Guidance
```
Suggest refactoring strategies for [component/system]. Focus on improving performance, maintainability, and alignment with our brand standards while minimizing disruption to existing functionality.
```

## Quick Commands

### File Analysis
```
Analyze [file path] and explain its current functionality, identify potential issues, and suggest improvements.
```

### Error Debugging
```
Debug this error: [error message]. Check related files and suggest fixes.
```

### Feature Implementation
```
Implement [specific feature] following our existing patterns and brand guidelines.
```

## Context-Specific Prompts

### Brand Consistency
```
Ensure this component/feature maintains AI Search Mastery brand identity. Use our CSS variables (--authority-white, --mastery-blue, --framework-black) and reference the MASTERY-AI Framework v3.1.1 appropriately.
```

### Performance Focus
```
Optimize this code for our performance targets: 35-50 second analysis completion, 20+ concurrent users, <512MB memory usage, and <50 database queries per analysis.
```

### Supabase Integration
```
Implement this feature using our existing Supabase setup. Use the configured client, respect RLS policies, and ensure proper error handling for Edge Functions.
```

## Project Status Prompts

### Progress Check
```
Review our current progress against the MVP timeline. Identify completed features, remaining tasks, and potential blockers. Suggest priority adjustments if needed.
```

### Deployment Readiness
```
Assess our codebase for production readiness. Check security, performance, error handling, and compliance with our technical requirements.
```

### Documentation Update
```
Update our documentation to reflect recent changes. Ensure accuracy of setup instructions, API documentation, and architectural decisions.
```