import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { motion } from 'framer-motion';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { getProperties, saveAnalysis, saveReport } from '../utils/propertyStorage';

const emptyForm = {
  purchasePrice: '',
  currentValue: '',
  annualRentalIncome: '',
  annualExpenses: '',
  loanAmount: '',
  interestRate: '',
  loanYears: '',
};
ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const fmtNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function Calculator() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [result, setResult] = useState(null);
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    let active = true;

    // Properties now come from the MongoDB-backed API.
    getProperties(user.uid)
      .then((saved) => {
        if (!active) return;
        setProperties(saved);

        const preselected = location.state?.propertyId;
        if (preselected) {
          const match = saved.find((item) => String(item.id) === String(preselected));
          if (match) {
            setSelectedPropertyId(match.id);
            setForm({
              purchasePrice: match.purchasePrice,
              currentValue: match.currentValue,
              annualRentalIncome: match.annualRent || match.annualRentalIncome || Number(match.monthlyRent || 0) * 12,
              annualExpenses: match.annualExpenses,
              loanAmount: match.loanAmount || match.mortgage || 0,
              interestRate: match.interestRate || 0,
              loanYears: match.loanYears || 0,
            });
          }
        }
      })
      .catch(() => {
        if (active) toast.error('Unable to load properties.');
      });

    return () => { active = false; };
  }, [user?.uid, location.state?.propertyId]);

  const selectedProperty = useMemo(() => properties.find((item) => String(item.id) === String(selectedPropertyId)) || null, [properties, selectedPropertyId]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handlePropertySelect(e) {
    const id = e.target.value;
    setSelectedPropertyId(id);
    const match = properties.find((item) => String(item.id) === String(id));

    if (match) {
      setForm({
        purchasePrice: match.purchasePrice,
        currentValue: match.currentValue,
        annualRentalIncome: match.annualRent || match.annualRentalIncome || Number(match.monthlyRent || 0) * 12,
        annualExpenses: match.annualExpenses,
        loanAmount: match.loanAmount || match.mortgage || 0,
        interestRate: match.interestRate || 0,
        loanYears: match.loanYears || 0,
      });
    }
  }

  function analyze() {
    const purchasePrice = Number(form.purchasePrice);
    const currentValue = Number(form.currentValue);
    const rentalIncome = Number(form.annualRentalIncome);
    const expenses = Number(form.annualExpenses);
    const loanAmount = Number(form.loanAmount);
    const interestRate = Number(form.interestRate);
    const loanYears = Number(form.loanYears);

    if (!selectedPropertyId || !purchasePrice || !currentValue) {
      toast.error('Select a property and provide purchase and current values.');
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
    toast.success('Report generated successfully.');
    window.print();
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

          <div className="field-stack">
            <label>
              <span>Select Property</span>
              <select value={selectedPropertyId} onChange={handlePropertySelect}>
                <option value="">Choose one of your properties</option>
                {properties.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.propertyName} — {item.city || item.state || ''}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Purchase Price (₦)</span>
              <input type="number" name="purchasePrice" value={form.purchasePrice} onChange={handleChange} />
            </label>

            <label>
              <span>Current Value (₦)</span>
              <input type="number" name="currentValue" value={form.currentValue} onChange={handleChange} />
            </label>

            <label>
              <span>Annual Rental Income (₦)</span>
              <input type="number" name="annualRentalIncome" value={form.annualRentalIncome} onChange={handleChange} />
            </label>

            <label>
              <span>Annual Expenses (₦)</span>
              <input type="number" name="annualExpenses" value={form.annualExpenses} onChange={handleChange} />
            </label>

            <label>
              <span>Loan Amount (₦)</span>
              <input type="number" name="loanAmount" value={form.loanAmount} onChange={handleChange} />
            </label>

            <label>
              <span>Interest Rate (%)</span>
              <input type="number" step="0.01" name="interestRate" value={form.interestRate} onChange={handleChange} />
            </label>

            <label>
              <span>Loan Years</span>
              <input type="number" name="loanYears" value={form.loanYears} onChange={handleChange} />
            </label>
          </div>

          <div className="button-row">
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
            <p>Select a property, fill the details, and click Analyze Investment to see the metrics.</p>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}