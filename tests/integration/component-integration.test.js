// Component Integration Tests for Priority 1 User Journey
// Tests PreviewAnalysis and PreviewResults components with real data flow

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Supabase client
const mockSupabase = {
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      subscribe: vi.fn((callback) => {
        // Simulate subscription status
        setTimeout(() => callback('SUBSCRIBED'), 100);
        return { unsubscribe: vi.fn() };
      })
    }))
  })),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          limit: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                progress_percent: 100,
                message: 'Analysis complete',
                stage: 'finalization',
                educational_content: 'Analysis completed successfully'
              },
              error: null
            }))
          }))
        }))
      }))
    }))
  }))
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: mockSupabase
}));

// Import components after mocking
import PreviewAnalysis from '../../src/components/PreviewAnalysis';
import PreviewResults from '../../src/components/PreviewResults';

describe('PreviewAnalysis Component Integration', () => {
  let mockOnAnalysisComplete;

  beforeEach(() => {
    mockOnAnalysisComplete = vi.fn();
    // Reset mocks
    vi.clearAllMocks();
    // Mock sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });
  });

  afterEach(() => {
    cleanup();
  });

  test('renders initial analysis state correctly', async () => {
    const testUrl = 'https://anthropic.com';
    const testAnalysisId = 'test-analysis-123';

    render(
      <PreviewAnalysis
        analysisId={testAnalysisId}
        url={testUrl}
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    // Check header content
    expect(screen.getByText('Analyzing Your Website')).toBeInTheDocument();
    expect(screen.getByText('Running real AI optimization analysis for:')).toBeInTheDocument();
    expect(screen.getByText(testUrl)).toBeInTheDocument();

    // Check initial progress state
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('Initializing AI analysis framework...')).toBeInTheDocument();

    // Check framework information
    expect(screen.getByText('MASTERY-AI Framework v3.1.1')).toBeInTheDocument();
    expect(screen.getByText('✓ 11 Core Factors:')).toBeInTheDocument();
    expect(screen.getByText('✓ Framework Compliant:')).toBeInTheDocument();
  });

  test('sets up real-time subscription correctly', async () => {
    const testAnalysisId = 'test-analysis-123';
    
    render(
      <PreviewAnalysis
        analysisId={testAnalysisId}
        url="https://example.com"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    await waitFor(() => {
      expect(mockSupabase.channel).toHaveBeenCalledWith(`analysis_progress_${testAnalysisId}`);
    });

    // Verify subscription setup
    const channelInstance = mockSupabase.channel.mock.results[0].value;
    expect(channelInstance.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: '*',
        schema: 'public',
        table: 'analysis_progress',
        filter: `analysis_id=eq.${testAnalysisId}`
      }),
      expect.any(Function)
    );
  });

  test('handles progress updates through subscription', async () => {
    let subscriptionCallback;
    
    // Mock subscription to capture callback
    mockSupabase.channel.mockReturnValue({
      on: vi.fn((event, config, callback) => {
        subscriptionCallback = callback;
        return {
          subscribe: vi.fn((statusCallback) => {
            setTimeout(() => statusCallback('SUBSCRIBED'), 100);
            return { unsubscribe: vi.fn() };
          })
        };
      })
    });

    render(
      <PreviewAnalysis
        analysisId="test-123"
        url="https://example.com"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    await waitFor(() => {
      expect(subscriptionCallback).toBeDefined();
    });

    // Simulate progress update
    const progressUpdate = {
      new: {
        progress_percent: 75,
        message: 'Analyzing content structure...',
        stage: 'content_analysis',
        educational_content: 'Examining your site\'s content hierarchy and semantic structure...'
      }
    };

    subscriptionCallback(progressUpdate);

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Analyzing content structure...')).toBeInTheDocument();
      expect(screen.getByText(/Examining your site's content hierarchy/)).toBeInTheDocument();
    });
  });

  test('triggers completion callback when analysis reaches 100%', async () => {
    let subscriptionCallback;
    
    mockSupabase.channel.mockReturnValue({
      on: vi.fn((event, config, callback) => {
        subscriptionCallback = callback;
        return {
          subscribe: vi.fn((statusCallback) => {
            setTimeout(() => statusCallback('SUBSCRIBED'), 100);
            return { unsubscribe: vi.fn() };
          })
        };
      })
    });

    render(
      <PreviewAnalysis
        analysisId="test-123"
        url="https://example.com"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    await waitFor(() => {
      expect(subscriptionCallback).toBeDefined();
    });

    // Simulate completion
    const completionUpdate = {
      new: {
        progress_percent: 100,
        message: 'Analysis complete!',
        stage: 'completed',
        educational_content: 'Your analysis has been completed successfully.'
      }
    };

    subscriptionCallback(completionUpdate);

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('Analysis Complete!')).toBeInTheDocument();
    });

    // Wait for completion callback (2.5 second delay)
    await waitFor(() => {
      expect(mockOnAnalysisComplete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  test('activates fallback polling on subscription failure', async () => {
    mockSupabase.channel.mockReturnValue({
      on: vi.fn(() => ({
        subscribe: vi.fn((statusCallback) => {
          // Simulate channel error
          setTimeout(() => statusCallback('CHANNEL_ERROR'), 100);
          return { unsubscribe: vi.fn() };
        })
      }))
    });

    render(
      <PreviewAnalysis
        analysisId="test-123"
        url="https://example.com"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    // Wait for fallback polling to activate
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('analysis_progress');
    }, { timeout: 4000 });

    // Verify fallback polling query structure
    const fromCall = mockSupabase.from.mock.results[0].value;
    expect(fromCall.select).toHaveBeenCalledWith('*');
    expect(fromCall.select().eq).toHaveBeenCalledWith('analysis_id', 'test-123');
  });

  test('cleans up subscriptions on unmount', async () => {
    const mockUnsubscribe = vi.fn();
    
    mockSupabase.channel.mockReturnValue({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: mockUnsubscribe
        }))
      }))
    });

    const { unmount } = render(
      <PreviewAnalysis
        analysisId="test-123"
        url="https://example.com"
        onAnalysisComplete={mockOnAnalysisComplete}
      />
    );

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});

