import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { getComparisonProperties, getInvestmentProperties, saveComparisonProperties } from '../utils/propertyStorage';
import { calculateInvestmentAnalysis, calculateRisk, formatCurrency, formatMetric, formatPercentage } from '../utils/investmentAnalysis';

const riskRank = { LOW: 3, MEDIUM: 2, HIGH: 1 };

const rows = [
  { key: 'propertyName', label: 'Property Name', format: (property) => property.propertyName || 'Unnamed property' },
  { key: 'location', label: 'Location', format: (property) => property.location || 'N/A' },
  { key: 'propertyType', label: 'Property Type', format: (property) => property.propertyType || 'N/A' },
  { key: 'purchasePrice', label: 'Total Property Price', metric: 'purchasePrice', format: (property, analysis) => formatCurrency(analysis.purchasePrice) },
  { key: 'currentValue', label: 'Current Value', metric: 'currentValue', format: (property, analysis) => formatCurrency(analysis.currentValue) },
  { key: 'rentalIncome', label: 'Annual Rental Income', metric: 'rentalIncome', format: (property, analysis) => formatCurrency(analysis.rentalIncome) },
  { key: 'annualExpenses', label: 'Annual Expenses', metric: 'annualExpenses', format: (property, analysis) => formatCurrency(analysis.annualExpenses) },
  { key: 'netRentalIncome', label: 'Net Rental Income', metric: 'netRentalIncome', format: (property, analysis) => formatCurrency(analysis.netRentalIncome) },
  { key: 'appreciationRate', label: 'Expected Appreciation', metric: 'appreciationRate', format: (property, analysis) => formatPercentage(analysis.appreciationRate) },
  { key: 'annualCashFlow', label: 'Annual Cash Flow', metric: 'annualCashFlow', format: (property, analysis) => formatCurrency(analysis.annualCashFlow) },
  { key: 'roi', label: 'ROI', metric: 'roi', format: (property, analysis) => formatPercentage(analysis.roi) },
  { key: 'paybackPeriod', label: 'Payback Period', metric: 'paybackPeriod', format: (property, analysis) => analysis.paybackPeriod === null ? 'Not achievable' : `${formatMetric(analysis.paybackPeriod)} years` },
  { key: 'pricePerShare', label: 'Price Per Share', metric: 'pricePerShare', format: (property) => formatCurrency(property.pricePerShare) },
  { key: 'availableShares', label: 'Available Shares', metric: 'availableShares', format: (property) => Number(property.availableShares || 0).toLocaleString() },
  { key: 'minimumInvestment', label: 'Minimum Investment', metric: 'minimumInvestment', format: (property) => formatCurrency(property.minimumInvestment) },
  { key: 'rentalYield', label: 'Rental Yield', metric: 'rentalYield', format: (property, analysis) => formatPercentage(analysis.rentalYield) },
  { key: 'expenseRatio', label: 'Expense Ratio', metric: 'expenseRatio', format: (property, analysis) => formatPercentage(analysis.expenseRatio) },
  { key: 'risk', label: 'Risk', metric: 'risk', format: (property, analysis, risk) => risk.level },
];

const getValue = (item, row) => {
  if (row.metric === 'risk') return riskRank[item.risk.level] || 0;
  return Number(item.analysis[row.metric]);
};

const normalize = (value, values, invert = false) => {
  const finiteValues = values.filter(Number.isFinite);
  if (!finiteValues.length) return 0;
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  if (min === max) return 1;
  const result = (value - min) / (max - min);
  return invert ? 1 - result : result;
};

function getBestIndexes(items, row) {
  if (!row.metric || items.length < 2) return [];
  const values = items.map((item) => getValue(item, row));
  if (values.some((value) => !Number.isFinite(value))) return [];
  const best = row.metric === 'paybackPeriod' ? Math.min(...values.filter((value) => value > 0)) : row.metric === 'expenseRatio' ? Math.min(...values) : Math.max(...values);
  return values.reduce((indexes, value, index) => (value === best ? [...indexes, index] : indexes), []);
}

function buildRecommendation(items) {
  if (!items.length) return null;
  const scoreFor = (item, metric, invert = false) => normalize(
    metric === 'risk' ? riskRank[item.risk.level] : item.analysis[metric],
    items.map((entry) => metric === 'risk' ? riskRank[entry.risk.level] : entry.analysis[metric]),
    invert
  );
  const scored = items.map((item) => ({
    ...item,
    score: (scoreFor(item, 'roi') * 0.35)
      + (scoreFor(item, 'annualCashFlow') * 0.25)
      + (scoreFor(item, 'risk') * 0.2)
      + (scoreFor(item, 'rentalYield') * 0.15)
      + (scoreFor(item, 'expenseRatio', true) * 0.05),
  })).sort((a, b) => b.score - a.score);
  const winner = scored[0];
  const strongestRoi = items.every((item) => winner.analysis.roi >= item.analysis.roi);
  const strongestYield = items.every((item) => winner.analysis.rentalYield >= item.analysis.rentalYield);
  const lowestRisk = items.every((item) => riskRank[winner.risk.level] >= riskRank[item.risk.level]);
  const explanation = strongestRoi && strongestYield
    ? 'it provides the strongest projected ROI and rental yield among the selected properties.'
    : lowestRisk
      ? 'it combines a stronger overall score with the lowest projected risk among the selected properties.'
      : 'its weighted score balances projected return, cash flow, rental yield, expense burden, and risk most effectively.';
  return { winner, explanation };
}

