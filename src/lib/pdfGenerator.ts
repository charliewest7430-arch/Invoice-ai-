import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice, Receipt, Business } from '../types';

/**
 * Triggers a browser file download using a Blob and safe anchor tag execution.
 * Works seamlessly on desktop and mobile browsers.
 */
function triggerBlobDownload(blob: Blob, filename: string) {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Clean up resource after a brief delay for mobile browsers
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link);
    }
    window.URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Safe currency formatter for PDF rendering.
 * Replaces unmapped Unicode symbols with standard textual currency codes where needed.
 */
function formatCurrencyCode(curr?: string): string {
  if (!curr) return 'USD';
  const c = curr.trim().toUpperCase();
  if (c === '₦' || c === 'NGN') return 'NGN';
  if (c === '$' || c === 'USD') return 'USD';
  if (c === '€' || c === 'EUR') return 'EUR';
  if (c === '£' || c === 'GBP') return 'GBP';
  if (c === 'CAD') return 'CAD';
  if (c === 'AUD') return 'AUD';
  return c;
}

/**
 * Formats monetary amounts with commas and 2 decimals.
 */
function formatAmount(val?: number): string {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
    } catch {
      // ignore parsing error
    }
    return 'rgb(30, 41, 59)';
  });

  if (tempEl.parentNode) {
    tempEl.parentNode.removeChild(tempEl);
  }

  return result;
}

/**
 * Generates a clean, professional vector A4 PDF for an Invoice using jsPDF directly.
 * Guaranteed to work regardless of DOM availability or canvas limitations.
 */
