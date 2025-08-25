/**
 * PDF Generation Utilities for AImpactScanner Reports
 * 
 * Phase 1: Basic PDF generation setup and testing functionality
 * Uses jsPDF and html2canvas for HTML-to-PDF conversion
 * 
 * Compatible with Vite/ES6 modules and cross-browser support
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Test basic PDF generation capability
 * Creates a simple PDF to validate library functionality
 * 
 * @returns {Promise<Blob>} PDF blob for download or validation
 */
export const testPDFGeneration = async () => {
  try {
    // Create new PDF instance (A4 format)
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    
    // Add basic test content
    pdf.setFontSize(20);
    pdf.text('AImpactScanner PDF Test', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text('This is a basic PDF generation test to validate', 20, 50);
    pdf.text('that jsPDF library is working correctly.', 20, 60);
    
    // Add timestamp
    const timestamp = new Date().toLocaleString();
    pdf.text(`Generated: ${timestamp}`, 20, 80);
    
    // Add library versions for debugging
    pdf.text('Libraries loaded successfully:', 20, 100);
    pdf.text('- jsPDF: Available', 20, 110);
    pdf.text('- html2canvas: Available', 20, 120);
    
    // Return PDF as blob for testing
    return pdf.output('blob');
    
  } catch (error) {
    console.error('PDF Generation Test Failed:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  }
};

/**
 * Download a PDF blob with specified filename
 * 
 * @param {Blob} pdfBlob - PDF blob to download
 * @param {string} filename - Filename for the download
 */
export const downloadPDF = (pdfBlob, filename = 'aimpactscanner-test.pdf') => {
  try {
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF Download Failed:', error);
    throw new Error(`PDF download failed: ${error.message}`);
  }
};

/**
 * Test HTML to Canvas conversion capability
 * Validates html2canvas functionality for report generation
 * 
 * @param {HTMLElement} element - HTML element to convert
 * @returns {Promise<HTMLCanvasElement>} Canvas element with rendered HTML
 */
export const testHTMLToCanvas = async (element) => {
  try {
    // Create a clone to avoid modifying the original
    const clone = element.cloneNode(true);
    
    // Fix oklch and other unsupported color functions
    const fixColors = (el) => {
      if (el.style) {
        const styles = el.style;
        for (let i = 0; i < styles.length; i++) {
          const prop = styles[i];
          const value = styles.getPropertyValue(prop);
          if (value && value.includes('oklch')) {
            // Replace oklch with a fallback color
            styles.setProperty(prop, '#3b82f6', 'important'); // Blue fallback
          }
        }
      }
      
      // Recursively fix children
      if (el.children) {
        for (let child of el.children) {
          fixColors(child);
        }
      }
    };
    
    fixColors(clone);
    
    // Temporarily append clone to body for rendering
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    document.body.appendChild(clone);
    
    const canvas = await html2canvas(clone, {
      // Basic configuration for testing
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      useCORS: true, // Handle external images
      logging: false, // Disable debug logging
      onclone: (clonedDoc) => {
        // Additional cleanup in the cloned document
        const elements = clonedDoc.querySelectorAll('*');
        elements.forEach(el => {
          if (el.style) {
            const computedStyle = window.getComputedStyle(el);
            // Check for any oklch colors in computed styles
            for (let prop of ['color', 'backgroundColor', 'borderColor']) {
              const value = computedStyle[prop];
              if (value && value.includes('oklch')) {
                el.style[prop] = '#3b82f6';
              }
            }
          }
        });
      }
    });
    
    // Clean up the clone
    document.body.removeChild(clone);
    
    return canvas;
    
  } catch (error) {
    console.error('HTML to Canvas Test Failed:', error);
    throw new Error(`HTML to canvas conversion failed: ${error.message}`);
  }
};

/**
 * Combined test for HTML element to PDF conversion
 * Tests the complete workflow for future report generation
 * 
 * @param {HTMLElement} element - HTML element to convert to PDF
 * @returns {Promise<Blob>} PDF blob containing the rendered HTML
 */
export const testHTMLToPDF = async (element) => {
  try {
    // Convert HTML to canvas first
    const canvas = await testHTMLToCanvas(element);
    
    // Get canvas dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    
    // Create PDF
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    let position = 0;
    
    // Add canvas as image to PDF
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if content is longer
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf.output('blob');
    
  } catch (error) {
    console.error('HTML to PDF Test Failed:', error);
    throw new Error(`HTML to PDF conversion failed: ${error.message}`);
  }
};

/**
 * Validate PDF generation libraries are properly loaded
 * Returns status object with library availability
 * 
 * @returns {Object} Status object with library checks
 */
export const validatePDFLibraries = () => {
  const status = {
    jsPDF: false,
    html2canvas: false,
    browserSupport: false,
    errors: []
  };
  
  try {
    // Check jsPDF availability
    if (typeof jsPDF !== 'undefined') {
      status.jsPDF = true;
    } else {
      status.errors.push('jsPDF not loaded');
    }
    
    // Check html2canvas availability
    if (typeof html2canvas !== 'undefined') {
      status.html2canvas = true;
    } else {
      status.errors.push('html2canvas not loaded');
    }
    
    // Check basic browser support
    if (typeof Blob !== 'undefined' && typeof URL !== 'undefined') {
      status.browserSupport = true;
    } else {
      status.errors.push('Browser lacks Blob or URL support');
    }
    
  } catch (error) {
    status.errors.push(`Validation error: ${error.message}`);
  }
  
  return status;
};

// Default export for easy importing
export default {
  testPDFGeneration,
  downloadPDF,
  testHTMLToCanvas,
  testHTMLToPDF,
  validatePDFLibraries
};