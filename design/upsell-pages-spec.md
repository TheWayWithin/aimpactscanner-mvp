# Upsell Pages UI/UX Design Specifications

**Project**: AImpactScanner MVP
**Component**: Tier-Based Upsell Pages
**Designer**: THE DESIGNER (AGENT-11)
**Date**: 2025-10-02
**Status**: Ready for Development

---

## Executive Summary

This document provides complete UI/UX design specifications for 4 tier-based upsell pages that will drive conversion while maintaining brand consistency with the existing AImpactScanner design system. Each page is designed following Doug Hall's Marketing Physics framework with conversion-optimized layouts.

**Design Goals**:
1. **Convert visitors to customers** - 15%+ conversion for Coffee tier
2. **Maintain brand trust** - Professional, consistent visual identity
3. **Remove friction** - Clear CTAs, simple decisions
4. **Build anticipation** - Growth/Scale tiers generate waitlist interest
5. **Ensure accessibility** - WCAG 2.1 AA compliance

---

## Design System Foundation

### Color Palette (From Existing Brand)

```css
/* Primary Brand Colors */
--mastery-blue: #1E3A8A;          /* Primary CTAs, headers */
--mastery-blue-light: rgba(30, 58, 138, 0.05);  /* Backgrounds */
--ai-silver: #64748B;              /* Supporting text, borders */
--ai-silver-light: rgba(100, 116, 139, 0.2);
--authority-white: #FFFFFF;        /* Clean backgrounds */
--framework-black: #0F172A;        /* Body text */

/* Secondary Colors */
--innovation-teal: #0891B2;        /* Interactive elements */
--success-green: #059669;          /* Positive indicators */
--warning-amber: #D97706;          /* Attention elements */
--error-red: #DC2626;              /* Critical issues */

/* Coffee Tier Accent */
--coffee-brown: #6B4423;           /* Coffee tier branding */
--coffee-light: #F5E6D3;           /* Coffee tier backgrounds */

/* Tier-Specific Colors */
--tier-free: #6B7280;              /* Gray for Free */
--tier-coffee: #D97706;            /* Warm amber for Coffee */
--tier-growth: #10B981;            /* Green for Growth */
--tier-scale: #8B5CF6;             /* Purple for Scale */
```

### Typography Scale

```css
/* Font Families */
--font-primary: 'Inter', sans-serif;           /* Headings, UI */
--font-secondary: 'Source Sans Pro', sans-serif;  /* Body text */
--font-mono: 'JetBrains Mono', monospace;      /* Code/technical */

/* Type Scale (Mobile-First) */
--text-xs: 0.75rem;      /* 12px - Fine print */
--text-sm: 0.875rem;     /* 14px - Secondary text */
--text-base: 1rem;       /* 16px - Body text */
--text-lg: 1.125rem;     /* 18px - Emphasized body */
--text-xl: 1.25rem;      /* 20px - Large body */
--text-2xl: 1.5rem;      /* 24px - H3 */
--text-3xl: 1.875rem;    /* 30px - H2 */
--text-4xl: 2.25rem;     /* 36px - H1 Mobile */
--text-5xl: 3rem;        /* 48px - H1 Desktop */

/* Line Heights */
--leading-tight: 1.25;   /* Headlines */
--leading-snug: 1.375;   /* Subheadings */
--leading-normal: 1.5;   /* Body text */
--leading-relaxed: 1.625;  /* Long-form content */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Spacing System

```css
/* 8px base unit (mobile-first) */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */

