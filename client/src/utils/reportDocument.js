import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const formatNumber = (value) => Number(value || 0).toLocaleString();
const formatDate = (report) => report.analysisDate || (report.createdAt ? new Date(report.createdAt).toLocaleDateString() : new Date().toLocaleDateString());
const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const getReportRows = (report) => {
  const summary = report.summary || {};
  return {
    property: [
      ['Property Name', report.propertyName || 'N/A'],
      ['Property Type', report.propertyType || 'N/A'],
      ['Location', report.location || 'N/A'],
      ['Cash Invested', `₦${formatNumber(summary.cashInvested ?? summary.purchasePrice)}`],
      ['Net Annual Income', `₦${formatNumber(summary.netAnnualIncome ?? summary.annualCashFlow)}`],
      ['Annual Cash Flow', `₦${formatNumber(summary.annualCashFlow ?? summary.netAnnualIncome)}`],
      ['Capital Gain', `${Number(summary.capitalGainPct ?? summary.capRate ?? 0).toFixed(2)}%`],
    ],
    analysis: [
      ['ROI', `${Number(summary.roi || 0).toFixed(2)}%`],
      ['Net Profit', `₦${formatNumber(summary.netProfit ?? summary.profit)}`],
      ['Rental Yield', `${Number(summary.rentalYield || 0).toFixed(2)}%`],
      ['Break-even Period', `${Number(summary.breakEvenYears ?? summary.payback ?? 0).toFixed(1)} years`],
      ['Capital Gain', `${Number(summary.capitalGainPct ?? summary.capRate ?? 0).toFixed(2)}%`],
      ['Risk Level', summary.risk || report.recommendation?.text || 'N/A'],
    ],
  };
};

const recommendationText = (report) => typeof report.recommendation === 'string'
  ? report.recommendation
  : report.recommendation?.text || 'N/A';

export function downloadReportPdf(report) {
  const pdf = new jsPDF();
  const summary = report.summary || {};
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(5, 5, 5);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  pdf.setFillColor(212, 175, 55);
  pdf.rect(0, 40, pageWidth, 2, 'F');

  pdf.setTextColor(212, 175, 55);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REITA', pageWidth / 2, 20, { align: 'center' });

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.text('REAL ESTATE INVESTMENT ANALYSIS REPORT', pageWidth / 2, 30, { align: 'center' });

  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(10);
  pdf.text(`Date: ${formatDate(report)}`, 14, 52);
  pdf.text(`Investor: ${report.generatedBy || report.userName || 'Investor'}`, 14, 58);
  if (report.generatedByEmail) pdf.text(`Email: ${report.generatedByEmail}`, 14, 64);

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 175, 55);
  pdf.text('PROPERTY INFORMATION', 14, 78);

  autoTable(pdf, {
    startY: 82,
    head: [['Field', 'Value']],
    body: [
      ['Property Name', report.propertyName || 'N/A'],
      ['Property Type', report.propertyType || 'N/A'],
      ['Location', report.location || 'N/A'],
      ['Cash Invested', `₦${formatNumber(summary.cashInvested ?? summary.purchasePrice)}`],
      ['Net Annual Income', `₦${formatNumber(summary.netAnnualIncome ?? summary.annualCashFlow)}`],
      ['Annual Cash Flow', `₦${formatNumber(summary.annualCashFlow ?? summary.netAnnualIncome)}`],
      ['Capital Gain', `${Number(summary.capitalGainPct ?? summary.capRate ?? 0).toFixed(2)}%`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [212, 175, 55], textColor: [17, 17, 17], fontStyle: 'bold' },
    bodyStyles: { textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 240, 225] },
    margin: { left: 14, right: 14 },
  });

  const analysisY = pdf.lastAutoTable.finalY + 12;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 175, 55);
  pdf.text('INVESTMENT ANALYSIS', 14, analysisY);

  autoTable(pdf, {
    startY: analysisY + 4,
    head: [['Metric', 'Value']],
    body: [
      ['ROI', `${Number(summary.roi || 0).toFixed(2)}%`],
      ['Net Profit', `₦${formatNumber(summary.netProfit ?? summary.profit)}`],
      ['Rental Yield', `${Number(summary.rentalYield || 0).toFixed(2)}%`],
      ['Break-even Period', `${Number(summary.breakEvenYears ?? summary.payback ?? 0).toFixed(1)} years`],
      ['Capital Gain', `${Number(summary.capitalGainPct ?? summary.capRate ?? 0).toFixed(2)}%`],
      ['Risk Level', summary.risk || report.recommendation?.text || 'N/A'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [212, 175, 55], textColor: [17, 17, 17], fontStyle: 'bold' },
    bodyStyles: { textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 240, 225] },
    margin: { left: 14, right: 14 },
  });

  const recY = pdf.lastAutoTable.finalY + 12;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(212, 175, 55);
  pdf.text('OVERALL RECOMMENDATION', 14, recY);

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 30, 30);
  const recommendationText = typeof report.recommendation === 'string'
    ? report.recommendation
    : report.recommendation?.text || 'N/A';
  const recommendationLines = pdf.splitTextToSize(recommendationText, pageWidth - 28);
  pdf.text(recommendationLines, 14, recY + 6);

  const footerY = pdf.internal.pageSize.getHeight() - 20;
  pdf.setFillColor(5, 5, 5);
  pdf.rect(0, footerY - 5, pageWidth, 25, 'F');
  pdf.setTextColor(212, 175, 55);
  pdf.setFontSize(9);
  pdf.text('REITA | Generated report', pageWidth / 2, footerY + 8, { align: 'center' });

  const safeName = String(report.propertyName || 'property').replace(/[^a-z0-9]/gi, '-').toLowerCase();
  pdf.save(`${safeName}_Report.pdf`);
}

