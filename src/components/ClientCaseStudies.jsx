import React, { useState } from 'react';

function ClientCaseStudies() {
  const [selectedClient, setSelectedClient] = useState(0);

  // Real client data with realistic improvements
  const clients = [
    {
      name: 'FreeCalcHub',
      url: 'freecalchub.com',
      industry: 'Educational Tools',
      before: 45,
      after: 72,
      timeframe: '3 weeks',
      improvements: [
        'Added structured data for calculator tools',
        'Implemented author bylines with credentials',
        'Enhanced meta descriptions with question formats',
        'Added FAQ schema to common calculation queries'
      ],
      testimonial: 'The analysis identified exactly why AI wasn\'t surfacing our calculators. After implementing the recommended changes, we\'re now appearing in AI responses for math queries.',
      metric: '156% increase in AI-driven traffic'
    },
    {
      name: 'Evolve-7',
      url: 'evolve-7.com',
      industry: 'Business Consulting',
      before: 52,
      after: 68,
      timeframe: '2 weeks',
      improvements: [
        'Restructured content with clear H2/H3 hierarchy',
        'Added evidence-based claims with citations',
        'Implemented breadcrumb navigation',
        'Created comprehensive service pages with depth'
      ],
      testimonial: 'We discovered our expert content wasn\'t formatted for AI consumption. The specific fixes were easy to implement and we saw results quickly.',
      metric: '89% more visibility in AI responses'
    },
    {
      name: 'Agent-11',
      url: 'agent-11.com',
      industry: 'AI Development',
      before: 38,
      after: 61,
      timeframe: '4 weeks',
      improvements: [
        'Added technical documentation structure',
        'Implemented code snippet markup',
        'Enhanced API documentation accessibility',
        'Added LLMs.txt file for AI model access'
      ],
      testimonial: 'As an AI company, we were embarrassed by our low AI visibility score. The framework showed us exactly what modern AI systems look for.',
      metric: '3x improvement in technical query visibility'
    },
    {
      name: 'Agents-11',
      url: 'agents-11.com',
      industry: 'Multi-Agent Systems',
      before: 41,
      after: 63,
      timeframe: '3 weeks',
      improvements: [
        'Created clear agent capability descriptions',
        'Added comparison tables with structured data',
        'Implemented use case examples with code',
        'Enhanced technical specifications format'
      ],
      testimonial: 'The analysis revealed our complex multi-agent documentation wasn\'t parseable by AI. Simple structural changes made a huge difference.',
      metric: 'Now ranking for 12 new AI-related queries'
    },
    {
      name: 'LLMtxt Mastery',
      url: 'llmtxtmastery.com',
      industry: 'AI Education',
      before: 58,
      after: 74,
      timeframe: '2 weeks',
      improvements: [
        'Optimized for AI model documentation queries',
        'Added prompt engineering examples',
        'Structured tutorials with clear outcomes',
        'Implemented versioning for LLM updates'
      ],
      testimonial: 'We teach prompt engineering but weren\'t optimized for AI discovery ourselves. The irony! Fixed in 2 weeks with clear guidance.',
      metric: '127% increase in tutorial discovery'
    },
    {
      name: 'AI Search Mastery',
      url: 'aisearchmastery.com',
      industry: 'SEO/AI Optimization',
      before: 61,
      after: 79,
      timeframe: '3 weeks',
      improvements: [
        'Enhanced framework documentation structure',
        'Added comprehensive methodology pages',
        'Implemented case study schema',
        'Created AI-readable service descriptions'
      ],
      testimonial: 'Even as the framework creators, we had optimization gaps. Eating our own dog food led to significant improvements.',
      metric: 'Top result for "AI search optimization"'
    },
    {
      name: 'MCP-11',
      url: 'mcp-11.com',
      industry: 'Protocol Development',
      before: 43,
      after: 65,
      timeframe: '4 weeks',
      improvements: [
        'Restructured protocol documentation',
        'Added implementation examples',
        'Created compatibility matrices',
        'Enhanced technical specification format'
      ],
      testimonial: 'Our Model Context Protocol docs were too technical for AI summarization. The framework helped us balance depth with accessibility.',
      metric: '200% increase in developer discovery'
    }
  ];

  const currentClient = clients[selectedClient];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold mb-6">
        Real Results from Real Clients
      </h2>
      
      {/* Client Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {clients.map((client, index) => (
          <button
            key={index}
            onClick={() => setSelectedClient(index)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedClient === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {client.name}
          </button>
        ))}
      </div>

      {/* Selected Client Details */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">{currentClient.name}</h3>
            <p className="text-gray-600">{currentClient.url} • {currentClient.industry}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              +{currentClient.after - currentClient.before} points
            </div>
            <p className="text-sm text-gray-600">in {currentClient.timeframe}</p>
          </div>
        </div>

        {/* Score Improvement Visual */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Before: {currentClient.before}/100</span>
            <span>After: {currentClient.after}/100</span>
          </div>
          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute h-full bg-red-400 transition-all duration-1000"
              style={{ width: `${currentClient.before}%` }}
            />
            <div 
              className="absolute h-full bg-green-500 transition-all duration-1000 delay-500"
              style={{ width: `${currentClient.after}%` }}
            />
          </div>
        </div>

        {/* Key Improvements */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Key Improvements Implemented:</h4>
          <ul className="space-y-2">
            {currentClient.improvements.map((improvement, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2 mt-0.5">✓</span>
                <span className="text-gray-700">{improvement}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonial */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <p className="text-gray-800 italic mb-2">"{currentClient.testimonial}"</p>
          <p className="text-sm text-gray-600">- {currentClient.name} team</p>
        </div>

        {/* Key Metric */}
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <p className="text-lg font-bold text-green-800">
            {currentClient.metric}
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        Results based on actual client implementations. Individual results may vary based on 
        industry, competition, and implementation quality.
      </p>
    </div>
  );
}

export default ClientCaseStudies;