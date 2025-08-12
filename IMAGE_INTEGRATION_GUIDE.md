# Image Integration Guide
## How to implement the visual assets once received from designer

### Quick Start
All placeholder components are in `src/components/ImagePlaceholders.jsx`. Once you receive the actual images, follow these steps:

---

## 1. Logo Integration

### Step 1: Add logo files
```bash
# Place logo files in:
public/images/logos/
  - logo-primary.svg
  - logo-dark.svg
  - logo-white.svg
```

### Step 2: Update favicon
```html
<!-- In index.html, replace: -->
<link rel="icon" type="image/svg+xml" href="/vite.svg" />

<!-- With: -->
<link rel="icon" type="image/png" sizes="32x32" href="/images/logos/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/images/logos/favicon-16.png">
<link rel="apple-touch-icon" href="/images/logos/apple-touch-icon.png">
```

### Step 3: Update Logo component
```jsx
// In ImagePlaceholders.jsx or create new Logo.jsx
export const Logo = ({ variant = 'primary', className = '' }) => {
  const logos = {
    primary: '/images/logos/logo-primary.svg',
    dark: '/images/logos/logo-dark.svg',
    white: '/images/logos/logo-white.svg'
  };
  
  return (
    <img 
      src={logos[variant]} 
      alt="AImpactScanner" 
      className={className}
      width="200"
      height="50"
    />
  );
};
```

### Step 4: Use in header
```jsx
// In App.jsx or header component
import { Logo } from './components/ImagePlaceholders';

<header className="bg-blue-900 p-4">
  <Logo variant="white" className="h-10 w-auto" />
</header>
```

---

## 2. Hero Illustration

### Add to Landing component
```jsx
// In src/components/Landing.jsx
import { HeroIllustration } from './ImagePlaceholders';

// Replace placeholder with:
<div className="hero-section">
  <picture>
    <source 
      srcSet="/images/illustrations/hero-desktop.webp" 
      type="image/webp"
      media="(min-width: 768px)"
    />
    <source 
      srcSet="/images/illustrations/hero-mobile.webp" 
      type="image/webp"
      media="(max-width: 767px)"
    />
    <img 
      src="/images/illustrations/hero-desktop.png" 
      alt="AI-powered website analysis"
      className="w-full max-w-4xl mx-auto"
      loading="eager"
    />
  </picture>
</div>
```

---

## 3. Feature Icons

### Create icon component
```jsx
// In src/components/FeatureIcon.jsx
const FeatureIcon = ({ type, className = '' }) => {
  return (
    <img 
      src={`/images/icons/icon-${type}.svg`}
      alt={`${type} feature`}
      className={`w-16 h-16 ${className}`}
    />
  );
};
```

### Use in feature sections
```jsx
// In TeaserResults.jsx or feature lists
<div className="feature-grid">
  <div className="feature-item">
    <FeatureIcon type="ai-analysis" />
    <h3>AI Analysis</h3>
  </div>
  <div className="feature-item">
    <FeatureIcon type="competitive" />
    <h3>Competitive Intelligence</h3>
  </div>
</div>
```

---

## 4. Loading Animations

### For Lottie animations
```bash
npm install lottie-react
```

```jsx
// In src/components/LoadingAnimation.jsx
import Lottie from 'lottie-react';
import animationData from '../assets/animations/loading.json';

export const LoadingAnimation = () => (
  <Lottie 
    animationData={animationData}
    loop={true}
    style={{ width: 120, height: 120 }}
  />
);
```

### For SVG animations
```jsx
// Place animated SVG directly in component
export const LoadingAnimation = () => (
  <svg className="animate-spin h-20 w-20">
    {/* SVG content */}
  </svg>
);
```

---

## 5. Pricing Tier Illustrations

### Update TierSelection component
```jsx
// In src/components/TierSelection.jsx
const tierImages = {
  free: '/images/tiers/tier-free.svg',
  coffee: '/images/tiers/tier-coffee.svg',
  professional: '/images/tiers/tier-professional.svg'
};

// In the tier card:
<div className="tier-card">
  <img 
    src={tierImages[tier.id]} 
    alt={`${tier.name} tier`}
    className="w-32 h-32 mx-auto mb-4"
  />
  {/* Rest of tier content */}
</div>
```

---

## 6. Trust Badges

### Add to footer or key sections
```jsx
// In footer or trust section
<div className="trust-badges flex justify-center gap-4">
  <img src="/images/badges/badge-ssl.svg" alt="SSL Secured" className="h-10" />
  <img src="/images/badges/badge-privacy.svg" alt="Data Privacy" className="h-10" />
  <img src="/images/badges/badge-guarantee.svg" alt="30-Day Guarantee" className="h-10" />
</div>
```

---

## Performance Optimization

### 1. Lazy Loading
```jsx
// For below-fold images
<img 
  src="/images/illustration.png" 
  loading="lazy"
  alt="Description"
/>
```

### 2. Responsive Images
```jsx
<picture>
  <source 
    media="(max-width: 640px)" 
    srcset="/images/hero-mobile.webp"
  />
  <source 
    media="(min-width: 641px)" 
    srcset="/images/hero-desktop.webp"
  />
  <img src="/images/hero-desktop.png" alt="Hero" />
</picture>
```

### 3. Preload Critical Images
```html
<!-- In index.html -->
<link rel="preload" as="image" href="/images/logos/logo-primary.svg">
<link rel="preload" as="image" href="/images/illustrations/hero-desktop.webp">
```

---

## Testing Checklist

- [ ] Logo appears correctly in header
- [ ] Favicon shows in browser tab
- [ ] Hero illustration loads quickly
- [ ] Feature icons display properly
- [ ] Loading animations work smoothly
- [ ] Tier illustrations align correctly
- [ ] Trust badges are visible
- [ ] Images load on mobile devices
- [ ] WebP fallback to PNG works
- [ ] Total page weight < 2MB
- [ ] Lighthouse performance score > 90

---

## File Structure
```
public/
  images/
    logos/
      - logo-primary.svg
      - logo-dark.svg
      - logo-white.svg
      - favicon-16.png
      - favicon-32.png
      - apple-touch-icon.png
    illustrations/
      - hero-desktop.webp
      - hero-desktop.png
      - hero-mobile.webp
      - hero-mobile.png
    icons/
      - icon-ai-analysis.svg
      - icon-competitive.svg
      - icon-traffic.svg
      - etc...
    tiers/
      - tier-free.svg
      - tier-coffee.svg
      - tier-professional.svg
    badges/
      - badge-ssl.svg
      - badge-privacy.svg
      - badge-guarantee.svg
    animations/
      - loading.json (if using Lottie)
      - success.svg
    empty-states/
      - no-analysis.svg
      - error.svg
      - welcome.svg
```

---

## Notes
- Always provide alt text for accessibility
- Use WebP with PNG fallback for best performance
- Keep SVGs for icons and logos (scalable)
- Optimize all images before deployment
- Test on slow 3G connection
- Ensure images work with both light and dark themes