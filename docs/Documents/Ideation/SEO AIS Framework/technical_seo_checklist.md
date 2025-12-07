# Comprehensive Technical SEO Checklist (Semrush)

## Source: https://www.semrush.com/blog/technical-seo-checklist/
## Based on analysis of 50,000+ domains

---

## 1. CRAWLING AND INDEXING ISSUES

### 1.1 Check Whether Site Is Indexed
- **Tool**: Google Search Console → Pages report
- **Check**: Which pages are indexed vs excluded
- **Common exclusion reasons**:
  - "Crawled - currently not indexed" (low quality/duplicate content)
  - "Blocked by robots.txt" (accidental blocking)
  - "Excluded by 'noindex' tag" (incorrect tag placement)

### 1.2 Check for Duplicate Website Versions
- **Prevalence**: 27% of websites have this issue
- **Problem**: Multiple accessible versions (HTTP/HTTPS, www/non-www)
- **Examples**:
  - https://yourdomain.com
  - https://www.yourdomain.com
  - http://yourdomain.com
  - http://www.yourdomain.com
- **Solution**: Choose one preferred version, 301 redirect all others

### 1.3 Robots.txt Configuration
- **Prevalence**: 2% have configuration issues (but severe consequences)
- **Location**: yourdomain.com/robots.txt
- **Check**: Ensure not blocking important pages/folders
- **Review**: "Disallow" directives

### 1.4 Redirect Chains & Loops
- **Prevalence**: 12% of websites affected
- **Problem**: URL redirects to another URL, then another (chain) or back to itself (loop)
- **Impact**: Slows site, wastes crawl budget, dilutes ranking power
- **Solution**: Update redirects to point directly to final destination

### 1.5 Broken Links
- **Prevalence**: 52% of websites have broken internal/external links
- **Problem**: 404 errors, poor UX, signals poor maintenance
- **Types**:
  - Internal broken links
  - External broken links
- **Solutions**:
  - Restore deleted pages
  - 301 redirect to similar page
  - Replace with updated link
  - Remove if no alternative exists

### 1.6 Server Errors (5xx)
- **Prevalence**: 10% of websites experience regular server errors
- **Common types**:
  - 500 Internal Server Error
  - 502 Bad Gateway
  - 503 Service Unavailable
- **Impact**: Prevents crawling and indexing

---

## 2. USER EXPERIENCE OPTIMIZATION

### 2.1 Page Speed Optimization
- **Importance**: Critical ranking factor and UX element
- **Key metrics**: Core Web Vitals
  - LCP (Largest Contentful Paint)
  - FID (First Input Delay)
  - CLS (Cumulative Layout Shift)
- **Tools**: Google PageSpeed Insights, Semrush Site Audit

### 2.2 Mobile-Friendliness
- **Importance**: Mobile-first indexing by Google
- **Requirements**:
  - Responsive design
  - Touch-friendly elements
  - Readable text without zooming
  - No horizontal scrolling
- **Tool**: Google Mobile-Friendly Test

### 2.3 HTTPS Security
- **Importance**: Ranking signal and trust factor
- **Requirement**: SSL certificate installed
- **Check**: All pages load via HTTPS
- **Fix**: Redirect HTTP to HTTPS

---

## 3. WEBSITE NAVIGATION & STRUCTURE

### 3.1 Site Architecture
- **Goal**: Logical, hierarchical structure
- **Best practice**: Important pages within 3 clicks from homepage
- **Elements**:
  - Clear category hierarchy
  - Breadcrumb navigation
  - HTML sitemap

### 3.2 Internal Linking
- **Purpose**: Distribute link equity, help crawling
- **Best practices**:
  - Link to important pages from multiple locations
  - Use descriptive anchor text
  - Avoid orphan pages (pages with no internal links)
  - Create topic clusters

### 3.3 URL Structure
- **Best practices**:
  - Short, descriptive URLs
  - Include target keywords
  - Use hyphens (not underscores)
  - Avoid parameters when possible
  - Consistent structure across site

---

## 4. ADDITIONAL TECHNICAL REQUIREMENTS

### 4.1 XML Sitemap
- **Purpose**: Help search engines discover all pages
- **Requirements**:
  - Include all important pages
  - Exclude blocked/noindex pages
  - Submit to Google Search Console
  - Keep updated