export function generateDirectInvoicePdf(invoice: Invoice, business?: Business): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const curr = formatCurrencyCode(invoice.currency);

  // Top header banner
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Business / Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Slate 900
  const bizName = business?.name || 'InvoiceFlow Business';
  doc.text(bizName, margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  let bizY = 30;
  if (business?.email) {
    doc.text(business.email, margin, bizY);
    bizY += 5;
  }
  if (business?.phone) {
    doc.text(business.phone, margin, bizY);
    bizY += 5;
  }
  if (business?.address) {
    const fullAddr = `${business.address}${business.city ? ', ' + business.city : ''}${business.country ? ' ' + business.country : ''}`;
    doc.text(fullAddr, margin, bizY);
    bizY += 5;
  }
  if (business?.tax_id) {
    doc.text(`Tax ID: ${business.tax_id}`, margin, bizY);
  }

  // Invoice Title & Meta (Right Aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.text('INVOICE', pageWidth - margin, 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice #: ${invoice.number || 'INV-0001'}`, pageWidth - margin, 32, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const issueDate = invoice.issue_date || new Date().toISOString().split('T')[0];
  const dueDate = invoice.due_date || 'Due on Receipt';
  doc.text(`Date: ${issueDate}`, pageWidth - margin, 37, { align: 'right' });
  doc.text(`Due Date: ${dueDate}`, pageWidth - margin, 42, { align: 'right' });
  doc.text(`Status: ${(invoice.status || 'draft').toUpperCase()}`, pageWidth - margin, 47, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 54, pageWidth - margin, 54);

  // Bill To box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 58, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('BILLED TO', margin + 4, 64);

  const clientName = invoice.client?.name || 'Valued Client';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, margin + 4, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const clientInfo = [
    invoice.client?.company,
    invoice.client?.email,
    invoice.client?.phone,
  ].filter(Boolean).join(' | ');
  if (clientInfo) {
    doc.text(clientInfo, margin + 4, 76);
  }

  // Items Table Header
  const tableStartY = 88;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, tableStartY, contentWidth, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DESCRIPTION', margin + 4, tableStartY + 5.5);
  doc.text('QTY', margin + 110, tableStartY + 5.5, { align: 'center' });
  doc.text(`RATE (${curr})`, margin + 140, tableStartY + 5.5, { align: 'right' });
  doc.text(`AMOUNT (${curr})`, pageWidth - margin - 4, tableStartY + 5.5, { align: 'right' });

  // Items rows
  let rowY = tableStartY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const items = invoice.items || [];
  if (items.length === 0) {
    doc.setTextColor(148, 163, 184);
    doc.text('Invoice Services / Products', margin + 4, rowY + 6);
    doc.text('1', margin + 110, rowY + 6, { align: 'center' });
    doc.text(formatAmount(invoice.subtotal || invoice.total), margin + 140, rowY + 6, { align: 'right' });
    doc.text(formatAmount(invoice.total), pageWidth - margin - 4, rowY + 6, { align: 'right' });
    rowY += 10;
  } else {
    items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY, contentWidth, 8, 'F');
      }
      doc.setTextColor(30, 41, 59);
      const desc = item.description || `Item #${idx + 1}`;
      doc.text(desc.length > 55 ? desc.substring(0, 52) + '...' : desc, margin + 4, rowY + 5.5);
      doc.text(String(item.quantity || 1), margin + 110, rowY + 5.5, { align: 'center' });
      doc.text(formatAmount(item.unit_price), margin + 140, rowY + 5.5, { align: 'right' });
      doc.text(formatAmount(item.amount), pageWidth - margin - 4, rowY + 5.5, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, rowY + 8, pageWidth - margin, rowY + 8);
      rowY += 8;
    });
  }

  // Summary / Totals block
  rowY += 6;
  const totalsX = pageWidth - margin - 75;
  const totalsValX = pageWidth - margin - 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  doc.text('Subtotal:', totalsX, rowY);
  doc.text(`${curr} ${formatAmount(invoice.subtotal || invoice.total)}`, totalsValX, rowY, { align: 'right' });
  rowY += 6;

  if (Number(invoice.discount) > 0) {
    doc.text('Discount:', totalsX, rowY);
    doc.text(`-${curr} ${formatAmount(invoice.discount)}`, totalsValX, rowY, { align: 'right' });
    rowY += 6;
  }

  if (Number(invoice.tax_amount) > 0 || Number(invoice.tax_rate) > 0) {
    const rateText = Number(invoice.tax_rate) > 0 ? ` (${invoice.tax_rate}%)` : '';
    doc.text(`Tax${rateText}:`, totalsX, rowY);
    doc.text(`${curr} ${formatAmount(invoice.tax_amount)}`, totalsValX, rowY, { align: 'right' });
    rowY += 6;
  }

  // Total Paid / Due box
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(totalsX - 4, rowY, 79, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT:', totalsX, rowY + 6.5);
  doc.text(`${curr} ${formatAmount(invoice.total)}`, totalsValX, rowY + 6.5, { align: 'right' });

  // Notes & Payment instructions
  rowY += 18;
  if (invoice.notes || business?.bank_details || invoice.terms) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('PAYMENT DETAILS & NOTES', margin, rowY);
    rowY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    if (business?.bank_details) {
      doc.text(`Bank / Wire Info: ${business.bank_details}`, margin, rowY);
      rowY += 5;
    }
    if (invoice.notes) {
      doc.text(`Note: ${invoice.notes}`, margin, rowY);
      rowY += 5;
    }
    if (invoice.terms) {
      doc.text(`Terms: ${invoice.terms}`, margin, rowY);
      rowY += 5;
    }
  }

  // Footer banner
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated securely via InvoiceFlow AI — Thank you for your business!', pageWidth / 2, 285, { align: 'center' });

  return doc;
}

/**
 * Generates a clean, professional vector A4 PDF for a Receipt using jsPDF directly.
 */
