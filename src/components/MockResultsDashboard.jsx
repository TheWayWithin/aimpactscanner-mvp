import React from 'react';
import ResultsDashboard from './ResultsDashboard';

// Mock data for testing the ResultsDashboard
const mockAnalysisData = {
  id: "00000000-0000-0000-0000-000000000001",
  url: "https://www.example.com/ai-impact-test",
  status: "completed",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockFactorsData = [
  // AI Pillar factors
  {
    id: "1",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "AI.1.1",
    factor_name: "HTTPS Security",
    pillar: "AI",
    score: 95,
    confidence: 95,
    evidence: ["Website uses HTTPS protocol", "Valid SSL certificate detected"],
    recommendations: ["SSL certificate is properly configured"],
    educational_content: "HTTPS is crucial for AI systems to trust your content. Search engines and AI models prioritize secure connections.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "AI.1.2",
    factor_name: "Title Optimization",
    pillar: "AI",
    score: 72,
    confidence: 88,
    evidence: ["Title tag present", "Length: 42 characters"],
    recommendations: ["Consider adding target keywords", "Optimize for AI search queries"],
    educational_content: "Title tags are the first element AI systems read. Optimize for both human readers and AI understanding.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  {
    id: "3",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "AI.1.3",
    factor_name: "Meta Description",
    pillar: "AI",
    score: 45,
    confidence: 82,
    evidence: ["Meta description present", "Length: 89 characters"],
    recommendations: ["Expand description to 150-160 characters", "Include more descriptive keywords"],
    educational_content: "Meta descriptions help AI understand page content. Aim for 150-160 characters with clear, descriptive language.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  // Authority Pillar factors
  {
    id: "4",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "A.2.1",
    factor_name: "Author Information",
    pillar: "A",
    score: 35,
    confidence: 75,
    evidence: ["No author byline found", "No author schema markup"],
    recommendations: ["Add clear author attribution", "Implement author schema markup", "Create author bio section"],
    educational_content: "Author information builds trust with AI systems. Clear attribution signals expertise and credibility.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  {
    id: "5",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "A.3.2",
    factor_name: "Contact Information",
    pillar: "A",
    score: 88,
    confidence: 92,
    evidence: ["Contact page present", "Multiple contact methods available"],
    recommendations: ["Consider adding structured contact data"],
    educational_content: "Accessible contact information builds trust and authority signals for AI systems.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  // Machine Readability factors
  {
    id: "6",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "M.2.3",
    factor_name: "Image Alt Text",
    pillar: "M",
    score: 62,
    confidence: 85,
    evidence: ["5 images found", "3 have alt text", "2 missing alt text"],
    recommendations: ["Add alt text to all images", "Use descriptive, keyword-rich alt text"],
    educational_content: "Alt text helps AI understand image content and improves accessibility for all users.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  // Semantic Content factors
  {
    id: "7",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "S.1.1",
    factor_name: "Heading Hierarchy",
    pillar: "S",
    score: 78,
    confidence: 90,
    evidence: ["H1 tag present", "H2 tags properly nested", "Clear content structure"],
    recommendations: ["Consider adding more H3 subheadings", "Ensure keywords in headings"],
    educational_content: "Proper heading hierarchy helps AI understand content structure and importance.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  {
    id: "8",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "S.3.1",
    factor_name: "Word Count",
    pillar: "S",
    score: 55,
    confidence: 95,
    evidence: ["Word count: 320 words", "Below recommended minimum"],
    recommendations: ["Expand content to 500+ words", "Add more detailed information"],
    educational_content: "Comprehensive content performs better with AI systems. Aim for depth over brevity.",
    phase: "instant",
    created_at: new Date().toISOString()
  },
  // Topical Relevance factors
  {
    id: "9",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "T.1.2",
    factor_name: "URL Structure",
    pillar: "T",
    score: 85,
    confidence: 88,
    evidence: ["Clean URL structure", "Keywords in URL", "No dynamic parameters"],
    recommendations: ["URL structure is well optimized"],
    educational_content: "Clean URLs help AI systems understand page topic and context.",
    phase: "background",
    created_at: new Date().toISOString()
  },
  // Engagement factors
  {
    id: "10",
    analysis_id: "00000000-0000-0000-0000-000000000001",
    factor_id: "E.4.2",
    factor_name: "Social Media Links",
    pillar: "E",
    score: 25,
    confidence: 80,
    evidence: ["No social media links found", "No social sharing buttons"],
    recommendations: ["Add social media presence", "Include social sharing buttons", "Link to relevant social profiles"],
    educational_content: "Social signals help AI understand content popularity and trustworthiness.",
    phase: "background",
    created_at: new Date().toISOString()
  }
];

function MockResultsDashboard() {
  // Simulate the component with mock data
  return (
    <div>
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">🚧 Mock Data Preview</h3>
        <p className="text-yellow-700 text-sm">
          This is a preview with mock data to demonstrate the ResultsDashboard component. 
          Real analysis data will be loaded from the database.
        </p>
      </div>
      
      {/* Override the component's data fetching with mock data */}
      <MockDataProvider analysisData={mockAnalysisData} factorsData={mockFactorsData}>
        <ResultsDashboard analysisId="00000000-0000-0000-0000-000000000001" />
      </MockDataProvider>
    </div>
  );
}

// Helper component to inject mock data
function MockDataProvider({ children, analysisData, factorsData }) {
  // This is a simplified mock - in reality, we'd need to mock the Supabase calls
  React.useEffect(() => {
    // Store mock data globally for the component to use
    window.mockAnalysisData = analysisData;
    window.mockFactorsData = factorsData;
  }, [analysisData, factorsData]);

  return children;
}

export default MockResultsDashboard;