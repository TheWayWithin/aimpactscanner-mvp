import React from 'react';

const FinalCtaSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Gradient background matching hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-mastery via-mastery to-clarity opacity-95" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to see how AI sees your business?
        </h2>
        <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
          Your first scan is free. No email. No credit card.
          Just enter your URL and get your AI Visibility Score.
        </p>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="px-10 py-4 bg-signal text-white font-semibold text-lg rounded-lg hover:bg-signal/90 transition-all shadow-lg hover:shadow-xl"
        >
          Scan My Page Free
        </button>
        <p className="text-sm text-white/50 mt-4">
          Results in under 60 seconds
        </p>
      </div>
    </section>
  );
};

export default FinalCtaSection;
