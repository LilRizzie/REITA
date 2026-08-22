import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { getInvestmentProperty } from '../utils/propertyStorage';
import {
  calculateInvestmentAnalysis,
  calculateRisk,
  calculateShareInvestment,
  formatCurrency,
  formatMetric,
  formatPercentage,
} from '../utils/investmentAnalysis';

const formatMoney = formatCurrency;

function Gallery({ property }) {
  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(false);
  if (!images.length || failed) return <div className="investment-detail-image investment-image-placeholder">REITA</div>;
  return (
    <div>
      <img className="investment-detail-image" src={images[active]} alt="" onError={() => setFailed(true)} />
      {images.length > 1 && <div className="investment-thumbnails">{images.map((image, index) => <button type="button" key={image} className={index === active ? 'active' : ''} onClick={() => setActive(index)}><img src={image} alt="" /></button>)}</div>}
    </div>
  );
}

export default function InvestmentDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');

  useEffect(() => {
    let active = true;
    getInvestmentProperty(id)
      .then((value) => { if (active) setProperty(value); })
      .catch((loadError) => { if (active) { setError(loadError.message || 'Unable to load this investment opportunity.'); toast.error(loadError.message || 'Unable to load this investment opportunity.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) return <ProtectedLayout title="Investment Details" subtitle="Loading opportunity..."><div className="glass-card empty-state">Loading investment details...</div></ProtectedLayout>;
  if (error || !property) return <ProtectedLayout title="Investment Details" subtitle="Opportunity unavailable."><div className="glass-card empty-state"><h4>{error || 'Investment opportunity not found.'}</h4><Link className="btn btn-primary" to="/investments">Back to investments</Link></div></ProtectedLayout>;

  const metrics = calculateInvestmentAnalysis(property);
  const risk = calculateRisk(property);
  const defaultAmount = property.minimumInvestment > 0
    ? property.minimumInvestment
    : property.pricePerShare > 0
      ? property.pricePerShare
      : metrics.purchasePrice;
  const analysisAmount = investmentAmount === '' ? defaultAmount : investmentAmount;
  const shareAnalysis = calculateShareInvestment(property, analysisAmount);

  const openAnalysis = () => {
    setInvestmentAmount(String(defaultAmount));
    setShowAnalysis(true);
  };

  return (
    <ProtectedLayout title="Investment Details" subtitle="Review transparent property and return information.">
      <div className="investment-detail-shell">
        <Link className="back-link" to="/investments">← Back to available investments</Link>
        <section className="investment-detail-hero glass-card">
          <Gallery property={property} />
          <div className="investment-detail-intro">
            <p className="eyebrow">{property.propertyType}</p>
            <h2>{property.propertyName}</h2>
            <p className="property-location">{property.location || 'Location not provided'}</p>
            <span className="status-badge status-available">{property.propertyStatus || property.status}</span>
            <p className="investment-detail-description">{property.description || 'No description provided.'}</p>
            <button className="btn btn-primary" type="button" onClick={openAnalysis}>Analyze Investment</button>
          </div>
        </section>

        <div className="investment-detail-grid">
          <section className="glass-card detail-section"><p className="eyebrow">Property information</p><h3>At a glance</h3><div className="detail-list"><div><span>Name</span><strong>{property.propertyName}</strong></div><div><span>Location</span><strong>{property.location || 'N/A'}</strong></div><div><span>Type</span><strong>{property.propertyType}</strong></div></div></section>
          <section className="glass-card detail-section"><p className="eyebrow">Financial information</p><h3>Core figures</h3><div className="detail-list"><div><span>Purchase price</span><strong>{formatMoney(property.purchasePrice)}</strong></div><div><span>Current value</span><strong>{formatMoney(property.currentValue)}</strong></div><div><span>Expected rental income</span><strong>{formatMoney(metrics.rentalIncome)}</strong></div><div><span>Annual expenses</span><strong>{formatMoney(metrics.annualExpenses)}</strong></div><div><span>Expected appreciation</span><strong>{formatMoney(metrics.appreciation)}</strong></div></div></section>
          <section className="glass-card detail-section"><p className="eyebrow">Investment information</p><h3>Participation</h3><div className="detail-list"><div><span>Available shares</span><strong>{Number(property.availableShares || 0).toLocaleString()}</strong></div><div><span>Price per share</span><strong>{formatMoney(property.pricePerShare)}</strong></div><div><span>Minimum investment</span><strong>{formatMoney(property.minimumInvestment)}</strong></div><div><span>Status</span><strong>{property.propertyStatus || property.status}</strong></div></div></section>
          <section className="glass-card detail-section analysis-preview"><p className="eyebrow">Analysis preview</p><h3>Projected performance</h3><div className="analysis-highlight"><strong>{formatPercentage(metrics.roi)}</strong><span>Projected ROI</span></div><div className="detail-list"><div><span>Net rental income</span><strong>{formatMoney(metrics.netRentalIncome)}</strong></div><div><span>Estimated annual return</span><strong>{formatMoney(metrics.annualCashFlow)}</strong></div><div><span>Risk level</span><strong className={`risk-text risk-text--${risk.level.toLowerCase()}`}>{risk.level} Risk</strong></div></div><p className="risk-reason">{risk.reason}</p></section>
        </div>

        {showAnalysis && (
          <section className="glass-card investment-analysis-panel">
            <div className="analysis-panel-heading">
              <div><p className="eyebrow">Investment Analysis</p><h2>{property.propertyName}</h2></div>
              <span className={`risk-badge risk-badge--${risk.level.toLowerCase()}`}>{risk.level} Risk</span>
            </div>
            <div className="analysis-input-row">
              <label htmlFor="investment-amount">Investment Amount</label>
              <input id="investment-amount" type="number" min={shareAnalysis.minimumInvestment || 0} step="1" value={investmentAmount} onChange={(event) => setInvestmentAmount(event.target.value)} placeholder="Enter an amount in Naira" />
              {shareAnalysis.validationError && <p className="analysis-validation" role="alert">{shareAnalysis.validationError}</p>}
            </div>

            <div className="analysis-section"><h3>Financial Summary</h3><div className="analysis-metric-grid">
              <div><span>Investment amount</span><strong>{formatMoney(analysisAmount)}</strong></div>
              <div><span>Total property price</span><strong>{formatMoney(metrics.purchasePrice)}</strong></div>
              <div><span>Current value</span><strong>{formatMoney(metrics.currentValue)}</strong></div>
              <div><span>Annual rental income</span><strong>{formatMoney(metrics.rentalIncome)}</strong></div>
              <div><span>Annual expenses</span><strong>{formatMoney(metrics.annualExpenses)}</strong></div>
              <div><span>Net rental income</span><strong>{formatMoney(metrics.netRentalIncome)}</strong></div>
              <div><span>Expected annual appreciation</span><strong>{formatMoney(metrics.annualAppreciation)}</strong></div>
              <div><span>Annual cash flow</span><strong>{formatMoney(metrics.annualCashFlow)}</strong></div>
            </div></div>

            <div className="analysis-section"><h3>Investment Performance</h3><div className="analysis-metric-grid">
              <div><span>ROI</span><strong>{formatPercentage(metrics.roi)}</strong></div>
              <div><span>Expected annual return</span><strong>{formatMoney(metrics.annualCashFlow)}</strong></div>
              <div><span>Estimated payback period</span><strong>{metrics.paybackPeriod === null ? 'Not achievable under current projections' : `${formatMetric(metrics.paybackPeriod)} years`}</strong></div>
              <div><span>Rental yield</span><strong>{formatPercentage(metrics.rentalYield)}</strong></div>
            </div></div>

            <div className="analysis-section"><h3>Share Investment</h3><div className="analysis-metric-grid">
              <div><span>Price per share</span><strong>{formatMoney(shareAnalysis.pricePerShare)}</strong></div>
              <div><span>Available shares</span><strong>{shareAnalysis.availableShares.toLocaleString()}</strong></div>
              <div><span>Minimum investment</span><strong>{formatMoney(shareAnalysis.minimumInvestment)}</strong></div>
              <div><span>Number of shares</span><strong>{shareAnalysis.shareDataAvailable ? shareAnalysis.numberOfShares.toLocaleString() : 'Whole-property analysis'}</strong></div>
              <div><span>Projected annual income</span><strong>{formatMoney(shareAnalysis.projectedAnnualIncome)}</strong></div>
              <div><span>Projected appreciation</span><strong>{formatMoney(shareAnalysis.projectedAppreciation)}</strong></div>
              <div><span>Projected annual return</span><strong>{formatMoney(shareAnalysis.projectedAnnualReturn)}</strong></div>
            </div></div>

            <div className="analysis-risk-box"><div><p className="eyebrow">Risk Assessment</p><span className={`risk-badge risk-badge--${risk.level.toLowerCase()}`}>{risk.level} Risk</span></div><p>{risk.reason}</p></div>
          </section>
        )}
      </div>
    </ProtectedLayout>
  );
}