export function generateDirectReceiptPdf(receipt: Receipt, business?: Business): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const curr = formatCurrencyCode(receipt.currency);

  // Top header banner (Emerald/Green for payment receipt)
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, pageWidth, 8, 'F');

  // Business Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  const bizName = business?.name || 'InvoiceFlow Business';
  doc.text(bizName, margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  let bizY = 30;
  if (business?.email) {
    doc.text(business.email, margin, bizY);
    bizY += 5;
  }
  if (business?.phone) {
    doc.text(business.phone, margin, bizY);
    bizY += 5;
  }
  if (business?.address) {
    const fullAddr = `${business.address}${business.city ? ', ' + business.city : ''}${business.country ? ' ' + business.country : ''}`;
    doc.text(fullAddr, margin, bizY);
    bizY += 5;
  }

  // Receipt Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text('PAYMENT RECEIPT', pageWidth - margin, 24, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(`Receipt #: ${receipt.receipt_number || 'REC-1001'}`, pageWidth - margin, 32, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const paymentDate = receipt.payment_date
    ? new Date(receipt.payment_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date().toLocaleDateString();
  doc.text(`Payment Date: ${paymentDate}`, pageWidth - margin, 37, { align: 'right' });
  if (receipt.invoice_number) {
    doc.text(`Invoice Ref: #${receipt.invoice_number}`, pageWidth - margin, 42, { align: 'right' });
  }
  doc.text(`Status: PAID IN FULL`, pageWidth - margin, 47, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 54, pageWidth - margin, 54);

  // Received From Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 58, contentWidth, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('RECEIVED FROM', margin + 4, 64);

  const clientName = receipt.client?.name || 'Valued Client';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(clientName, margin + 4, 70);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const clientInfo = [
    receipt.client?.company,
    receipt.client?.email,
    receipt.payment_method ? `Method: ${receipt.payment_method}` : null,
  ].filter(Boolean).join(' | ');
  if (clientInfo) {
    doc.text(clientInfo, margin + 4, 76);
  }

  // Items Table Header if items exist
  let rowY = 88;
  const items = receipt.items || [];
  if (items.length > 0) {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, rowY, contentWidth, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('SERVICES / ITEMS SETTLED', margin + 4, rowY + 5.5);
    doc.text('QTY', margin + 110, rowY + 5.5, { align: 'center' });
    doc.text(`RATE (${curr})`, margin + 140, rowY + 5.5, { align: 'right' });
    doc.text(`AMOUNT (${curr})`, pageWidth - margin - 4, rowY + 5.5, { align: 'right' });

    rowY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    items.forEach((item, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, rowY, contentWidth, 8, 'F');
      }
      doc.setTextColor(30, 41, 59);
      const desc = item.description || `Item #${idx + 1}`;
      doc.text(desc.length > 55 ? desc.substring(0, 52) + '...' : desc, margin + 4, rowY + 5.5);
      doc.text(String(item.quantity || 1), margin + 110, rowY + 5.5, { align: 'center' });
      doc.text(formatAmount(item.unit_price), margin + 140, rowY + 5.5, { align: 'right' });
      doc.text(formatAmount(item.amount), pageWidth - margin - 4, rowY + 5.5, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, rowY + 8, pageWidth - margin, rowY + 8);
      rowY += 8;
    });
    rowY += 6;
  }

  // Big Total Paid Confirmation Box
  doc.setFillColor(236, 253, 245); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(margin, rowY, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70); // Emerald 800
  doc.text('TOTAL AMOUNT RECEIVED & VERIFIED', margin + 6, rowY + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87); // Emerald 700
  doc.text(`Payment received via ${receipt.payment_method || 'Electronic Transfer'}`, margin + 6, rowY + 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105); // Emerald 600
  doc.text(`${curr} ${formatAmount(receipt.amount)}`, pageWidth - margin - 6, rowY + 14, { align: 'right' });

  rowY += 28;
  if (receipt.notes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('NOTES', margin, rowY);
    rowY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(receipt.notes, margin, rowY);
  }

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Official Payment Receipt • Verified via InvoiceFlow AI • Thank you!', pageWidth / 2, 285, { align: 'center' });

  return doc;
}

/**
 * High-performance, resilient PDF renderer for Invoices.
 * Tries high-DPI HTML canvas rendering first, and falls back to vector jsPDF generation if necessary.
 */
