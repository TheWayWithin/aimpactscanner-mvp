import React from 'react';
import { getVariant, AB_TESTS } from '../../lib/abtest';

const SUBHEADLINES = {
  control: 'Analyze your page against the published 27-factor MASTERY-AI Framework. Get a prioritized list of what to fix first — free in under 60 seconds.',
  benefit: 'Find out why AI assistants skip your business — and get a prioritized fix list in under 60 seconds. Free, no signup.',
};

const HeroSection = ({ url, setUrl, isAnalyzing, error, onSubmit }) => {
  const test = AB_TESTS.hero_subheadline_v1;
  const subheadlineVariant = test.status === 'active'
    ? getVariant('hero_subheadline_v1', test.variants)
    : 'control';

  return (
    <section className="relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-mastery via-mastery to-clarity opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-signal/20 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            See how AI sees{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
              your business.
            </span>
          </h1>

          {/* Sub-headline (A/B tested when active) */}
          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
            {SUBHEADLINES[subheadlineVariant]}
          </p>

          {/* Scan Input Form */}
          <form onSubmit={onSubmit} className="max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com/your-most-important-page"
                className="flex-1 px-6 py-4 text-lg border-0 rounded-lg focus:ring-2 focus:ring-signal focus:outline-none shadow-lg text-ink placeholder:text-stone"
                disabled={isAnalyzing}
              />
              <button
                type="submit"
                disabled={isAnalyzing || !url.trim()}
                className="px-8 py-4 bg-signal text-white font-semibold text-lg rounded-lg hover:bg-signal/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  'Scan My Page Free'
                )}
              </button>
            </div>
            {/* Microcopy */}
            <p className="text-sm text-white/60 mt-3">
              We use a real browser to render your page, just like Google. Free scan, no credit card required.
            </p>
            {error && (
              <p className="mt-2 text-red-300 font-medium">{error}</p>
            )}
          </form>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 text-white/70 text-sm">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              27 factors analyzed
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Results in ~60 seconds
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              No email required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
