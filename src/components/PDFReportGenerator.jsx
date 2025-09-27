/**
 * PDF Report Generator Component
 * 
 * Professional PDF report generation for AImpactScanner analysis results
 * Uses jsPDF for high-quality business reports with brand consistency
 * 
 * Phase 2: PDF Report Component Development
 * Target: 2-3 hours implementation with SimpleResultsDashboard integration
 */

import React, { useRef, useState } from 'react';
import jsPDF from 'jspdf';

const PDFReportGenerator = ({ analysisId, url, analysisData, onReportGenerated, className }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [progress, setProgress] = useState(0);
  const reportRef = useRef(null);

  // Helper function to get display name for pillar codes
  const getPillarDisplayName = (pillarCode) => {
    const pillarNames = {
      'M': 'Machine Readability',
      'AI': 'AI Response Optimization',
      'A': 'Authority & Trust',
      'S': 'Semantic Content',
      'E': 'Engagement & UX',
      'T': 'Topical Expertise',
      'R': 'Reference Networks',
      'Y': 'Yield Optimization',
      // Also handle lowercase keys for pillars
      'machine_readability': 'Machine Readability',
      'ai': 'AI Response Optimization',
      'authority': 'Authority & Trust',
      'semantic': 'Semantic Content',
      'engagement': 'Engagement & UX',
      'topical': 'Topical Expertise',
      'reference': 'Reference Networks',
      'yield': 'Yield Optimization'
    };
    return pillarNames[pillarCode] || pillarCode;
  };

  // Extract data from analysisData - handles both real and mock data
  const extractReportData = () => {
    if (!analysisData) {
      throw new Error('Analysis data is required to generate PDF report');
    }

    const reportData = {
      analysisId: analysisId || `AISC-${Date.now()}`,
      url: url || analysisData.url || 'No URL provided',
      overallScore: analysisData.overall_score || 0,
      generatedAt: new Date(),
      factors: analysisData.factors || [],
      pillars: analysisData.pillars || {}
    };

    // Group factors by pillar for organized display
    const groupedFactors = {};
    const pillarOrder = [
      { key: 'ai', name: 'AI Response Optimization & Citation', icon: '🤖', color: '#1E3A8A' },
      { key: 'authority', name: 'Authority & Trust Signals', icon: '🔐', color: '#7C3AED' },
      { key: 'machine_readability', name: 'Machine Readability & Technical Infrastructure', icon: '⚙️', color: '#059669' },
      { key: 'semantic', name: 'Semantic Content Quality', icon: '📝', color: '#EA580C' },
      { key: 'engagement', name: 'Engagement & User Experience', icon: '👥', color: '#EAB308' },
      { key: 'topical', name: 'Topical Expertise & Experience', icon: '🎯', color: '#6366F1' },
      { key: 'reference', name: 'Reference Networks & Citations', icon: '🔗', color: '#6B7280' },
      { key: 'yield', name: 'Yield Optimization & Freshness', icon: '📈', color: '#0891B2' }
    ];

    // Initialize groups
    pillarOrder.forEach(pillar => {
      const pillarData = reportData.pillars[pillar.key] || {};
      groupedFactors[pillar.key] = {
        name: pillar.name,
        icon: pillar.icon,
        color: pillar.color,
        score: pillarData.score || 0,
        weight: pillarData.weight || 0,
        factors: []
      };
    });

    // Group factors by pillar
    reportData.factors.forEach(factor => {
      // Map pillar codes from Edge Function (e.g., 'M', 'AI', 'A')
      const pillarCodeMapping = {
        'M': 'machine_readability',
        'AI': 'ai',
        'A': 'authority',
        'S': 'semantic',
        'E': 'engagement',
        'T': 'topical',
        'R': 'reference',
        'Y': 'yield'
      };
      
      // Map factor pillar names to keys (for backward compatibility with mock data)
      const pillarMappings = {
        'AI Response Optimization': 'ai',
        'Authority & Trust': 'authority',
        'Machine Readability': 'machine_readability',
        'Semantic Content': 'semantic',
        'Engagement': 'engagement',
        'Topical Expertise': 'topical',
        'Reference Networks': 'reference',
        'Yield Optimization': 'yield'
      };
      
      // Try pillar codes first (real data), then pillar names (mock data), then default
      const pillarKey = pillarCodeMapping[factor.pillar] || 
                       pillarMappings[factor.pillar] || 
                       'machine_readability';
      
      if (groupedFactors[pillarKey]) {
        groupedFactors[pillarKey].factors.push(factor);
      }
    });

    return { ...reportData, groupedFactors };
  };

  // Generate score interpretation
  const getScoreInterpretation = (score) => {
    if (score >= 80) return { label: 'Excellent', color: '#059669', description: 'Outstanding AI optimization with minimal improvement needed' };
    if (score >= 60) return { label: 'Good', color: '#EAB308', description: 'Solid foundation with targeted optimization opportunities' };
    if (score >= 40) return { label: 'Moderate', color: '#EA580C', description: 'Significant improvement potential across multiple factors' };
    return { label: 'Needs Improvement', color: '#DC2626', description: 'Critical optimization required for AI visibility' };
  };

  // Generate executive summary based on analysis
  const generateExecutiveSummary = (data) => {
    const interpretation = getScoreInterpretation(data.overallScore);
    const topFactors = data.factors.slice().sort((a, b) => b.score - a.score).slice(0, 3);
    const bottomFactors = data.factors.slice().sort((a, b) => a.score - b.score).slice(0, 3);
    
    return {
      overall: interpretation,
      strengths: topFactors,
      improvements: bottomFactors,
      keyInsights: [
        `${data.factors.length} factors analyzed using MASTERY-AI Framework v3.1.1`,
        `Framework compliance score: ${data.overallScore}/100`,
        `Primary optimization focus: ${getPillarDisplayName(bottomFactors[0]?.pillar) || 'Technical Infrastructure'}`
      ]
    };
  };

  // Generate prioritized recommendations
  const generateRecommendations = (data) => {
    const recommendations = [];
    
    // High priority - factors scoring below 50
    const criticalFactors = data.factors.filter(f => f.score < 50);
    criticalFactors.forEach(factor => {
      const factorLabel = factor.factor_id ? 
        `[${factor.factor_id}] ${factor.factor_name || factor.name}` : 
        factor.factor_name || factor.name;
      recommendations.push({
        priority: 'High',
        factor: factorLabel,
        pillar: getPillarDisplayName(factor.pillar),
        score: factor.score,
        actions: factor.recommendations || ['Review and optimize this factor'],
        impact: 'Critical for AI visibility improvement'
      });
    });

    // Medium priority - factors scoring 50-70
    const moderateFactors = data.factors.filter(f => f.score >= 50 && f.score < 70);
    moderateFactors.slice(0, 3).forEach(factor => {
      const factorLabel = factor.factor_id ? 
        `[${factor.factor_id}] ${factor.factor_name || factor.name}` : 
        factor.factor_name || factor.name;
      recommendations.push({
        priority: 'Medium',
        factor: factorLabel,
        pillar: getPillarDisplayName(factor.pillar),
        score: factor.score,
        actions: factor.recommendations || ['Enhance optimization for this factor'],
        impact: 'Significant opportunity for score improvement'
      });
    });

    // Low priority - factors scoring 70-85
    const optimizationFactors = data.factors.filter(f => f.score >= 70 && f.score < 85);
    optimizationFactors.slice(0, 2).forEach(factor => {
      const factorLabel = factor.factor_id ? 
        `[${factor.factor_id}] ${factor.factor_name || factor.name}` : 
        factor.factor_name || factor.name;
      recommendations.push({
        priority: 'Low',
        factor: factorLabel,
        pillar: getPillarDisplayName(factor.pillar),
        score: factor.score,
        actions: factor.recommendations || ['Fine-tune optimization for maximum impact'],
        impact: 'Incremental improvement potential'
      });
    });

    return recommendations.slice(0, 8); // Limit to 8 recommendations for PDF space
  };

  // Main PDF generation function
  const generatePDF = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      // Progress: Data extraction
      setProgress(10);
      // Extract and process data
      const reportData = extractReportData();
      setProgress(25);
      
      const summary = generateExecutiveSummary(reportData);
      setProgress(35);
      
      const recommendations = generateRecommendations(reportData);
      setProgress(45);

      // Create PDF document
      setProgress(55);
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (neededSpace) => {
        if (currentY + neededSpace > pageHeight - margin) {
          pdf.addPage();
          currentY = margin;
          return true;
        }
        return false;
      };

      // Helper function to add text with word wrapping
      const addText = (text, x, y, options = {}) => {
        const {
          fontSize = 10,
          fontStyle = 'normal',
          color = '#0F172A',
          maxWidth = contentWidth,
          lineHeight = 1.4
        } = options;

        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        pdf.setTextColor(color);

        const lines = pdf.splitTextToSize(text, maxWidth);
        const totalHeight = lines.length * fontSize * lineHeight * 0.352778; // Convert pt to mm

        checkPageBreak(totalHeight + 5);
        
        lines.forEach((line, index) => {
          pdf.text(line, x, currentY + (index * fontSize * lineHeight * 0.352778));
        });

        currentY += totalHeight + 2;
        return totalHeight;
      };

      // === PAGE 1: HEADER & EXECUTIVE SUMMARY ===
      
      // Header with logo placeholder and branding
      pdf.setFillColor(30, 58, 138); // mastery-blue
      pdf.rect(0, 0, pageWidth, 35, 'F');
      
      pdf.setTextColor('#FFFFFF');
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AImpactScanner', margin, 20);
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('AI Optimization Analysis Report', margin, 28);

      // Report metadata
      currentY = 45;
      pdf.setTextColor('#6B7280');
      pdf.setFontSize(10);
      pdf.text(`Analysis ID: ${reportData.analysisId}`, margin, currentY);
      pdf.text(`Generated: ${reportData.generatedAt.toLocaleDateString()} ${reportData.generatedAt.toLocaleTimeString()}`, margin, currentY + 5);
      pdf.text(`Framework: MASTERY-AI v3.1.1`, margin, currentY + 10);
      
      currentY += 20;

      // URL and Overall Score Section
      checkPageBreak(30);
      addText('Analyzed Website', margin, currentY, { fontSize: 16, fontStyle: 'bold', color: '#1E3A8A' });
      addText(reportData.url, margin, currentY, { fontSize: 12, maxWidth: contentWidth - 50 });
      
      // Overall Score Box
      const scoreBoxY = currentY;
      // Convert hex color to RGB with light background
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 200, g: 200, b: 200 };
      };
      const rgb = hexToRgb(summary.overall.color);
      // Light tinted background (10% opacity effect)
      pdf.setFillColor(255 - (255 - rgb.r) * 0.1, 255 - (255 - rgb.g) * 0.1, 255 - (255 - rgb.b) * 0.1);
      pdf.rect(contentWidth - 40, scoreBoxY - 5, 40, 20, 'F');
      
      pdf.setTextColor(summary.overall.color);
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text(reportData.overallScore.toString(), contentWidth - 30, scoreBoxY + 5);
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Overall Score', contentWidth - 35, scoreBoxY + 12);
      
      currentY += 25;

      // Executive Summary Section
      addText('Executive Summary', margin, currentY, { fontSize: 16, fontStyle: 'bold', color: '#1E3A8A' });
      
      addText(`Performance Level: ${summary.overall.label}`, margin, currentY, { fontSize: 12, fontStyle: 'bold' });
      addText(summary.overall.description, margin, currentY, { fontSize: 11 });
      
      // Key Insights
      addText('Key Insights:', margin, currentY, { fontSize: 12, fontStyle: 'bold' });
      summary.keyInsights.forEach(insight => {
        addText(`• ${insight}`, margin + 5, currentY, { fontSize: 10 });
      });

      currentY += 5;

      // Top Performing Factors
      if (summary.strengths.length > 0) {
        addText('Top Performing Factors:', margin, currentY, { fontSize: 12, fontStyle: 'bold', color: '#059669' });
        summary.strengths.forEach((factor, index) => {
          const factorLabel = factor.factor_id ? 
            `[${factor.factor_id}] ${factor.factor_name || factor.name}` : 
            factor.factor_name || factor.name;
          addText(`${index + 1}. ${factorLabel}: ${factor.score}/100`, margin + 5, currentY, { fontSize: 10 });
        });
      }

      // Priority Improvement Areas
      if (summary.improvements.length > 0) {
        addText('Priority Improvement Areas:', margin, currentY, { fontSize: 12, fontStyle: 'bold', color: '#DC2626' });
        summary.improvements.forEach((factor, index) => {
          const factorLabel = factor.factor_id ? 
            `[${factor.factor_id}] ${factor.factor_name || factor.name}` : 
            factor.factor_name || factor.name;
          addText(`${index + 1}. ${factorLabel}: ${factor.score}/100`, margin + 5, currentY, { fontSize: 10 });
        });
      }

      // === PAGE 2: MASTERY-AI FRAMEWORK RESULTS ===
      setProgress(70);
      
      pdf.addPage();
      currentY = margin;
      
      addText('MASTERY-AI Framework Results', margin, currentY, { fontSize: 18, fontStyle: 'bold', color: '#1E3A8A' });
      addText('8-Pillar Optimization Framework Analysis', margin, currentY, { fontSize: 12, color: '#6B7280' });
      
      currentY += 5;

      // Pillar Scores Grid - Show all 8 pillars
      const pillarKeys = Object.keys(reportData.groupedFactors); // Show all pillars, even with 0 factors
      
      pillarKeys.forEach((key, index) => {
        const pillar = reportData.groupedFactors[key];
        
        if (index % 2 === 0) {
          checkPageBreak(25);
        }
        
        const xOffset = (index % 2) * (contentWidth / 2 + 5);
        const yPos = currentY + Math.floor(index / 2) * 25;
        
        // Pillar box
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin + xOffset, yPos, contentWidth / 2 - 5, 22, 'F');
        
        pdf.setTextColor('#1F2937');
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        // Use abbreviated pillar names or split into two lines
        pdf.setFontSize(8);
        const pillarWords = pillar.name.split(' ');
        if (pillarWords.length > 3) {
          // For long names, use first line for main words
          const firstLine = pillarWords.slice(0, 2).join(' ');
          const secondLine = pillarWords.slice(2).join(' ');
          pdf.text(firstLine, margin + xOffset + 3, yPos + 5);
          pdf.text(secondLine, margin + xOffset + 3, yPos + 8);
        } else {
          pdf.text(pillar.name, margin + xOffset + 3, yPos + 6);
        }
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(pillar.color);
        pdf.text(`${pillar.score}`, margin + xOffset + 3, yPos + 13);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor('#6B7280');
        pdf.text(`Weight: ${pillar.weight}% | ${pillar.factors.length} factors`, margin + xOffset + 3, yPos + 19);
      });
      
      currentY += Math.ceil(pillarKeys.length / 2) * 25 + 10;

      // === PAGE 3+: FACTOR ANALYSIS DETAILS ===
      setProgress(80);
      
      if (pillarKeys.length > 0) {
        pdf.addPage();
        currentY = margin;
        
        addText('Detailed Factor Analysis', margin, currentY, { fontSize: 18, fontStyle: 'bold', color: '#1E3A8A' });
        
        pillarKeys.forEach(key => {
          const pillar = reportData.groupedFactors[key];
          
          checkPageBreak(20);
          
          // Pillar section header
          pdf.setFillColor(248, 250, 252);
          pdf.rect(margin - 2, currentY, contentWidth + 4, 12, 'F');
          
          // Place text inside the blue box properly
          pdf.setTextColor(pillar.color);
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          // Skip emoji icons as jsPDF doesn't handle them well
          pdf.text(pillar.name, margin, currentY + 8);
          
          currentY += 15; // Add more space to prevent overlap
          
          // Check if pillar has factors
          if (pillar.factors.length > 0) {
            // Factor details
            pillar.factors.forEach(factor => {
              checkPageBreak(30);
              
              // Factor name with ID and score
              const factorLabel = factor.factor_id ? 
                `[${factor.factor_id}] ${factor.factor_name || factor.name}` : 
                factor.factor_name || factor.name;
              addText(factorLabel, margin + 5, currentY, { fontSize: 12, fontStyle: 'bold' });
              
              pdf.setTextColor(factor.score >= 70 ? '#059669' : factor.score >= 50 ? '#EAB308' : '#DC2626');
              pdf.setFontSize(14);
              pdf.setFont('helvetica', 'bold');
              pdf.text(`${factor.score}/100`, contentWidth - 15, currentY - 2);
              
              currentY += 2;
              
              // Evidence
              if (factor.evidence && factor.evidence.length > 0) {
                addText('Evidence Found:', margin + 5, currentY, { fontSize: 10, fontStyle: 'bold', color: '#059669' });
                factor.evidence.forEach(evidence => {
                  addText(`• ${evidence}`, margin + 10, currentY, { fontSize: 9, color: '#374151' });
                });
              }
              
              // Recommendations
              if (factor.recommendations && factor.recommendations.length > 0) {
                addText('Recommendations:', margin + 5, currentY, { fontSize: 10, fontStyle: 'bold', color: '#1E3A8A' });
                factor.recommendations.forEach(rec => {
                  addText(`• ${rec}`, margin + 10, currentY, { fontSize: 9, color: '#374151' });
                });
              }
              
              currentY += 5;
            });
            
            currentY += 3;
          } else {
            // No factors analyzed for this pillar
            pdf.setTextColor('#6B7280');
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            pdf.text('No factors analyzed in Phase A for this pillar', margin + 5, currentY);
            currentY += 8;
          }
        });
      }

      // === FINAL PAGE: RECOMMENDATIONS & NEXT STEPS ===
      setProgress(90);
      
      pdf.addPage();
      currentY = margin;
      
      addText('Prioritized Action Plan', margin, currentY, { fontSize: 18, fontStyle: 'bold', color: '#1E3A8A' });
      addText('Recommended optimization sequence based on impact potential', margin, currentY, { fontSize: 11, color: '#6B7280' });
      
      currentY += 5;
      
      // Recommendations by priority
      const priorityColors = { 'High': '#DC2626', 'Medium': '#EAB308', 'Low': '#6B7280' };
      let currentPriority = '';
      
      recommendations.forEach((rec, index) => {
        if (rec.priority !== currentPriority) {
          currentPriority = rec.priority;
          checkPageBreak(15);
          addText(`${rec.priority} Priority Items`, margin, currentY, { 
            fontSize: 14, 
            fontStyle: 'bold', 
            color: priorityColors[rec.priority] 
          });
        }
        
        checkPageBreak(20);
        
        addText(`${index + 1}. ${rec.factor} (${rec.pillar})`, margin + 5, currentY, { fontSize: 11, fontStyle: 'bold' });
        addText(`Current Score: ${rec.score}/100 | ${rec.impact}`, margin + 5, currentY, { fontSize: 9, color: '#6B7280' });
        
        rec.actions.forEach(action => {
          addText(`• ${action}`, margin + 10, currentY, { fontSize: 9 });
        });
        
        currentY += 3;
      });

      // Footer
      const footerY = pageHeight - 20;
      pdf.setTextColor('#6B7280');
      pdf.setFontSize(8);
      pdf.text('Generated by AImpactScanner | MASTERY-AI Framework v3.1.1', margin, footerY);
      pdf.text(`Report ID: ${reportData.analysisId}`, contentWidth - 30, footerY);

      // Save PDF
      setProgress(95);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `AImpactScanner-Report-${timestamp}.pdf`;
      
      pdf.save(filename);
      setProgress(100);

      // Success message
      setSuccess({
        message: 'PDF report generated successfully!',
        filename,
        details: `${reportData.factors.length} factors analyzed | Score: ${reportData.overallScore}/100`
      });

      // Callback for parent component
      if (onReportGenerated) {
        onReportGenerated({
          filename,
          analysisId: reportData.analysisId,
          overallScore: reportData.overallScore,
          factorsCount: reportData.factors.length
        });
      }
      
      // Clear success message after 4 seconds
      setTimeout(() => setSuccess(null), 4000);

    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError(`Failed to generate PDF report: ${err.message}`);
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pdf-report-generator">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">PDF Generation Error</h3>
              <div className="mt-1 text-sm text-red-700">
                {error}
              </div>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-600 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 animate-fade-in">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">{success.message}</h3>
              <div className="mt-1 text-sm text-green-700">
                <strong>File:</strong> {success.filename}<br/>
                <strong>Details:</strong> {success.details}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {isGenerating && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
            <span>Generating PDF report...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {progress <= 25 ? 'Analyzing data...' :
             progress <= 45 ? 'Processing insights...' :
             progress <= 70 ? 'Creating document structure...' :
             progress <= 90 ? 'Formatting results...' :
             'Finalizing report...'}
          </div>
        </div>
      )}

      <button
        onClick={generatePDF}
        disabled={isGenerating || !analysisData}
        className={`${className || 'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white transition-colors duration-200'} ${
          isGenerating || !analysisData
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
        }`}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="hidden sm:inline">Generating PDF Report...</span>
            <span className="sm:hidden">Generating...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export PDF Report</span>
            <span className="sm:hidden">PDF Export</span>
          </>
        )}
      </button>
      
      {/* Report preview reference (hidden) */}
      <div ref={reportRef} className="hidden" />
    </div>
  );
};

export default PDFReportGenerator;