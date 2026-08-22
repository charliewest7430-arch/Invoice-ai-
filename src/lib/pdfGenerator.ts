import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Converts any oklch(...) expressions in CSS text into valid rgb(...) / rgba(...) strings
 * using browser computed style resolution so html2canvas doesn't throw on unsupported color syntax.
 */
function convertOklchToRgb(cssText: string): string {
  if (!cssText || !cssText.includes('oklch')) return cssText;

  const oklchRegex = /oklch\((?:[^()]+|\([^()]*\))*\)/gi;

  const tempEl = document.createElement('div');
  document.body.appendChild(tempEl);

  const result = cssText.replace(oklchRegex, (match) => {
    try {
      tempEl.style.color = '';
      tempEl.style.color = match;
      const computed = window.getComputedStyle(tempEl).color;
      if (computed && !computed.includes('oklch') && computed !== '') {
        return computed;
      }
    } catch (e) {
      // ignore parsing error
    }
    return 'rgb(30, 41, 59)'; // default fallback neutral color
  });

  if (tempEl.parentNode) {
    tempEl.parentNode.removeChild(tempEl);
  }

  return result;
}

/**
 * Renders an HTML invoice element as an A4 PDF document and downloads it.
 */
export async function downloadInvoicePdf(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Invoice element #${elementId} not found`);
    return false;
  }

  try {
    const scale = 2; // Higher scale for high DPI rendering
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1200,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Sanitize all <style> blocks in clonedDoc to convert oklch(...) to rgb(...)
        const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
        styleElements.forEach((styleEl) => {
          if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
            styleEl.textContent = convertOklchToRgb(styleEl.textContent);
          }
        });

        // 2. Sanitize any inline style attributes containing oklch
        const elementsWithInlineStyle = Array.from(clonedDoc.querySelectorAll('[style*="oklch"]'));
        elementsWithInlineStyle.forEach((el) => {
          const styleAttr = el.getAttribute('style');
          if (styleAttr) {
            el.setAttribute('style', convertOklchToRgb(styleAttr));
          }
        });

        // 3. For the cloned printable element and its children, explicitly inline computed RGB colors
        try {
          const view = clonedDoc.defaultView || window;
          const allNodes = [clonedElement, ...Array.from(clonedElement.querySelectorAll('*'))];
          allNodes.forEach((node) => {
            const htmlNode = node as HTMLElement;
            if (!htmlNode.style) return;

            const computed = view.getComputedStyle(htmlNode);
            if (computed.color && computed.color.includes('rgb')) {
              htmlNode.style.color = computed.color;
            }
            if (
              computed.backgroundColor &&
              computed.backgroundColor.includes('rgb') &&
              computed.backgroundColor !== 'rgba(0, 0, 0, 0)'
            ) {
              htmlNode.style.backgroundColor = computed.backgroundColor;
            }
            if (computed.borderColor && computed.borderColor.includes('rgb')) {
              htmlNode.style.borderColor = computed.borderColor;
            }
          });
        } catch (e) {
          console.warn('Minor error during onclone style inlining:', e);
        }
      },
    });

    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return false;
  }
}

/**
 * Renders an HTML receipt element as a PDF document and downloads it.
 */
export async function downloadReceiptPdf(elementId: string, filename: string): Promise<boolean> {
  return downloadInvoicePdf(elementId, filename);
}

