import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { getComparisonProperties, getInvestmentProperties, saveComparisonProperties } from '../utils/propertyStorage';
import { calculateInvestmentMetrics, calculateRisk, formatMetric } from '../utils/investmentAnalysis';

const types = ['All', 'Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'];
const risks = ['All', 'LOW', 'MEDIUM', 'HIGH'];
const statuses = ['Available'];
const formatMoney = (value) => `₦${Number(value || 0).toLocaleString()}`;

function PropertyImage({ property }) {
  const [failed, setFailed] = useState(false);
  const image = property.images?.[0] || property.image;
  if (!image || failed) return <div className="investment-image investment-image-placeholder">REITA</div>;
  return <img className="investment-image" src={image} alt="" onError={() => setFailed(true)} />;
}

function InvestmentCard({ property, onView, selected, onToggleCompare }) {
  const metrics = calculateInvestmentMetrics(property);
  const risk = calculateRisk(property);
  return (
    <article className={`glass-card investment-card${selected ? ' investment-card--selected' : ''}`}>
      <PropertyImage property={property} />
      <div className="investment-card-body">
        <div className="investment-card-heading">
          <div>
            <p className="eyebrow">{property.propertyType}</p>
            <h3>{property.propertyName}</h3>
          </div>
          <span className="status-badge status-available">{property.propertyStatus || property.status}</span>
        </div>
        <p className="property-location">{property.location || 'Location not provided'}</p>
        <p className="investment-description">{property.description || 'A new opportunity listed on REITA.'}</p>
        <div className="investment-metrics-grid">
          <div><span>Purchase Price</span><strong>{formatMoney(property.purchasePrice)}</strong></div>
          <div><span>Current Value</span><strong>{formatMoney(property.currentValue)}</strong></div>
          <div><span>Annual Rent</span><strong>{formatMoney(metrics.rentalIncome)}</strong></div>
          <div><span>Annual Expenses</span><strong>{formatMoney(metrics.annualExpenses)}</strong></div>
          <div><span>Available Shares</span><strong>{Number(property.availableShares || 0).toLocaleString()}</strong></div>
          <div><span>Price / Share</span><strong>{formatMoney(property.pricePerShare)}</strong></div>
        </div>
        <div className="investment-card-footer">
          <div>
            <span className={`risk-badge risk-badge--${risk.level.toLowerCase()}`}>{risk.level} Risk</span>
            <strong className="investment-roi">{formatMetric(metrics.roi)}% ROI</strong>
          </div>
          <div className="investment-card-actions">
            <button className={`btn btn-secondary btn-sm${selected ? ' compare-selected' : ''}`} type="button" onClick={() => onToggleCompare(property)}>{selected ? '✓ Selected' : 'Compare'}</button>
            <button className="btn btn-primary btn-sm" type="button" onClick={() => onView(property.id)}>View Details</button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Investments() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('All');
  const [risk, setRisk] = useState('All');
  const [sort, setSort] = useState('newest');
  const [selectedProperties, setSelectedProperties] = useState(() => getComparisonProperties().slice(0, 3));

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const available = await getInvestmentProperties();
      setProperties(available);
      setSelectedProperties((current) => {
        const availableIds = new Set(available.map((property) => property.id));
        const next = current.filter((property) => availableIds.has(property.id)).slice(0, 3);
        saveComparisonProperties(next);
        return next;
      });
    } catch (loadError) {
      setError('Unable to load investment opportunities.');
      toast.error(loadError.message || 'Unable to load investment opportunities.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleCompare = (property) => {
    const selected = selectedProperties.some((item) => item.id === property.id);
    const next = selected
      ? selectedProperties.filter((item) => item.id !== property.id)
      : [...selectedProperties, property];
    if (!selected && selectedProperties.length >= 3) {
      toast.info('You can compare up to 3 properties at a time.');
      return;
    }
    setSelectedProperties(next);
    saveComparisonProperties(next);
  };

  const filtered = useMemo(() => {
    const result = properties.filter((property) => {
      const text = `${property.propertyName} ${property.location} ${property.propertyType}`.toLowerCase();
      const matchesQuery = text.includes(query.toLowerCase());
      const matchesType = type === 'All' || property.propertyType === type;
      const matchesRisk = risk === 'All' || calculateRisk(property).level === risk;
      return matchesQuery && matchesType && matchesRisk;
    });
    return result.sort((a, b) => {
      const aMetrics = calculateInvestmentMetrics(a);
      const bMetrics = calculateInvestmentMetrics(b);
      if (sort === 'roi-high') return (bMetrics.roi || -Infinity) - (aMetrics.roi || -Infinity);
      if (sort === 'roi-low') return (aMetrics.roi || Infinity) - (bMetrics.roi || Infinity);
      if (sort === 'price-low') return Number(a.purchasePrice || 0) - Number(b.purchasePrice || 0);
      if (sort === 'rent-high') return bMetrics.rentalIncome - aMetrics.rentalIncome;
      return Number(b.createdAt || 0) - Number(a.createdAt || 0);
    });
  }, [properties, query, type, risk, sort]);

  return (
    <ProtectedLayout title="Available Investments" subtitle="Explore verified property opportunities from REITA agents.">
      <div className="marketplace-shell">
        <section className="marketplace-header">
          <div>
            <p className="eyebrow">Investor marketplace</p>
            <h2>Available investments</h2>
            <p className="muted">Compare real opportunities using transparent rental and appreciation metrics.</p>
          </div>
          <div className="marketplace-count">{filtered.length} opportunity{filtered.length === 1 ? '' : 'ies'}</div>
        </section>

        <section className="comparison-toolbar glass-card">
          <div><strong>{selectedProperties.length ? `Compare Selected (${selectedProperties.length})` : 'Compare Selected'}</strong><span>{selectedProperties.length < 2 ? 'Select at least 2 properties to compare.' : 'Review the selected opportunities side-by-side.'}</span></div>
          <button className="btn btn-primary" type="button" disabled={selectedProperties.length < 2} onClick={() => navigate('/investments/compare')}>Compare Selected ({selectedProperties.length})</button>
        </section>

        <section className="glass-card marketplace-controls">
          <label><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, location, or type" /></label>
          <label><span>Property Type</span><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Risk Level</span><select value={risk} onChange={(event) => setRisk(event.target.value)}>{risks.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Status</span><select value="Available" readOnly>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Sort By</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="roi-high">Highest ROI</option><option value="roi-low">Lowest ROI</option><option value="price-low">Lowest Price</option><option value="rent-high">Highest Rental Income</option></select></label>
        </section>

        {loading ? (
          <div className="investment-card-grid">{[1, 2, 3].map((item) => <div className="glass-card investment-skeleton" key={item}><div /><div /><div /><div /></div>)}</div>
        ) : error ? (
          <div className="glass-card empty-state"><div className="empty-icon">!</div><h4>Unable to load investment opportunities.</h4><p>Check your connection and try again.</p><button className="btn btn-primary" onClick={load}>Retry</button></div>
        ) : filtered.length === 0 ? (
          <div className="glass-card empty-state"><div className="empty-icon">◆</div><h4>No investment opportunities available yet.</h4><p>Property agents have not listed available opportunities matching these filters.</p></div>
        ) : (
          <div className="investment-card-grid">{filtered.map((property) => <InvestmentCard key={property.id} property={property} selected={selectedProperties.some((item) => item.id === property.id)} onToggleCompare={toggleCompare} onView={(id) => navigate(`/investments/${id}`)} />)}</div>
        )}
      </div>
    </ProtectedLayout>
  );
}
