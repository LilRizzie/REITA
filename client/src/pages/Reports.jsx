import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmContext';
import { deleteReport, getAllReports, getReports } from '../utils/propertyStorage';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { user, profile } = useAuth();
  const confirm = useConfirm();
  const isAdmin = user?.role === 'Administrator' || profile?.investorType === 'Administrator';
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (!user?.uid) return;
    setReports(isAdmin ? getAllReports() : getReports(user.uid));
  }, [user?.uid, isAdmin]);

  async function handleDelete(id) {
    const confirmed = await confirm('Delete this report? This action cannot be undone.', {
      title: 'Delete Report',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!confirmed) return;
    deleteReport(user.uid, id);
    setReports(isAdmin ? getAllReports() : getReports(user.uid));
    toast.success('Report deleted.');
  }

  function handleDownload(report) {
    const pdf = new jsPDF();
    const summary = report.summary || {};
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
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

    // Date and user info
    pdf.setTextColor(20, 20, 20);
    pdf.setFontSize(10);
    pdf.text(`Date: ${report.analysisDate || new Date(report.createdAt).toLocaleDateString()}`, 14, 52);
    pdf.text(`Investor: ${report.generatedBy || report.userName || 'Investor'}`, 14, 58);
    pdf.text(`Email: ${report.generatedByEmail || ''}`, 14, 64);

    // Property Information
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
        ['Purchase Price', `₦${Number(summary.cashInvested || 0).toLocaleString()}`],
        ['Current Value', `₦${Number(summary.netAnnualIncome || 0).toLocaleString()}`],
        ['Annual Rent', `₦${Number(summary.annualCashFlow || 0).toLocaleString()}`],
        ['Annual Expenses', `₦${Number(summary.netAnnualIncome || 0).toLocaleString()}`],
        ['Expected Appreciation', `${Number(summary.capRate || 0).toFixed(2)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [17, 17, 17], fontStyle: 'bold' },
      bodyStyles: { textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 240, 225] },
      margin: { left: 14, right: 14 },
    });

    // Investment Analysis
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
        ['Net Profit', `₦${Number(summary.netProfit || 0).toLocaleString()}`],
        ['Rental Yield', `${Number(summary.rentalYield || 0).toFixed(2)}%`],
        ['Break-even Period', `${Number(summary.breakEvenYears || 0).toFixed(1)} years`],
        ['Capital Gain', `${Number(summary.capRate || 0).toFixed(2)}%`],
        ['Risk Level', report.recommendation?.text || 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [212, 175, 55], textColor: [17, 17, 17], fontStyle: 'bold' },
      bodyStyles: { textColor: [30, 30, 30] },
      alternateRowStyles: { fillColor: [245, 240, 225] },
      margin: { left: 14, right: 14 },
    });

    // Recommendation
    const recY = pdf.lastAutoTable.finalY + 12;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(212, 175, 55);
    pdf.text('OVERALL RECOMMENDATION', 14, recY);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 30, 30);
    const recText = report.recommendation?.text || 'N/A';
    const recLines = pdf.splitTextToSize(recText, pageWidth - 28);
    pdf.text(recLines, 14, recY + 6);

    // Footer
    const footerY = pdf.internal.pageSize.getHeight() - 20;
    pdf.setFillColor(5, 5, 5);
    pdf.rect(0, footerY - 5, pageWidth, 25, 'F');
    pdf.setTextColor(212, 175, 55);
    pdf.setFontSize(9);
    pdf.text('Generated by REITA', pageWidth / 2, footerY + 8, { align: 'center' });

    const safeName = String(report.propertyName || 'property').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    pdf.save(`${safeName}_Report.pdf`);
    toast.success('PDF downloaded.');
  }

  return (
    <ProtectedLayout title="Reports" subtitle="View, download, and manage your generated investment analyses.">
      <div className="reports-shell">
        <div className="glass-card report-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Analytics</p>
              <h4>Generated analyses</h4>
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h4>No reports generated yet</h4>
              <p>Analyze a property in the calculator to generate your first report.</p>
            </div>
          ) : (
            <div className="table-shell">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Date</th>
                    <th>Generated By</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>{report.propertyName}</td>
                      <td>{report.analysisDate || new Date(report.createdAt).toLocaleDateString()}</td>
                      <td>{report.generatedBy || report.userName || 'Investor'}</td>
                      <td>
                        <button className="table-action download-btn" onClick={() => handleDownload(report)}>⬇ Download PDF</button>
                        <button className="table-action" onClick={() => handleDelete(report.id)}>Delete Report</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}