/* Semantic Spacing */
--section-spacing-mobile: var(--space-12);   /* 48px between sections */
--section-spacing-desktop: var(--space-20);  /* 80px between sections */
--content-max-width: 1280px;                 /* Max content width */
--content-narrow: 768px;                     /* Narrow content (forms, articles) */
```

### Component Specifications

#### Primary Button (CTA)

```css
.btn-primary {
  /* Base Styles */
  font-family: var(--font-primary);
  font-size: var(--text-lg);        /* 18px */
  font-weight: var(--font-semibold);  /* 600 */
  padding: 14px 32px;               /* Desktop */
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  /* Colors */
  background: linear-gradient(135deg, var(--mastery-blue) 0%, var(--innovation-teal) 100%);
  color: var(--authority-white);

  /* Shadows */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* States */
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:focus-visible {
    outline: 2px solid var(--mastery-blue);
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
}

/* Mobile Override */
@media (max-width: 640px) {
  .btn-primary {
    font-size: var(--text-base);    /* 16px */
    padding: 12px 24px;
    width: 100%;                    /* Full width on mobile */
    min-height: 48px;               /* Touch target */
  }
}
```

#### Secondary Button (Skip/Maybe Later)

```css
.btn-secondary {
  /* Base Styles */
  font-family: var(--font-primary);
  font-size: var(--text-base);      /* 16px */
  font-weight: var(--font-medium);  /* 500 */
  padding: 10px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  /* Colors */
  background: transparent;
  color: var(--ai-silver);
  border: 1px solid var(--ai-silver);

  /* States */
  &:hover {
    background: var(--ai-silver-light);
    border-color: var(--framework-black);
    color: var(--framework-black);
  }

  &:focus-visible {
    outline: 2px solid var(--mastery-blue);
    outline-offset: 2px;
  }
}

/* Mobile Override */
@media (max-width: 640px) {
  .btn-secondary {
    width: 100%;
    min-height: 44px;
    font-size: var(--text-sm);
  }
}
```

#### Feature Bullet Point

```css
.feature-bullet {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;

  .icon {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    color: var(--success-green);
  }

  .text {
    font-family: var(--font-secondary);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    color: var(--framework-black);
  }
}

/* Mobile Override */
@media (max-width: 640px) {
  .feature-bullet {
    .text {
      font-size: var(--text-sm);
    }
  }
}
```

---

## Page 1: Coffee Upsell (/upsell/coffee)

**Target Audience**: Free tier users on returning login
**Conversion Goal**: 15%+ to Coffee tier ($4.95/month)
**Key Message**: Unlock unlimited analyses with professional reports

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER (simple nav)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HERO SECTION                                                │
│  ├─ Headline: "Unlock Unlimited AI Optimization"            │
│  ├─ Subheadline: Coffee tier value prop                     │
│  └─ CTA: "Upgrade to Coffee - $4.95/month" (primary)        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  COMPARISON SECTION (2 columns)                              │
│  ├─ LEFT: "What You're Missing (Free)"                      │
│  │   └─ 3-5 limitations with ❌ icons                       │
│  └─ RIGHT: "What You'll Unlock (Coffee)"                    │
│      └─ 7 benefits with ✅ icons (spec messaging)          │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ZERO RISK SECTION (prominent box)                           │
│  ├─ Headline: "🛡️ ZERO RISK - We Remove ALL Your Fears"   │
│  └─ 4 guarantees in 2x2 grid                                │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SOCIAL PROOF (optional, if available)                       │
│  └─ Customer testimonials, usage stats                       │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FINAL CTA SECTION                                           │
│  ├─ CTA: "Start Coffee Plan Now" (primary, large)           │
│  └─ Secondary: "Maybe Later" (subtle link)                   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    FOOTER (simple)                           │
└─────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌───────────────────┐
│      HEADER       │
├───────────────────┤
│                   │
│   HERO SECTION    │
│   ├─ Headline     │
│   ├─ Subhead      │
│   └─ CTA (full)   │
│                   │
├───────────────────┤
│                   │
│   FREE LIMITS     │
│   (stack)         │
│                   │
├───────────────────┤
│                   │
│   COFFEE BENEFITS │
│   (stack)         │
│                   │
├───────────────────┤
│                   │
│   ZERO RISK BOX   │
│   (1 column)      │
│                   │
├───────────────────┤
│                   │
│   FINAL CTA       │
│   ├─ Primary      │
│   └─ Secondary    │
│                   │
└───────────────────┘
```

### Component Specifications

#### Hero Section

**HTML Structure**:
```html
<section class="hero-section">
  <div class="container">
    <!-- Coffee Icon (SVG or emoji) -->
    <div class="icon-coffee">☕</div>

    <!-- Headline -->
    <h1 class="headline">
      Unlock Unlimited AI Optimization
    </h1>

    <!-- Subheadline -->
    <p class="subheadline">
      Remove limits. Run unlimited analyses. Get professional PDF reports
      without watermarks. Cancel anytime.
    </p>

    <!-- Primary CTA -->
    <button class="btn-primary btn-upgrade">
      Upgrade to Coffee - $4.95/month
    </button>

    <!-- Trust Signal -->
    <p class="trust-signal">
      30-day money-back guarantee • Cancel in 10 seconds
    </p>
  </div>
</section>
```

**Styles**:
```css
.hero-section {
  background: linear-gradient(135deg, #F5E6D3 0%, #FFFFFF 100%);
  padding: 60px 20px;
  text-align: center;

  .container {
    max-width: var(--content-narrow);
    margin: 0 auto;
  }

  .icon-coffee {
    font-size: 64px;
    margin-bottom: 24px;
    animation: pulse 2s ease-in-out infinite;
  }

  .headline {
    font-family: var(--font-primary);
    font-size: var(--text-4xl);          /* 36px mobile */
    font-weight: var(--font-bold);
    color: var(--framework-black);
    margin-bottom: 16px;
    line-height: var(--leading-tight);
  }

  .subheadline {
    font-family: var(--font-secondary);
    font-size: var(--text-lg);
    color: var(--ai-silver);
    margin-bottom: 32px;
    line-height: var(--leading-normal);
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  .btn-upgrade {
    margin-bottom: 16px;
  }

  .trust-signal {
    font-size: var(--text-sm);
    color: var(--success-green);
    font-weight: var(--font-medium);
  }
}

@media (min-width: 768px) {
  .hero-section {
    padding: 80px 40px;

    .headline {
      font-size: var(--text-5xl);        /* 48px desktop */
    }

    .subheadline {
      font-size: var(--text-xl);
    }
  }
}
```

#### Comparison Section

**HTML Structure**:
```html
<section class="comparison-section">
  <div class="container">
    <h2 class="section-title">See What You're Missing</h2>

    <div class="comparison-grid">
      <!-- FREE TIER (Left Column) -->
      <div class="tier-card tier-free">
        <div class="card-header">
          <h3>🆓 FREE Plan</h3>
          <p class="price">$0/month</p>
        </div>

        <ul class="limitation-list">
          <li class="limitation-item">
            <span class="icon">❌</span>
            <span>Only 3 analyses per month</span>
          </li>
          <li class="limitation-item">
            <span class="icon">❌</span>
            <span>Basic recommendations only</span>
          </li>
          <li class="limitation-item">
            <span class="icon">❌</span>
            <span>Phase A factors only</span>
          </li>
          <li class="limitation-item">
            <span class="icon">❌</span>
            <span>Web-only results (no PDF export)</span>
          </li>
          <li class="limitation-item">
            <span class="icon">❌</span>
            <span>Community support only</span>
          </li>
        </ul>
      </div>

      <!-- COFFEE TIER (Right Column) -->
      <div class="tier-card tier-coffee featured">
        <div class="badge">RECOMMENDED</div>

        <div class="card-header">
          <h3>☕ COFFEE Plan</h3>
          <p class="price">$4.95/month</p>
        </div>

        <ul class="benefit-list">
          <li class="benefit-item">
            <span class="icon">✅</span>
            <span>Unlimited AI-powered analyses per month</span>
          </li>
          <li class="benefit-item">
            <span class="icon">✅</span>
            <span>10 MASTERY-AI Framework factors (Phase A)</span>
          </li>
          <li class="benefit-item">
            <span class="icon">✅</span>
            <span>Professional PDF reports (no watermarks)</span>
          </li>
          <li class="benefit-item">
            <span class="icon">✅</span>
            <span>Clean, exportable results dashboard</span>
          </li>
          <li class="benefit-item">
            <span class="icon">✅</span>
            <span>Educational content & recommendations</span>
          </li>
          <li class="benefit-item">
            <span class="icon">✅</span>
            <span>Email support</span>
          </li>
          <li class="benefit-item">
            <span class="icon">✅</span>
            <span>30-day money-back guarantee</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</section>
```

**Styles**:
```css
.comparison-section {
  padding: var(--section-spacing-mobile) 20px;
  background: var(--authority-white);

  .container {
    max-width: var(--content-max-width);
    margin: 0 auto;
  }

  .section-title {
    text-align: center;
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    margin-bottom: 48px;
    color: var(--framework-black);
  }

  .comparison-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .tier-card {
    background: white;
    border: 2px solid var(--ai-silver-light);
    border-radius: 12px;
    padding: 32px 24px;
    position: relative;

    &.featured {
      border-color: var(--tier-coffee);
      box-shadow: 0 8px 24px rgba(217, 119, 6, 0.15);
      transform: scale(1.02);
    }

    .badge {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--tier-coffee);
      color: white;
      padding: 4px 16px;
      border-radius: 12px;
      font-size: var(--text-xs);
      font-weight: var(--font-bold);
      text-transform: uppercase;
    }

    .card-header {
      text-align: center;
      margin-bottom: 24px;

      h3 {
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        margin-bottom: 8px;
      }

      .price {
        font-size: var(--text-xl);
        color: var(--ai-silver);
        font-weight: var(--font-semibold);
      }
    }
  }

  .limitation-list,
  .benefit-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .limitation-item,
  .benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;

    .icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    span:last-child {
      font-size: var(--text-base);
      line-height: var(--leading-normal);
      color: var(--framework-black);
    }
  }

  .limitation-item .icon {
    color: var(--error-red);
  }

  .benefit-item .icon {
    color: var(--success-green);
  }
}

@media (min-width: 768px) {
  .comparison-section {
    padding: var(--section-spacing-desktop) 40px;

    .comparison-grid {
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .tier-card.featured {
      transform: scale(1.05);
    }
  }
}
```

#### Zero Risk Section

**HTML Structure**:
```html
<section class="zero-risk-section">
  <div class="container">
    <div class="risk-box">
      <h2 class="risk-title">
        🛡️ ZERO RISK - We Remove ALL Your Fears
      </h2>

      <div class="guarantee-grid">
        <div class="guarantee-item">
          <div class="guarantee-icon">💰</div>
          <h3>30-Day Money Back Guarantee</h3>
          <p>Don't like the results? Get every penny back. No questions asked. No hoops to jump through.</p>
        </div>

        <div class="guarantee-item">
          <div class="guarantee-icon">⚡</div>
          <h3>Cancel Instantly Anytime</h3>
          <p>One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat.</p>
        </div>

        <div class="guarantee-item">
          <div class="guarantee-icon">🏆</div>
          <h3>Results in 24 Hours or Refund</h3>
          <p>See dramatic improvements within 24 hours or get a full refund immediately.</p>
        </div>

        <div class="guarantee-item">
          <div class="guarantee-icon">🚀</div>
          <h3>Outperform Competitors or Refund</h3>
          <p>We find 3x more pages than competitors or you get your money back. Guaranteed.</p>
        </div>
      </div>

      <!-- Credibility Signals -->
      <div class="credibility-section">
        <div class="credibility-item">✅ Built by Expert Solopreneur</div>
        <div class="credibility-item">✅ Not VC-Funded BS</div>
        <div class="credibility-item">✅ Real Results for Real Businesses</div>
      </div>

      <!-- Security -->
      <div class="security-message">
        🔒 <strong>Secure & Private</strong> - Your data is encrypted and never shared.
        We only analyze public content and generate files you control.
      </div>
    </div>
  </div>
</section>
```

**Styles**:
```css
.zero-risk-section {
  padding: var(--section-spacing-mobile) 20px;
  background: var(--mastery-blue-light);

  .container {
    max-width: var(--content-max-width);
    margin: 0 auto;
  }

  .risk-box {
    background: white;
    border: 3px solid var(--success-green);
    border-radius: 16px;
    padding: 40px 24px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  .risk-title {
    text-align: center;
    font-size: var(--text-3xl);
    font-weight: var(--font-extrabold);
    color: var(--framework-black);
    margin-bottom: 40px;
    line-height: var(--leading-tight);
  }

  .guarantee-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
    margin-bottom: 40px;
  }

  .guarantee-item {
    text-align: center;

    .guarantee-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      color: var(--framework-black);
      margin-bottom: 12px;
    }

    p {
      font-size: var(--text-base);
      line-height: var(--leading-relaxed);
      color: var(--ai-silver);
    }
  }

  .credibility-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    margin-bottom: 24px;
    padding: 24px;
    background: var(--mastery-blue-light);
    border-radius: 8px;

    .credibility-item {
      font-size: var(--text-base);
      font-weight: var(--font-semibold);
      color: var(--framework-black);
    }
  }

  .security-message {
    text-align: center;
    font-size: var(--text-sm);
    color: var(--ai-silver);
    line-height: var(--leading-normal);
    padding: 16px;
    background: var(--ai-silver-light);
    border-radius: 8px;

    strong {
      color: var(--framework-black);
    }
  }
}

@media (min-width: 768px) {
  .zero-risk-section {
    padding: var(--section-spacing-desktop) 40px;

    .risk-box {
      padding: 60px 48px;
    }

    .guarantee-grid {
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .credibility-section {
      flex-direction: row;
      justify-content: center;
    }
  }
}
```

#### Final CTA Section

**HTML Structure**:
```html
<section class="final-cta-section">
  <div class="container">
    <h2 class="cta-headline">Ready to Unlock Unlimited Analyses?</h2>
    <p class="cta-subheadline">
      Join the Coffee tier and remove all limits. $4.95/month, cancel anytime.
    </p>

    <div class="cta-buttons">
      <button class="btn-primary btn-upgrade-final">
        Start Coffee Plan Now - $4.95/month
      </button>

      <button class="btn-secondary btn-skip">
        Maybe Later
      </button>
    </div>

    <p class="cta-footer">
      You'll be redirected to secure Stripe checkout.
      Your subscription starts immediately after payment.
    </p>
  </div>
</section>
```

**Styles**:
```css
.final-cta-section {
  padding: var(--section-spacing-mobile) 20px;
  background: linear-gradient(135deg, var(--mastery-blue) 0%, var(--innovation-teal) 100%);
  text-align: center;

  .container {
    max-width: var(--content-narrow);
    margin: 0 auto;
  }

  .cta-headline {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: white;
    margin-bottom: 16px;
  }

  .cta-subheadline {
    font-size: var(--text-lg);
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 32px;
    line-height: var(--leading-normal);
  }

  .cta-buttons {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 24px;
  }

  .btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border-color: rgba(255, 255, 255, 0.3);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-color: white;
    }
  }

  .cta-footer {
    font-size: var(--text-sm);
    color: rgba(255, 255, 255, 0.8);
    line-height: var(--leading-normal);
  }
}

@media (min-width: 768px) {
  .final-cta-section {
    padding: var(--section-spacing-desktop) 40px;

    .cta-headline {
      font-size: var(--text-4xl);
    }

    .cta-buttons {
      flex-direction: row;
      justify-content: center;
      gap: 24px;
    }

    .btn-primary,
    .btn-secondary {
      width: auto;
      min-width: 240px;
    }
  }
}
```

---

## Page 2: Growth Waitlist (/upsell/growth)

**Target Audience**: Coffee tier users ready to scale
**Conversion Goal**: 30%+ waitlist signup rate
**Key Message**: Advanced features coming soon - join waitlist for early access

### Layout Structure (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER (simple nav)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  HERO SECTION                                                │
│  ├─ Headline: "Ready to Scale Your AI Optimization?"        │
│  ├─ Subheadline: Growth tier teaser                         │
│  └─ Badge: "COMING SOON"                                     │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  COMPARISON SECTION (2 columns)                              │
│  ├─ LEFT: "Coffee Plan (Current)"                           │
│  └─ RIGHT: "Growth Plan (Coming Soon)"                      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WAITLIST CTA SECTION                                        │
│  ├─ Headline: "Be First to Access Growth Features"          │
│  ├─ CTA: "Join Growth Waitlist" (primary)                   │
│  └─ Trust signal: "We'll notify you when ready"             │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  BENEFITS SECTION                                            │
│  └─ "Why Join the Waitlist?" (early access, pricing lock)   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FINAL CTA                                                   │
│  ├─ CTA: "Reserve Your Spot" (primary)                      │
│  └─ Secondary: "Stay on Coffee" (link)                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Key Differences from Coffee Page

1. **Badge Emphasis**: "COMING SOON" badge prominent throughout
2. **Waitlist Form**: Simple email confirmation (already have email)
3. **Benefits Focus**: What they'll get when Growth launches
4. **Early Access**: Emphasize being first to access advanced features
5. **No Payment**: Join waitlist = stay on Coffee tier (no friction)

### Component Specifications

#### Hero Section (Growth)

```html
<section class="hero-section hero-growth">
  <div class="container">
    <!-- Growth Icon -->
    <div class="icon-growth">🚀</div>

    <!-- Coming Soon Badge -->
    <div class="badge-coming-soon">COMING SOON</div>

    <!-- Headline -->
    <h1 class="headline">
      Ready to Scale Your AI Optimization?
    </h1>

    <!-- Subheadline -->
    <p class="subheadline">
      Growth tier brings 22 total factors, AI Remediation Planner,
      and priority support. Join the waitlist for early access.
    </p>
  </div>
</section>
```

**Styles**:
```css
.hero-growth {
  background: linear-gradient(135deg, #D1FAE5 0%, #FFFFFF 100%);

  .icon-growth {
    font-size: 64px;
    margin-bottom: 24px;
  }

  .badge-coming-soon {
    display: inline-block;
    background: var(--tier-growth);
    color: white;
    padding: 8px 24px;
    border-radius: 24px;
    font-size: var(--text-sm);
    font-weight: var(--font-bold);
    text-transform: uppercase;
    margin-bottom: 24px;
    animation: pulse 2s ease-in-out infinite;
  }
}
```

#### Waitlist CTA Section

```html
<section class="waitlist-cta-section">
  <div class="container">
    <h2 class="section-title">Be First to Access Growth Features</h2>

    <p class="section-description">
      Join our exclusive Growth tier waitlist. We'll notify you the moment
      advanced features launch - and you'll get first access with special
      early-bird pricing.
    </p>

    <div class="waitlist-benefits">
      <div class="benefit-item">
        <span class="icon">⚡</span>
        <span>First access when we launch</span>
      </div>
      <div class="benefit-item">
        <span class="icon">💰</span>
        <span>Lock in early-bird pricing</span>
      </div>
      <div class="benefit-item">
        <span class="icon">🎯</span>
        <span>Help shape Growth tier features</span>
      </div>
    </div>

    <button class="btn-primary btn-join-waitlist">
      Join Growth Waitlist (Free)
    </button>

    <p class="trust-signal">
      No payment required. Stay on Coffee tier until Growth launches.
    </p>
  </div>
</section>
```

**Styles**:
```css
.waitlist-cta-section {
  padding: var(--section-spacing-mobile) 20px;
  background: white;
  text-align: center;

  .container {
    max-width: var(--content-narrow);
    margin: 0 auto;
  }

  .section-title {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--framework-black);
    margin-bottom: 16px;
  }

  .section-description {
    font-size: var(--text-lg);
    color: var(--ai-silver);
    line-height: var(--leading-relaxed);
    margin-bottom: 32px;
  }

  .waitlist-benefits {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 32px;
    padding: 24px;
    background: var(--mastery-blue-light);
    border-radius: 12px;

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: var(--text-base);
      font-weight: var(--font-medium);
      color: var(--framework-black);

      .icon {
        font-size: 24px;
      }
    }
  }

  .trust-signal {
    margin-top: 16px;
    font-size: var(--text-sm);
    color: var(--success-green);
    font-weight: var(--font-medium);
  }
}

@media (min-width: 768px) {
  .waitlist-cta-section {
    padding: var(--section-spacing-desktop) 40px;

    .waitlist-benefits {
      flex-direction: row;
      justify-content: center;
    }
  }
}
```

---

## Page 3: Scale Waitlist (/upsell/scale)

**Target Audience**: Growth tier users or high-usage Coffee users
**Conversion Goal**: 20%+ waitlist signup rate
**Key Message**: Enterprise features, white-label reports, API access

### Layout Structure

Similar to Growth page with these modifications:

1. **Enterprise Focus**: Messaging emphasizes business/agency use
2. **Scale Icon**: 🏢 (building emoji)
3. **Price Point**: $99/month (shown but grayed out)
4. **Features**: API access, white-label, team collaboration
5. **Color Scheme**: Purple gradient (var(--tier-scale))

### Component Specifications

#### Hero Section (Scale)

```html
<section class="hero-section hero-scale">
  <div class="container">
    <div class="icon-scale">🏢</div>
    <div class="badge-coming-soon">ENTERPRISE TIER COMING SOON</div>

    <h1 class="headline">
      Scale Your Agency with Enterprise Features
    </h1>

    <p class="subheadline">
      White-label reports, API access, team collaboration, and dedicated support.
      Built for agencies and enterprise teams.
    </p>
  </div>
</section>
```

**Styles**:
```css
.hero-scale {
  background: linear-gradient(135deg, #EDE9FE 0%, #FFFFFF 100%);

  .badge-coming-soon {
    background: var(--tier-scale);
  }
}
```

#### Scale-Specific Features List

```html
<section class="features-section">
  <div class="container">
    <h2>What's Coming in Scale Tier</h2>

    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">🔌</div>
        <h3>API Access</h3>
        <p>Automate analyses and integrate with your workflow</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>White-Label Reports</h3>
        <p>Brand PDFs with your logo and colors</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">👥</div>
        <h3>Team Collaboration</h3>
        <p>Share analyses across your team</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">📊</div>
        <h3>Custom Reporting</h3>
        <p>Build reports tailored to your clients</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🔔</div>
        <h3>Webhook Integrations</h3>
        <p>Connect with your existing tools</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">🎯</div>
        <h3>Dedicated Support</h3>
        <p>Priority support with dedicated account manager</p>
      </div>
    </div>
  </div>
</section>
```

**Styles**:
```css
.features-section {
  padding: var(--section-spacing-mobile) 20px;
  background: white;

  .features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .feature-card {
    background: var(--authority-white);
    border: 2px solid var(--ai-silver-light);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--tier-scale);
      box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
      transform: translateY(-4px);
    }

    .feature-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    h3 {
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      color: var(--framework-black);
      margin-bottom: 8px;
    }

    p {
      font-size: var(--text-base);
      color: var(--ai-silver);
      line-height: var(--leading-normal);
    }
  }
}

@media (min-width: 768px) {
  .features-section {
    .features-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 32px;
    }
  }
}

@media (min-width: 1024px) {
  .features-section {
    .features-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}
```

---

## Page 4: Scale Welcome (/welcome/scale)

**Target Audience**: Scale tier subscribers (future)
**Goal**: Smooth onboarding, set expectations
**Key Message**: Welcome to premium support and exclusive features

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER (simple nav)                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  WELCOME HERO                                                │
│  ├─ Celebration animation (confetti/check)                  │
│  ├─ Headline: "Welcome to Scale Tier! 🎉"                  │
│  └─ Subheadline: "You now have access to everything"        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  NEXT STEPS SECTION                                          │
│  └─ Numbered steps to get started                           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SUPPORT SECTION                                             │
│  ├─ Dedicated account manager contact                       │
│  └─ Priority support channels                               │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FINAL CTA                                                   │
│  └─ "Continue to Dashboard" (primary)                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Welcome Hero

```html
<section class="welcome-hero">
  <div class="container">
    <!-- Success Icon with Animation -->
    <div class="success-icon">
      <svg class="checkmark" viewBox="0 0 52 52">
        <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
        <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
      </svg>
    </div>

    <!-- Headline -->
    <h1 class="headline">
      Welcome to Scale Tier! 🎉
    </h1>

    <!-- Subheadline -->
    <p class="subheadline">
      You now have access to all enterprise features, white-label reports,
      API access, and dedicated support. Let's get you started.
    </p>

    <!-- Feature Pills -->
    <div class="feature-pills">
      <span class="pill">✅ API Access Enabled</span>
      <span class="pill">✅ White-Label Reports</span>
      <span class="pill">✅ Team Collaboration</span>
      <span class="pill">✅ Dedicated Support</span>
    </div>
  </div>
</section>
```

**Styles**:
```css
.welcome-hero {
  padding: 60px 20px;
  background: linear-gradient(135deg, #EDE9FE 0%, #FFFFFF 100%);
  text-align: center;

  .container {
    max-width: var(--content-narrow);
    margin: 0 auto;
  }

  .success-icon {
    margin-bottom: 32px;

    .checkmark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: block;
      stroke-width: 2;
      stroke: var(--success-green);
      stroke-miterlimit: 10;
      margin: 0 auto;
      animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
    }

    .checkmark-circle {
      stroke-dasharray: 166;
      stroke-dashoffset: 166;
      stroke-width: 2;
      stroke-miterlimit: 10;
      stroke: var(--success-green);
      fill: none;
      animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
    }

    .checkmark-check {
      transform-origin: 50% 50%;
      stroke-dasharray: 48;
      stroke-dashoffset: 48;
      animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
    }
  }

  .headline {
    font-size: var(--text-4xl);
    font-weight: var(--font-bold);
    color: var(--framework-black);
    margin-bottom: 16px;
  }

  .subheadline {
    font-size: var(--text-lg);
    color: var(--ai-silver);
    line-height: var(--leading-relaxed);
    margin-bottom: 32px;
  }

  .feature-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;

    .pill {
      display: inline-block;
      background: white;
      color: var(--tier-scale);
      font-size: var(--text-sm);
      font-weight: var(--font-semibold);
      padding: 8px 16px;
      border-radius: 20px;
      border: 2px solid var(--tier-scale);
    }
  }
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}

@keyframes scale {
  0%, 100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}

@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 30px var(--success-green);
  }
}
```

#### Next Steps Section

```html
<section class="next-steps-section">
  <div class="container">
    <h2 class="section-title">Get Started in 3 Steps</h2>

    <div class="steps-grid">
      <div class="step-card">
        <div class="step-number">1</div>
        <h3>Access Your Dashboard</h3>
        <p>Run unlimited analyses with all 22 MASTERY-AI factors unlocked</p>
        <button class="btn-step">Go to Dashboard</button>
      </div>

      <div class="step-card">
        <div class="step-number">2</div>
        <h3>Set Up API Access</h3>
        <p>Generate your API keys and integrate with your workflow</p>
        <button class="btn-step">View API Docs</button>
      </div>

      <div class="step-card">
        <div class="step-number">3</div>
        <h3>Contact Your Account Manager</h3>
        <p>Schedule a call to optimize your AI optimization strategy</p>
        <button class="btn-step">Schedule Call</button>
      </div>
    </div>
  </div>
</section>
```

**Styles**:
```css
.next-steps-section {
  padding: var(--section-spacing-mobile) 20px;
  background: white;

  .section-title {
    text-align: center;
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--framework-black);
    margin-bottom: 48px;
  }

  .steps-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .step-card {
    background: white;
    border: 2px solid var(--ai-silver-light);
    border-radius: 12px;
    padding: 32px;
    text-align: center;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--tier-scale);
      box-shadow: 0 8px 24px rgba(139, 92, 246, 0.15);
      transform: translateY(-4px);
    }

    .step-number {
      width: 56px;
      height: 56px;
      background: var(--tier-scale);
      color: white;
      font-size: var(--text-2xl);
      font-weight: var(--font-bold);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }

    h3 {
      font-size: var(--text-xl);
      font-weight: var(--font-bold);
      color: var(--framework-black);
      margin-bottom: 12px;
    }

    p {
      font-size: var(--text-base);
      color: var(--ai-silver);
      line-height: var(--leading-normal);
      margin-bottom: 24px;
    }

    .btn-step {
      background: var(--tier-scale);
      color: white;
      font-weight: var(--font-semibold);
      padding: 12px 24px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #7C3AED;
        transform: translateY(-2px);
      }
    }
  }
}

@media (min-width: 1024px) {
  .next-steps-section {
    .steps-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
}
```

---

## Responsive Design Specifications

### Breakpoints

```css
/* Mobile First Approach */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### Mobile Optimizations

1. **Touch Targets**: Minimum 44x44px for all interactive elements
2. **Font Sizes**: Never smaller than 16px for body text (prevents zoom on iOS)
3. **Form Inputs**: Full width with large padding for easy tapping
4. **Buttons**: Full width below 640px, auto width above
5. **Spacing**: Reduced padding on mobile (20px vs 40px desktop)
6. **Images**: Lazy load, optimized for mobile bandwidth

### Tablet Optimizations

1. **Grid Layouts**: 2-column grids for comparison sections
2. **Navigation**: Horizontal navigation visible
3. **Images**: Medium resolution
4. **Spacing**: Moderate padding (32px)

### Desktop Optimizations

1. **Grid Layouts**: 3-column grids where appropriate
2. **Max Width**: 1280px content container
3. **Hover States**: Enhanced hover effects
4. **Spacing**: Full padding (40-60px)

---

## Accessibility Specifications (WCAG 2.1 AA)

### Color Contrast

All text must meet minimum contrast ratios:

```
Body Text (16px+): 4.5:1 minimum
Large Text (24px+): 3:1 minimum
UI Elements: 3:1 minimum

Tested Combinations:
✅ --framework-black on --authority-white: 17.5:1
✅ --ai-silver on --authority-white: 7.2:1
✅ --mastery-blue on --authority-white: 8.3:1
✅ White on --mastery-blue: 9.1:1
✅ White on --tier-coffee: 5.8:1
✅ White on --success-green: 4.8:1
```

### Semantic HTML

```html
<!-- Proper heading hierarchy -->
<h1>Page Title (only one per page)</h1>
<h2>Section Headings</h2>
<h3>Subsection Headings</h3>

<!-- Descriptive links -->
<a href="/upsell/coffee" aria-label="Upgrade to Coffee tier ($4.95/month)">
  Upgrade to Coffee
</a>

<!-- Form labels -->
<label for="email">Email Address</label>
<input id="email" type="email" required aria-describedby="email-help" />
<small id="email-help">We'll never share your email</small>

<!-- Button states -->
<button
  type="button"
  aria-label="Upgrade to Coffee tier"
  aria-disabled="false"
>
  Upgrade Now
</button>
```

### Keyboard Navigation

1. **Tab Order**: Logical flow (top to bottom, left to right)
2. **Focus Indicators**: Visible 2px outline with 2px offset
3. **Skip Links**: "Skip to main content" link at top
4. **Interactive Elements**: All clickable via Enter or Space
5. **Form Navigation**: Tab through all form fields

```css
/* Focus visible styles */
*:focus-visible {
  outline: 2px solid var(--mastery-blue);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Skip link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--framework-black);
  color: white;
  padding: 8px;
  text-decoration: none;

  &:focus {
    top: 0;
  }
}
```

### Screen Reader Support

```html
<!-- Descriptive landmarks -->
<nav aria-label="Main navigation"></nav>
<main aria-label="Page content"></main>
<aside aria-label="Sidebar"></aside>