- **Location**: yourdomain.com/sitemap.xml

### 4.2 Canonical Tags
- **Purpose**: Prevent duplicate content issues
- **Usage**: Specify preferred version of similar/duplicate pages
- **Implementation**: <link rel="canonical" href="preferred-url" />

### 4.3 Structured Data (Schema Markup)
- **Purpose**: Help search engines understand content
- **Common types**:
  - Article
  - Product
  - FAQ
  - Breadcrumb
  - Organization
  - Local Business
- **Format**: JSON-LD (preferred)
- **Tool**: Google Rich Results Test

### 4.4 Pagination Handling
- **For**: Multi-page content (product listings, blog archives)
- **Methods**:
  - rel="next" and rel="prev" tags
  - Canonical to view-all page
  - Load more with JavaScript

### 4.5 International SEO (if applicable)
- **Hreflang tags**: Specify language/region versions
- **Implementation**: <link rel="alternate" hreflang="en-us" href="url" />
- **Requirements**: Bidirectional links between versions

### 4.6 Image Optimization
- **Elements**:
  - Alt text (descriptive, keyword-relevant)
  - File names (descriptive, not IMG_1234.jpg)
  - File size (compressed)
  - Format (WebP for modern browsers)
  - Dimensions (appropriate for display size)
  - Lazy loading

### 4.7 JavaScript SEO
- **Issues**: Content rendered by JavaScript may not be crawled
- **Solutions**:
  - Server-side rendering (SSR)
  - Dynamic rendering
  - Static pre-rendering
- **Test**: Google Search Console URL Inspection Tool

### 4.8 Log File Analysis
- **Purpose**: Understand how search engines crawl your site
- **Insights**:
  - Crawl frequency
  - Crawl budget usage
  - Server errors
  - Blocked resources

---

## 5. CONTENT & ON-PAGE ELEMENTS

### 5.1 Title Tags
- **Length**: 50-60 characters
- **Requirements**:
  - Unique for each page
  - Include target keyword
  - Compelling for click-through

### 5.2 Meta Descriptions
- **Length**: 150-160 characters
- **Requirements**:
  - Unique for each page
  - Include target keyword
  - Call-to-action
  - Accurate summary

### 5.3 Heading Tags (H1-H6)
- **H1**: One per page, main topic
- **H2-H6**: Logical hierarchy
- **Requirements**:
  - Include keywords naturally
  - Descriptive and clear
  - Proper nesting

### 5.4 Duplicate Content
- **Check for**:
  - Identical content on multiple pages
  - Thin content
  - Scraped content
- **Solutions**:
  - Canonical tags
  - 301 redirects
  - Noindex tags
  - Content consolidation

---

## 6. MONITORING & MAINTENANCE

### 6.1 Google Search Console Setup
- **Essential**: Property verification
- **Monitor**:
  - Index coverage
  - Mobile usability
  - Core Web Vitals
  - Manual actions
  - Security issues

### 6.2 Regular Site Audits
- **Frequency**: Monthly or quarterly
- **Tools**: Semrush Site Audit, Screaming Frog
- **Focus areas**: All items in this checklist

### 6.3 Performance Monitoring
- **Metrics**:
  - Organic traffic
  - Rankings
  - Click-through rates
  - Bounce rate
  - Page speed
- **Tools**: Google Analytics, Search Console

---

## PRIORITY LEVELS FOR IMPLEMENTATION

### CRITICAL (Fix Immediately):
- Site not indexed
- Server errors (5xx)
- HTTPS not implemented
- Robots.txt blocking important pages
- Mobile-unfriendly

### HIGH PRIORITY:
- Broken links (52% of sites affected)
- Duplicate website versions (27% of sites affected)
- Redirect chains/loops (12% of sites affected)
- Missing XML sitemap
- Slow page speed

### MEDIUM PRIORITY:
- Missing canonical tags
- Poor URL structure
- Weak internal linking
- Missing structured data
- Image optimization issues

### ONGOING MAINTENANCE:
- Regular site audits
- Content freshness
- Link monitoring
- Performance tracking
- Log file analysis