export function printReportDocument(report) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) throw new Error('Allow pop-ups to print the report.');

  const rows = getReportRows(report);
  const table = (items) => items.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join('');
  const generatedBy = report.generatedBy || report.userName || 'Investor';
  const email = report.generatedByEmail ? `<p>Email: ${escapeHtml(report.generatedByEmail)}</p>` : '';

  printWindow.document.write(`<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(report.propertyName || 'REITA Report')}</title>
        <style>
          @page { size: A4; margin: 18mm 16mm; }
          :root { color-scheme: light; font-family: Georgia, 'Times New Roman', serif; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #25231f; background: #fff; font-family: Arial, sans-serif; }
          .report { max-width: 780px; margin: 0 auto; }
          .masthead { padding: 24px 0 18px; border-bottom: 3px solid #d4af37; text-align: center; }
          .brand { margin: 0; color: #b18f25; font: 700 30px Georgia, serif; letter-spacing: .14em; }
          .subtitle { margin: 8px 0 0; color: #5d574b; font-size: 11px; letter-spacing: .16em; }
          .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; padding: 20px 0 8px; color: #5d574b; font-size: 11px; }
          .meta p { margin: 0; }
          section { margin-top: 22px; break-inside: avoid; }
          h1 { margin: 0 0 6px; font: 400 25px Georgia, serif; color: #25231f; }
          h2 { margin: 0 0 9px; padding-bottom: 7px; border-bottom: 1px solid #d8c98f; color: #9b7a1f; font: 700 13px Arial, sans-serif; letter-spacing: .1em; }
          table { width: 100%; border-collapse: collapse; font-size: 11px; }
          th, td { padding: 8px 10px; border-bottom: 1px solid #e7e2d5; text-align: left; }
          th { width: 42%; color: #5d574b; font-weight: 600; }
          td { color: #25231f; }
          .recommendation { padding: 14px; border-left: 3px solid #d4af37; background: #f7f3e7; line-height: 1.6; font-size: 12px; }
          footer { margin-top: 34px; padding-top: 10px; border-top: 1px solid #d8c98f; color: #716b5e; font-size: 10px; text-align: center; }
          @media print { .report { max-width: none; } }
        </style>
      </head>
      <body>
        <main class="report">
          <header class="masthead"><p class="brand">REITA</p><p class="subtitle">REAL ESTATE INVESTMENT ANALYSIS REPORT</p></header>
          <div class="meta"><p>Generated: ${escapeHtml(formatDate(report))}</p><p>Investor: ${escapeHtml(generatedBy)}</p>${email}</div>
          <section><h1>${escapeHtml(report.propertyName || 'Investment Report')}</h1><h2>PROPERTY INFORMATION</h2><table><tbody>${table(rows.property)}</tbody></table></section>
          <section><h2>FINANCIAL OVERVIEW</h2><table><tbody>${table(rows.analysis)}</tbody></table></section>
          <section><h2>ANALYSIS</h2><div class="recommendation">${escapeHtml(recommendationText(report))}</div></section>
          <footer>REITA | Generated report</footer>
        </main>
      </body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.addEventListener('load', () => {
    printWindow.print();
  }, { once: true });
}
