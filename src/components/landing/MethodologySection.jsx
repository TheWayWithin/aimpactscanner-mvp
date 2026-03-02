import React from 'react';
import { Bot, Shield, Settings, FileText, Users, Wrench, Link, TrendingUp } from 'lucide-react';
import { SectionWrapper } from '../ui';

const pillars = [
  { icon: <Bot className="w-5 h-5" />, name: 'AI Readiness', factors: 4 },
  { icon: <Shield className="w-5 h-5" />, name: 'Authority', factors: 3 },
  { icon: <Settings className="w-5 h-5" />, name: 'Machine Readability', factors: 4 },
  { icon: <FileText className="w-5 h-5" />, name: 'Semantic Structure', factors: 3 },
  { icon: <Users className="w-5 h-5" />, name: 'Engagement', factors: 3 },
  { icon: <Wrench className="w-5 h-5" />, name: 'Technical', factors: 4 },
  { icon: <Link className="w-5 h-5" />, name: 'Reference', factors: 3 },
  { icon: <TrendingUp className="w-5 h-5" />, name: 'Yield', factors: 3 },
];

const MethodologySection = ({ onNavigate }) => {
  return (
    <SectionWrapper bg="white" id="methodology-brief">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-4">
          Built on a Published, Transparent Framework
        </h2>
        <p className="text-lg text-slate max-w-3xl mx-auto">
          The MASTERY-AI Framework evaluates 27 factors across 8 pillars.
          Every factor is documented. Every score is reproducible.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-10">
        {pillars.map((pillar) => (
          <div
            key={pillar.name}
            className="flex items-center gap-3 bg-cloud rounded-lg px-4 py-3 border border-mist"
          >
            <div className="text-signal flex-shrink-0">{pillar.icon}</div>
            <div>
              <div className="text-sm font-semibold text-ink leading-tight">{pillar.name}</div>
              <div className="text-xs text-stone">{pillar.factors} factors</div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-slate mb-4">
          You can read every factor and how it's scored before you ever run a scan.
        </p>
        <button
          onClick={() => onNavigate('methodology')}
          className="text-signal hover:text-signal/80 font-medium transition-colors"
        >
          Read the full methodology →
        </button>
      </div>
    </SectionWrapper>
  );
};

export default MethodologySection;