export async function downloadInvoicePdf(
  input: string | Invoice,
  businessOrFilename?: Business | string,
  customFilename?: string
): Promise<boolean> {
  try {
    let filename = 'InvoiceFlow-Invoice.pdf';
    let invoiceObj: Invoice | null = null;
    let businessObj: Business | undefined = undefined;

    if (typeof input === 'object' && input !== null) {
      invoiceObj = input;
      if (typeof businessOrFilename === 'object') {
        businessObj = businessOrFilename;
      }
      filename = customFilename || (typeof businessOrFilename === 'string' ? businessOrFilename : `InvoiceFlow-Invoice-${invoiceObj.number || 'INV'}.pdf`);
    } else if (typeof input === 'string') {
      filename = typeof businessOrFilename === 'string' ? businessOrFilename : 'InvoiceFlow-Invoice.pdf';
      if (!filename.startsWith('InvoiceFlow-')) {
        filename = `InvoiceFlow-${filename}`;
      }
    }

    // Try DOM capture first if element exists
    const elementId = typeof input === 'string' ? input : 'printable-invoice-element';
    const element = document.getElementById(elementId);

    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          onclone: (clonedDoc, clonedElement) => {
            // Convert oklch in styles
            const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
            styleElements.forEach((styleEl) => {
              if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
                styleEl.textContent = convertOklchToRgb(styleEl.textContent);
              }
            });

            const elementsWithInlineStyle = Array.from(clonedDoc.querySelectorAll('[style*="oklch"]'));
            elementsWithInlineStyle.forEach((el) => {
              const styleAttr = el.getAttribute('style');
              if (styleAttr) {
                el.setAttribute('style', convertOklchToRgb(styleAttr));
              }
            });

            // Force clean white background and crisp styling on printable element
            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#0f172a';
          },
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        const blob = pdf.output('blob');
        triggerBlobDownload(blob, filename);
        return true;
      } catch (domCaptureErr) {
        console.warn('DOM canvas capture failed, falling back to direct vector PDF generator:', domCaptureErr);
      }
    }

    // Direct Vector PDF Fallback
    if (invoiceObj) {
      const doc = generateDirectInvoicePdf(invoiceObj, businessObj);
      const blob = doc.output('blob');
      triggerBlobDownload(blob, filename);
      return true;
    }

    console.warn('No DOM element or invoice data object available to render PDF');
    return false;
  } catch (error: any) {
    console.error('Invoice PDF download generation exception:', error);
    return false;
  }
}

/**
 * High-performance, resilient PDF renderer for Receipts.
 * Accepts either (elementId, filename), (receipt, business), or (receipt, business, filename).
 */
export async function downloadReceiptPdf(
  input: string | Receipt,
  businessOrFilename?: Business | string,
  customFilename?: string
): Promise<boolean> {
  try {
    let filename = 'InvoiceFlow-Receipt.pdf';
    let receiptObj: Receipt | null = null;
    let businessObj: Business | undefined = undefined;

    if (typeof input === 'object' && input !== null) {
      receiptObj = input;
      if (typeof businessOrFilename === 'object') {
        businessObj = businessOrFilename;
      }
      filename = customFilename || (typeof businessOrFilename === 'string' ? businessOrFilename : `InvoiceFlow-Receipt-${receiptObj.receipt_number || 'REC'}.pdf`);
    } else if (typeof input === 'string') {
      filename = typeof businessOrFilename === 'string' ? businessOrFilename : 'InvoiceFlow-Receipt.pdf';
      if (!filename.startsWith('InvoiceFlow-')) {
        filename = `InvoiceFlow-${filename}`;
      }
    }

    // Try DOM capture if element exists
    const elementId = typeof input === 'string' ? input : (receiptObj ? `receipt-printable-${receiptObj.id}` : 'receipt-printable-element');
    const element = document.getElementById(elementId);

    if (element) {
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1200,
          onclone: (clonedDoc, clonedElement) => {
            const styleElements = Array.from(clonedDoc.querySelectorAll('style'));
            styleElements.forEach((styleEl) => {
              if (styleEl.textContent && styleEl.textContent.includes('oklch')) {
                styleEl.textContent = convertOklchToRgb(styleEl.textContent);
              }
            });

            const elementsWithInlineStyle = Array.from(clonedDoc.querySelectorAll('[style*="oklch"]'));
            elementsWithInlineStyle.forEach((el) => {
              const styleAttr = el.getAttribute('style');
              if (styleAttr) {
                el.setAttribute('style', convertOklchToRgb(styleAttr));
              }
            });

            clonedElement.style.backgroundColor = '#ffffff';
            clonedElement.style.color = '#0f172a';
          },
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
          heightLeft -= pdfHeight;
        }

        const blob = pdf.output('blob');
        triggerBlobDownload(blob, filename);
        return true;
      } catch (domCaptureErr) {
        console.warn('Receipt DOM canvas capture failed, falling back to direct vector PDF generator:', domCaptureErr);
      }
    }

    // Direct Vector PDF Fallback
    if (receiptObj) {
      const doc = generateDirectReceiptPdf(receiptObj, businessObj);
      const blob = doc.output('blob');
      triggerBlobDownload(blob, filename);
      return true;
    }

    console.warn('No DOM element or receipt data object available to render receipt PDF');
    return false;
  } catch (error: any) {
    console.error('Receipt PDF download generation exception:', error);
    return false;
  }
}