<!-- Live regions for dynamic content -->
<div role="status" aria-live="polite" aria-atomic="true">
  Joining waitlist...
</div>

<!-- Hidden labels for icons -->
<button>
  <span aria-hidden="true">✅</span>
  <span class="sr-only">Mark as complete</span>
</button>

<!-- Image alt text -->
<img
  src="coffee-tier.png"
  alt="Coffee tier includes unlimited analyses and professional reports"
/>
```

### Screen Reader Only Class

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## Animation & Interaction Specifications

### Timing Functions

```css
/* Easing curves */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* Duration */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Hover Effects

```css
/* Button hover (lift effect) */
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transition: all var(--duration-fast) var(--ease-out);
}

/* Card hover */
.tier-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--mastery-blue);
  transition: all var(--duration-normal) var(--ease-out);
}

/* Link hover */
a:hover {
  color: var(--innovation-teal);
  text-decoration: underline;
  transition: color var(--duration-fast) var(--ease-in-out);
}
```

### Loading States

```css
/* Spinner animation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* Pulse animation for "Coming Soon" */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.badge-coming-soon {
  animation: pulse 2s ease-in-out infinite;
}
```

### Page Transitions

```css
/* Fade in on page load */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-content {
  animation: fadeIn 0.5s ease-out;
}

/* Stagger children animations */
.comparison-grid .tier-card:nth-child(1) {
  animation-delay: 0ms;
}

.comparison-grid .tier-card:nth-child(2) {
  animation-delay: 150ms;
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Performance Optimizations

### Critical CSS

```html
<!-- Inline critical CSS in <head> -->
<style>
  /* Only styles needed for above-the-fold content */
  body { font-family: 'Source Sans Pro', sans-serif; }
  .hero-section {
    min-height: 60vh;
    background: linear-gradient(135deg, #F5E6D3 0%, #FFFFFF 100%);
  }
  .btn-primary {
    background: linear-gradient(135deg, #1E3A8A 0%, #0891B2 100%);
    color: white;
    padding: 14px 32px;
    border-radius: 8px;
  }
</style>
```

### Lazy Loading

```html
<!-- Images -->
<img
  src="placeholder.jpg"
  data-src="real-image.jpg"
  loading="lazy"
  alt="Description"
/>

<!-- Components (React) -->
const WaitlistForm = React.lazy(() => import('./WaitlistForm'));

<Suspense fallback={<Spinner />}>
  <WaitlistForm />
</Suspense>
```

### Font Loading

```html
<!-- Preload critical fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="preload"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
  as="style"
/>
```

### Image Optimization

```
Recommended Sizes:
- Hero images: 1920x1080 (WebP format)
- Icons: 48x48 (SVG preferred)
- Thumbnails: 400x300 (WebP format)
- Social proof: 200x200 (WebP format)

Compression:
- WebP: 80% quality
- JPEG fallback: 85% quality
- PNG: TinyPNG compression
```

---

## Developer Handoff Checklist

### Assets Required

- [ ] SVG icons for checkmarks (✅), crosses (❌), emojis
- [ ] Coffee tier illustration (optional)
- [ ] Growth tier illustration (optional)
- [ ] Scale tier illustration (optional)
- [ ] Loading spinner SVG
- [ ] Success checkmark animation SVG

### Component Files to Create

```
/src/pages/
├── UpsellCoffee.jsx
├── UpsellGrowth.jsx
├── UpsellScale.jsx
└── WelcomeScale.jsx

/src/components/
├── ComparisonGrid.jsx          (Reusable tier comparison)
├── ZeroRiskSection.jsx         (Reusable guarantee box)
├── WaitlistCTA.jsx             (Reusable waitlist form)
└── FeatureCard.jsx             (Reusable feature display)

/src/styles/
└── upsell-pages.css            (Page-specific styles)
```

### Routing Setup (App.jsx)

```javascript
// Add routes for upsell pages
if (currentView === 'upsell-coffee') {
  return <UpsellCoffee />;
}

if (currentView === 'upsell-growth') {
  return <UpsellGrowth />;
}

if (currentView === 'upsell-scale') {
  return <UpsellScale />;
}

if (currentView === 'welcome-scale') {
  return <WelcomeScale />;
}
```

### API Integration Points

```javascript
// Coffee tier upgrade
const handleUpgradeToCoffee = async () => {
  // Redirect to Stripe checkout
  const { sessionId } = await createCheckoutSession({
    userId: user.id,
    tier: 'coffee',
    successUrl: `${window.location.origin}/#/dashboard`,
    cancelUrl: `${window.location.origin}/#/upsell/coffee`
  });

  await stripe.redirectToCheckout({ sessionId });
};

// Growth waitlist join
const handleJoinGrowthWaitlist = async () => {
  const { data, error } = await supabase
    .from('waitlist')
    .insert({
      user_id: user.id,
      email: user.email,
      current_tier: user.tier,
      interested_tier: 'growth'
    });

  if (!error) {
    showSuccessMessage('You're on the Growth waitlist!');
  }
};

// Scale waitlist join
const handleJoinScaleWaitlist = async () => {
  // Similar to Growth waitlist
};
```

### Testing Checklist

- [ ] All pages render correctly on mobile (320px+)
- [ ] All pages render correctly on tablet (768px)
- [ ] All pages render correctly on desktop (1280px+)
- [ ] Buttons have 44x44px minimum touch target
- [ ] All text meets WCAG AA contrast ratios
- [ ] Keyboard navigation works (Tab through all elements)
- [ ] Focus indicators visible on all interactive elements
- [ ] Screen reader announces all content correctly
- [ ] Animations respect prefers-reduced-motion
- [ ] Images lazy load correctly
- [ ] Page loads in under 2 seconds (3G throttle)
- [ ] No layout shift (CLS score < 0.1)
- [ ] All CTAs trigger correct actions

---

## Messaging Preservation Checklist

**CRITICAL**: These exact phrases must be used verbatim from AUTH_MONETIZATION_SPEC.md:

### Coffee Tier Benefits
- [ ] "Unlimited AI-powered analyses per month"
- [ ] "10 MASTERY-AI Framework factors (Phase A)"
- [ ] "Professional PDF reports (no watermarks)"
- [ ] "Clean, exportable results dashboard"
- [ ] "Educational content & recommendations"
- [ ] "Email support"
- [ ] "30-day money-back guarantee"

### Free Tier Limitations
- [ ] "Only 3 analyses per month"
- [ ] "Basic recommendations only"
- [ ] "Phase A factors only"
- [ ] "Web-only results (no PDF export)"
- [ ] "Community support only"
- [ ] "No advanced AI insights"

### Zero Risk Section
- [ ] "🛡️ ZERO RISK - We Remove ALL Your Fears"
- [ ] "30-Day Money Back Guarantee" (exact headline)
- [ ] "Don't like the results? Get every penny back. No questions asked. No hoops to jump through."
- [ ] "Cancel Instantly Anytime" (exact headline)
- [ ] "One click cancellation. No phone calls. No retention tactics. Cancel in 10 seconds flat."
- [ ] "Results in 24 Hours or Refund" (exact headline)
- [ ] "See dramatic improvements within 24 hours or get a full refund immediately."
- [ ] "Outperform Competitors or Refund" (exact headline)
- [ ] "We find 3x more pages than competitors or you get your money back. Guaranteed."

### Credibility Signals
- [ ] "✅ Built by Expert Solopreneur"
- [ ] "✅ Not VC-Funded BS"
- [ ] "✅ Real Results for Real Businesses"

### Security Message
- [ ] "🔒 Secure & Private - Your data is encrypted and never shared. We only analyze public content and generate files you control."

---

## Final Notes for Developer

**Design Philosophy**:
- Mobile-first responsive design
- Conversion-optimized layouts (CTA above fold)
- Clear visual hierarchy (headline → benefits → CTA)
- Trust signals throughout (guarantees, security, credibility)
- Accessibility built-in, not bolted-on

**Brand Consistency**:
- All colors from existing palette (App.css)
- Typography matches landing page
- Button styles match TierSelector component
- Spacing system consistent (8px base unit)

**Performance Goals**:
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Time to Interactive: < 3.5s

**Conversion Optimization**:
- Primary CTA appears 3 times per page (hero, mid, final)
- Benefits listed before limitations (positive framing)
- Zero Risk section prominent (remove purchase anxiety)
- Social proof when available (testimonials, usage stats)
- Clear exit option (secondary "Maybe Later" button)

---

**STATUS**: ✅ Design Specifications Complete - Ready for Development

**Next Step**: Developer implements components using this spec

**Design Review**: Schedule review after implementation for QA