export default function CompareInvestments() {
  const [items, setItems] = useState([]);
  const [missingCount, setMissingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const selected = getComparisonProperties();
    if (!selected.length) {
      setLoading(false);
      return undefined;
    }
    getInvestmentProperties()
      .then((available) => {
        if (!active) return;
        const availableById = new Map(available.map((property) => [property.id, property]));
        const current = selected.map((property) => availableById.get(property.id)).filter(Boolean).slice(0, 3);
        setMissingCount(selected.length - current.length);
        setItems(current.map((property) => ({ property, analysis: calculateInvestmentAnalysis(property), risk: calculateRisk(property) })));
        saveComparisonProperties(current);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message || 'Unable to load properties for comparison.');
          toast.error(loadError.message || 'Unable to load properties for comparison.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const recommendation = useMemo(() => buildRecommendation(items), [items]);

  const removeProperty = (id) => {
    const next = items.filter((item) => item.property.id !== id);
    setItems(next);
    saveComparisonProperties(next.map((item) => item.property));
  };

  if (loading) return <ProtectedLayout title="Property Comparison" subtitle="Loading selected investment opportunities..."><div className="glass-card empty-state">Loading comparison...</div></ProtectedLayout>;
  if (error) return <ProtectedLayout title="Property Comparison" subtitle="Comparison unavailable."><div className="glass-card empty-state"><h4>{error}</h4><Link className="btn btn-primary" to="/investments">Browse Investments</Link></div></ProtectedLayout>;
  if (items.length < 2) return <ProtectedLayout title="Property Comparison" subtitle="Compare selected investment opportunities side-by-side."><div className="glass-card empty-state"><div className="empty-icon">◆</div><h4>{items.length ? 'Select at least 2 properties to compare.' : 'No Properties Selected'}</h4><p>{missingCount ? 'One or more selected properties are no longer available for comparison.' : 'Select at least two investment opportunities from the marketplace to compare them.'}</p><Link className="btn btn-primary" to="/investments">Browse Investments</Link></div></ProtectedLayout>;

  return (
    <ProtectedLayout title="Property Comparison" subtitle="Compare selected investment opportunities side-by-side.">
      <div className="comparison-page">
        {missingCount > 0 && <div className="comparison-alert" role="status">One or more selected properties are no longer available for comparison.</div>}
        <div className="comparison-actions"><Link className="back-link" to="/investments">← Available Investments</Link><span>{items.length} of 3 properties selected</span></div>
        <section className="glass-card comparison-table-shell">
          <div className="comparison-table-scroll"><table className="comparison-table"><thead><tr><th>Investment Metric</th>{items.map((item) => <th key={item.property.id}><Link className="comparison-property-link" to={`/investments/${item.property.id}`}>{(item.property.images?.[0] || item.property.image) && <img src={item.property.images?.[0] || item.property.image} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} />}{item.property.propertyName || 'Unnamed property'}</Link><button type="button" className="comparison-remove" onClick={() => removeProperty(item.property.id)}>Remove</button></th>)}</tr></thead><tbody>{rows.map((row) => { const bestIndexes = getBestIndexes(items, row); return <tr key={row.key}><th>{row.label}</th>{items.map((item, index) => <td className={bestIndexes.includes(index) ? 'comparison-best' : ''} key={item.property.id}><span>{row.format(item.property, item.analysis, item.risk)}</span>{bestIndexes.includes(index) && <small>{row.metric === 'risk' ? 'Lowest Risk' : 'Best'}</small>}</td>)}</tr>; })}</tbody></table></div>
        </section>
        {recommendation && <section className="glass-card comparison-recommendation"><p className="eyebrow">System Recommendation</p><h2>{recommendation.winner.property.propertyName || 'Selected property'}</h2><p>Based on the selected financial indicators, the system recommends <strong>{recommendation.winner.property.propertyName || 'this property'}</strong> because {recommendation.explanation}</p><small>REITA's recommendation is based on projected property data and is intended for investment decision support. It does not constitute financial advice.</small></section>}
      </div>
    </ProtectedLayout>
  );
}
