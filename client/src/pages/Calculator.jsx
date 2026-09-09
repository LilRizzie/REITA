import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { motion } from 'framer-motion';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { getInvestmentProperties, getProperties, saveAnalysis, saveReport } from '../utils/propertyStorage';
import { printReportDocument } from '../utils/reportDocument';

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const fmtNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function Calculator() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const isInvestor = (user?.role || profile?.investorType) === 'Investor';
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [result, setResult] = useState(null);
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    const propertyRequest = isInvestor
      ? getInvestmentProperties()
      : getProperties(user.uid, user.role);

    propertyRequest
      .then((saved) => {
        if (!active) return;
        setProperties(saved);

        const preselected = location.state?.propertyId;
        if (preselected) {
          const match = saved.find((item) => String(item.id) === String(preselected));
          if (match) {
            setSelectedPropertyId(match.id);
          }
        }
      })
      .catch(() => {
        if (active) toast.error('Unable to load properties.');
      });

    return () => { active = false; };
  }, [user?.uid, user?.role, isInvestor, location.state?.propertyId]);

  const selectedProperty = useMemo(() => properties.find((item) => String(item.id) === String(selectedPropertyId)) || null, [properties, selectedPropertyId]);

  function handlePropertySelect(e) {
    const id = e.target.value;
    setSelectedPropertyId(id);
    setResult(null);
    setRecommendation('');
  }

  function analyze() {
    const purchasePrice = Number(selectedProperty?.purchasePrice || 0);
    const currentValue = Number(selectedProperty?.currentValue || 0);
    const rentalIncome = Number(selectedProperty?.expectedRentalIncome || selectedProperty?.annualRentalIncome || selectedProperty?.annualRent || 0);
    const expenses = Number(selectedProperty?.annualExpenses || 0);
    const loanAmount = Number(selectedProperty?.loanAmount || selectedProperty?.mortgage || 0);
    const interestRate = Number(selectedProperty?.interestRate || 0);
    const loanYears = Number(selectedProperty?.loanYears || 0);

    if (!selectedPropertyId || !selectedProperty || !purchasePrice || !currentValue) {
      toast.error('Select an available property with complete valuation details.');
      return;
    }

    const netAnnualIncome = rentalIncome - expenses;
    const cashInvested = purchasePrice - loanAmount;
    const profit = currentValue - purchasePrice;
    const roi = cashInvested === 0 ? 0 : (netAnnualIncome / cashInvested) * 100;
    const capitalGainPct = purchasePrice === 0 ? 0 : (profit / purchasePrice) * 100;
    const monthlyCashflow = netAnnualIncome / 12;
    const payback = netAnnualIncome === 0 ? 0 : cashInvested / netAnnualIncome;
    const monthlyDebtService = loanAmount && interestRate && loanYears ? (loanAmount * (interestRate / 100) / 12) / (1 - (1 + interestRate / 100 / 12) ** (-loanYears * 12)) : 0;
    const capRate = currentValue ? netAnnualIncome / currentValue * 100 : 0;
    const rentalYield = purchasePrice ? rentalIncome / purchasePrice * 100 : 0;
    const cashOnCash = cashInvested ? (netAnnualIncome - monthlyDebtService * 12) / cashInvested * 100 : 0;

    let recommendationText = 'High Risk';
    let recommendationTone = 'danger';

    if (roi > 15) {
      recommendationText = 'Excellent Investment';
      recommendationTone = 'success';
    } else if (roi >= 10) {
      recommendationText = 'Good Investment';
      recommendationTone = 'info';
    } else if (roi >= 5) {
      recommendationText = 'Average';
      recommendationTone = 'warning';
    }

    const reasons = [];
    if (expenses > rentalIncome * 0.35) reasons.push('Annual expenses are high relative to rental income.');
    if (loanAmount > purchasePrice * 0.6) reasons.push('The loan amount is large relative to the purchase price.');
    if (netAnnualIncome < 0) reasons.push('The property is producing negative cash flow.');

    setResult({
      netAnnualIncome,
      cashInvested,
      roi,
      profit,
      capitalGainPct,
      monthlyCashflow,
      payback,
      monthlyDebtService, capRate, rentalYield, cashOnCash, monthlyProfit: monthlyCashflow - monthlyDebtService, investmentScore: Math.max(0, Math.min(100, Math.round(roi * 5))), risk: roi >= 10 && netAnnualIncome > 0 ? 'Low' : roi >= 5 ? 'Medium' : 'High',
    });
    setRecommendation({
      text: recommendationText,
      tone: recommendationTone,
      reasons: reasons.length ? reasons : ['The deal is balanced and the cash flow remains healthy.'],
    });
    saveAnalysis(user.uid, { propertyId: selectedPropertyId, propertyName: selectedProperty?.propertyName, summary: { netProfit: profit, annualCashFlow: netAnnualIncome, roi, capRate, rentalYield, cashOnCash, breakEvenYears: payback, monthlyProfit: monthlyCashflow - monthlyDebtService }, recommendation: recommendationText });
    toast.success('Analysis saved.');
  }

  function generateReport() {
    if (!result || !user?.uid) {
      toast.error('Analyze the property first to create a report.');
      return;
    }

    const report = {
      id: `${Date.now()}`,
      propertyName: selectedProperty?.propertyName || 'Selected Property',
      propertyType: selectedProperty?.propertyType || 'N/A',
      location: selectedProperty?.location || selectedProperty?.city || selectedProperty?.state || 'N/A',
      analysisDate: new Date().toLocaleDateString(),
      summary: result,
      recommendation,
      userName: profile?.fullName || 'Investor',
      generatedBy: profile?.fullName || 'Investor',
      generatedByEmail: profile?.email || '',
      createdAt: Date.now(),
    };

    saveReport(user.uid, report);
    printReportDocument(report);
    toast.success('Report generated successfully.');
  }

  return (
    <ProtectedLayout title="Investment Calculator" subtitle="Analyze your portfolio and generate professional reports.">
      <div className="calculator-shell">
        <div className="glass-card calculator-form-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Investment Details</p>
              <h4>Select a property and analyze</h4>
            </div>
          </div>

          <div className="field-stack calculator-field-stack">
            <label>
              <span>Available Property</span>
              <select className="calculator-property-select" value={selectedPropertyId} onChange={handlePropertySelect}>
                <option value="">Choose an available property</option>
                {properties.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.propertyName} — {item.city || item.state || ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="button-row calculator-button-row">
            <button className="btn btn-primary" type="button" onClick={analyze}>Analyze Investment</button>
            <button className="btn btn-secondary" type="button" onClick={generateReport}>Generate Report</button>
          </div>
        </div>

        <div className="glass-card calculator-results-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Results</p>
              <h4>Investment Analysis</h4>
            </div>
          </div>

          {result ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="gauge-row">
                <div className="gauge-card">
                  <strong>{result.roi.toFixed(2)}%</strong>
                  <span>ROI</span>
                </div>
                <div className="gauge-card">
                  <strong>{result.investmentScore}/100</strong>
                  <span>Investment Score</span>
                </div>
                <div className="gauge-card">
                  <strong>{result.risk}</strong>
                  <span>Risk Level</span>
                </div>
              </div>

              <div className="insight-list">
                <div>Net Annual Income<strong>{fmtNaira(result.netAnnualIncome)}</strong></div>
                <div>Cash Invested<strong>{fmtNaira(result.cashInvested)}</strong></div>
                <div>ROI<strong>{result.roi.toFixed(2)}%</strong></div>
                <div>Profit<strong>{fmtNaira(result.profit)}</strong></div>
                <div>Capital Gain %<strong>{result.capitalGainPct.toFixed(2)}%</strong></div>
                <div>Estimated Monthly Cashflow<strong>{fmtNaira(result.monthlyCashflow.toFixed(2))}</strong></div>
                <div>Simple Payback Period<strong>{result.payback.toFixed(1)} years</strong></div>
                <div>Cap Rate<strong>{result.capRate.toFixed(2)}%</strong></div>
                <div>Rental Yield<strong>{result.rentalYield.toFixed(2)}%</strong></div>
                <div>Cash on Cash Return<strong>{result.cashOnCash.toFixed(2)}%</strong></div>
                <div>Monthly Profit<strong>{fmtNaira(result.monthlyProfit.toFixed(2))}</strong></div>
                <div>Investment Score<strong>{result.investmentScore}/100 · {result.risk} risk</strong></div>
              </div>

              <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
                <p className="eyebrow">Recommendation</p>
                <h4 style={{ color: '#fff', marginTop: 0 }}>{recommendation?.text}</h4>
                <ul style={{ color: '#e7dbc1', paddingLeft: '1rem' }}>
                  {recommendation?.reasons.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="glass-card" style={{ padding: 16, marginTop: 16 }}>
                <p className="eyebrow">Performance chart</p>
                <Bar data={{ labels: ['ROI', 'Cap Rate', 'Rental Yield', 'Cash Return'], datasets: [{ label: 'Percent', data: [result.roi, result.capRate, result.rentalYield, result.cashOnCash], backgroundColor: ['#d4af37', '#f7e8b3', '#a98d5b', '#856404'] }] }} options={{ responsive: true, plugins: { legend: { labels: { color: '#e7dbc1' } } }, scales: { x: { ticks: { color: '#e7dbc1' } }, y: { ticks: { color: '#e7dbc1' } } } }} />
              </div>
            </motion.div>
          ) : (
            <p>Select an available property and click Analyze Investment to see the metrics.</p>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}