describe('PreviewResults Component Integration', () => {
  beforeEach(() => {
    // Mock sessionStorage with sample analysis data
    const mockAnalysisData = {
      results: {
        overall_score: 67,
        factors: [
          {
            name: 'HTTPS Security Implementation',
            score: 85,
            pillar: 'M',
            factor_id: 'M.1.4',
            evidence: ['Site uses HTTPS protocol', 'SSL certificate detected'],
            recommendations: ['Maintain SSL certificate renewal', 'Consider HSTS headers']
          },
          {
            name: 'Title Tag Optimization',
            score: 72,
            pillar: 'M',
            factor_id: 'M.2.1',
            evidence: ['Title tag present', 'Appropriate length detected'],
            recommendations: ['Optimize for target keywords', 'Test click-through variations']
          },
          {
            name: 'Content Authority Signals',
            score: 45,
            pillar: 'A',
            factor_id: 'A.3.1',
            evidence: ['Content structure detected', 'Basic authority indicators found'],
            recommendations: ['Add author credentials', 'Include expertise signals', 'Cite authoritative sources']
          }
        ]
      }
    };

    window.sessionStorage.getItem.mockReturnValue(JSON.stringify(mockAnalysisData));
  });

  afterEach(() => {
    cleanup();
  });

  test('loads and displays analysis data from sessionStorage', async () => {
    const mockOnUpgrade = vi.fn();
    const mockOnFreeTrial = vi.fn();

    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-analysis-123"
        onUpgradeClick={mockOnUpgrade}
        onFreeTrialClick={mockOnFreeTrial}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your AI Optimization Analysis')).toBeInTheDocument();
    });

    // Check URL display
    expect(screen.getByText('https://anthropic.com')).toBeInTheDocument();

    // Check overall score
    expect(screen.getByText('67')).toBeInTheDocument();
    expect(screen.getByText('Overall Score')).toBeInTheDocument();

    // Check real analysis notification
    expect(screen.getByText('Real Analysis Complete!')).toBeInTheDocument();
    expect(screen.getByText(/These are your real scores and recommendations/)).toBeInTheDocument();
  });

  test('displays unlocked factors correctly', async () => {
    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('HTTPS Security Implementation')).toBeInTheDocument();
    });

    // Check first factor details
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Machine Readability • M.1.4')).toBeInTheDocument();
    expect(screen.getByText('Site uses HTTPS protocol')).toBeInTheDocument();
    expect(screen.getByText('Maintain SSL certificate renewal')).toBeInTheDocument();

    // Check second factor
    expect(screen.getByText('Title Tag Optimization')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();

    // Check third factor
    expect(screen.getByText('Content Authority Signals')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Authority • A.3.1')).toBeInTheDocument();
  });

  test('calculates and displays pillar scores', async () => {
    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your AI Optimization Scores')).toBeInTheDocument();
    });

    // Should show pillar scores based on factors
    // Machine Readability: average of 85 and 72 = 78.5, rounded to 79
    expect(screen.getByText('79')).toBeInTheDocument();
    expect(screen.getByText('Machine Readability')).toBeInTheDocument();

    // Authority: 45 (single factor)
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Authority')).toBeInTheDocument();
  });

  test('shows locked content section with correct count', async () => {
    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/8 More Factors Available/)).toBeInTheDocument();
    });

    // Check lock overlay
    expect(screen.getByText('🔒')).toBeInTheDocument();
    expect(screen.getByText('See your complete analysis with detailed recommendations')).toBeInTheDocument();

    // Check blurred preview content
    expect(screen.getByText('Complete Factor Analysis')).toBeInTheDocument();
    expect(screen.getByText('Meta Description Quality')).toBeInTheDocument();
    expect(screen.getByText('Heading Structure & Hierarchy')).toBeInTheDocument();
  });

  test('handles CTA button clicks correctly', async () => {
    const mockOnUpgrade = vi.fn();
    const mockOnFreeTrial = vi.fn();

    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-123"
        onUpgradeClick={mockOnUpgrade}
        onFreeTrialClick={mockOnFreeTrial}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Get Free Account & See All Results')).toBeInTheDocument();
    });

    // Test free trial button
    const freeTrialButton = screen.getByText('Get Free Account & See All Results');
    fireEvent.click(freeTrialButton);
    expect(mockOnFreeTrial).toHaveBeenCalled();

    // Test upgrade button
    const upgradeButton = screen.getByText('☕ Get Unlimited for $5/mo');
    fireEvent.click(upgradeButton);
    expect(mockOnUpgrade).toHaveBeenCalledWith('coffee');
  });

  test('handles missing analysis data gracefully', async () => {
    // Mock empty sessionStorage
    window.sessionStorage.getItem.mockReturnValue(null);

    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your AI Optimization Analysis')).toBeInTheDocument();
    });

    // Should show fallback data
    expect(screen.getByText('65')).toBeInTheDocument(); // Default overall score
    expect(screen.getByText('HTTPS Security Implementation')).toBeInTheDocument(); // Fallback factors
    expect(screen.getByText('Title Tag Optimization')).toBeInTheDocument();
    expect(screen.getByText('Content Authority Signals')).toBeInTheDocument();
  });

  test('displays correct factor count in showing text', async () => {
    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Showing 3 of 3 factors analyzed')).toBeInTheDocument();
    });

    // Check all factors count in CTA section
    expect(screen.getByText('All 3 Factor Results')).toBeInTheDocument();
  });

  test('score color coding works correctly', async () => {
    render(
      <PreviewResults
        url="https://anthropic.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    await waitFor(() => {
      // Find score elements and check their classes
      const score85 = screen.getByText('85').closest('.text-xl');
      const score72 = screen.getByText('72').closest('.text-xl');
      const score45 = screen.getByText('45').closest('.text-xl');

      // Scores >= 80 should be green
      expect(score85).toHaveClass('text-green-600');
      
      // Scores 60-79 should be yellow
      expect(score72).toHaveClass('text-yellow-600');
      
      // Scores < 60 should be red
      expect(score45).toHaveClass('text-red-600');
    });
  });
});

describe('SessionStorage Data Flow Integration', () => {
  test('analysis data persists correctly through component lifecycle', () => {
    const testData = {
      results: {
        overall_score: 78,
        factors: [
          { name: 'Test Factor', score: 85, pillar: 'AI' }
        ]
      }
    };

    // Simulate data being stored during analysis
    sessionStorage.setItem('landingAnalysisData', JSON.stringify(testData));

    // Verify PreviewResults can retrieve it
    window.sessionStorage.getItem.mockReturnValue(JSON.stringify(testData));

    render(
      <PreviewResults
        url="https://test.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    expect(window.sessionStorage.getItem).toHaveBeenCalledWith('landingAnalysisData');
  });

  test('handles corrupted sessionStorage data', async () => {
    // Mock corrupted JSON data
    window.sessionStorage.getItem.mockReturnValue('invalid-json-{');

    // Should not crash and should show fallback content
    render(
      <PreviewResults
        url="https://test.com"
        analysisId="test-123"
        onUpgradeClick={vi.fn()}
        onFreeTrialClick={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Your AI Optimization Analysis')).toBeInTheDocument();
    });

    // Should display fallback score
    expect(screen.getByText('65')).toBeInTheDocument();
  });
});