import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { deleteProperty, getProperties, saveProperty } from '../utils/propertyStorage';

const blank = {
  propertyName: '', location: '', propertyType: 'Residential', description: '',
  purchasePrice: '', currentValue: '', expectedRentalIncome: '', annualExpenses: '',
  expectedAppreciation: '', availableShares: '', pricePerShare: '', minimumInvestment: '',
  propertyStatus: 'Under review', status: 'Under review', image: '', images: [],
};
const types = ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'];
const statuses = ['Available', 'Fully funded', 'Under review', 'Sold/closed'];

const fmtNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function Properties() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'Administrator' || profile?.investorType === 'Administrator';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // Backend returns own properties for normal users and all properties
      // for Administrators based on the verified JWT role.
      const list = await getProperties(user?.uid, user?.role);
      setItems(list);
    } catch (err) {
      toast.error(err.message || 'Unable to load properties.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (user) load(); }, [user?.uid]);

  const filtered = useMemo(() => {
    let list = items.filter(p => {
      const matchesQuery = `${p.propertyName || ''} ${p.state || ''} ${p.city || ''} ${p.address || ''} ${p.ownerName || ''} ${p.ownerEmail || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchesType = typeFilter === 'All' || p.propertyType === typeFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchesQuery && matchesType && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortBy === 'price-asc') return Number(a.currentValue || 0) - Number(b.currentValue || 0);
      if (sortBy === 'price-desc') return Number(b.currentValue || 0) - Number(a.currentValue || 0);
      if (sortBy === 'name') return String(a.propertyName || '').localeCompare(String(b.propertyName || ''));
      return 0;
    });

    return list;
  }, [items, query, typeFilter, statusFilter, sortBy]);

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.propertyName || !form.purchasePrice || !form.currentValue) {
      toast.error('Property name, purchase price, and current value are required.');
      return;
    }
    setSaving(true);
    try {
      // Ownership fields are derived by the backend from the verified JWT.
      await saveProperty(user.uid, {
        ...form,
        id: editing?.id,
        propertyStatus: form.propertyStatus,
        status: form.propertyStatus,
        images: form.image ? [form.image] : [],
      });
      await load();
      setEditing(null);
      setForm(blank);
      toast.success(editing ? 'Property updated successfully.' : 'Property added successfully.');
    } catch (err) {
      toast.error(err.message || 'Unable to save property.');
    } finally {
      setSaving(false);
    }
  };

  const edit = p => {
    setEditing(p);
    setForm({
      ...blank,
      ...p,
      propertyStatus: p.propertyStatus || p.status || 'Under review',
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProperty(user.uid, deleteTarget.id);
      await load();
      setDeleteTarget(null);
      toast.success('Property deleted successfully.');
    } catch (err) {
      toast.error(err.message || 'Unable to delete property.');
    }
  };

  const analyze = p => navigate('/calculator', { state: { propertyId: p.id } });

  const roleTitle = isAdmin ? 'All Properties' : 'My Properties';

  return (
    <ProtectedLayout title={roleTitle} subtitle={isAdmin ? 'View every property created by registered users.' : 'Manage your property portfolio with premium cards.'}>
      <div className="glass-card panel-card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Property management</p>
            <h4>{roleTitle}</h4>
          </div>
          {!isAdmin && (
            <button className="btn btn-primary" onClick={() => { setEditing({}); setForm(blank); }}>
              Add Property
            </button>
          )}
        </div>

        <div className="filter-grid">
          <label>
            <span>Search</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Name, state, city, or address" />
          </label>
          <label>
            <span>Property Type</span>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option>All</option>
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span>Status</span>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label>
            <span>Sort By</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏠</div>
            <h4>No properties found</h4>
            <p>{query || typeFilter !== 'All' || statusFilter !== 'All' ? 'Try adjusting your search or filters.' : 'Add your first property to get started.'}</p>
            {!isAdmin && !query && typeFilter === 'All' && statusFilter === 'All' && (
              <button className="btn btn-primary" onClick={() => { setEditing({}); setForm(blank); }}>Add Property</button>
            )}
          </div>
        ) : (
          <div className="property-card-grid">
            {filtered.map(p => (
              <div key={p.id} className="glass-card property-card">
                <div className="property-card-head">
                  <div>
                    <p className="eyebrow">{p.propertyType}</p>
                    <h4>{p.propertyName}</h4>
                  </div>
                  <span className={`status-badge status-${String(p.status || '').toLowerCase().replace(/\s+/g, '-')}`}>{p.status}</span>
                </div>
                {p.images?.[0] ? <img className="property-card-image" src={p.images[0]} alt="" /> : null}
                <p className="property-location">{p.location || p.city || p.state || p.address || 'Location not set'}</p>
                {isAdmin && <p className="property-owner">Owner: {p.ownerName || '—'} ({p.ownerEmail || '—'})</p>}
                <div className="property-card-metrics">
                  <div><span>Current Value</span><strong>{fmtNaira(p.currentValue)}</strong></div>
                  <div><span>Expected Rental Income</span><strong>{fmtNaira(p.expectedRentalIncome || p.annualRent)}</strong></div>
                  <div><span>Available Shares</span><strong>{Number(p.availableShares || 0).toLocaleString()}</strong></div>
                </div>
                <div className="property-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => analyze(p)}>Analyze</button>
                  {!isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => edit(p)}>Edit</button>}
                  <button className="btn btn-secondary btn-sm" onClick={() => setView(p)}>View</button>
                  <button className="btn btn-secondary btn-sm btn-danger" onClick={() => setDeleteTarget(p)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop">
          <form className="modal-card property-modal-card" onSubmit={submit}>
            <h3>{editing.id ? 'Edit Property' : 'Add Property'}</h3>
            <div className="field-grid property-form-grid">
              <label><span>Property Name *</span><input name="propertyName" value={form.propertyName} onChange={change} required /></label>
              <label><span>Property Type</span><select name="propertyType" value={form.propertyType} onChange={change}>{types.map(t => <option key={t}>{t}</option>)}</select></label>
              <label className="full-width"><span>Location *</span><input name="location" value={form.location} onChange={change} required /></label>
              <label><span>Purchase Price (₦) *</span><input type="number" name="purchasePrice" value={form.purchasePrice} onChange={change} required /></label>
              <label><span>Current Value (₦) *</span><input type="number" name="currentValue" value={form.currentValue} onChange={change} required /></label>
              <label><span>Expected Rental Income (₦)</span><input type="number" name="expectedRentalIncome" value={form.expectedRentalIncome} onChange={change} /></label>
              <label><span>Annual Expenses (₦)</span><input type="number" name="annualExpenses" value={form.annualExpenses} onChange={change} /></label>
              <label><span>Expected Appreciation (%)</span><input type="number" name="expectedAppreciation" value={form.expectedAppreciation} onChange={change} /></label>
              <label><span>Available Shares</span><input type="number" min="0" step="1" name="availableShares" value={form.availableShares} onChange={change} /></label>
              <label><span>Price Per Share (₦)</span><input type="number" min="0" name="pricePerShare" value={form.pricePerShare} onChange={change} /></label>
              <label><span>Minimum Investment (₦)</span><input type="number" min="0" name="minimumInvestment" value={form.minimumInvestment} onChange={change} /></label>
              <label><span>Property Status</span><select name="propertyStatus" value={form.propertyStatus} onChange={change}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
              <label className="full-width"><span>Image URL (optional)</span><input name="image" type="url" value={form.image || ''} onChange={change} placeholder="https://..." /></label>
              <label className="full-width"><span>Description</span><textarea name="description" value={form.description} onChange={change} rows="3" /></label>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Property'}</button>
            </div>
          </form>
        </div>
      )}

      {view && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>{view.propertyName}</h3>
            <p><strong>Type:</strong> {view.propertyType}</p>
            <p><strong>Location:</strong> {view.address || view.city || view.state || '—'}</p>
            {isAdmin && <p><strong>Owner:</strong> {view.ownerName || '—'} ({view.ownerEmail || '—'})</p>}
            <p><strong>Purchase Price:</strong> {fmtNaira(view.purchasePrice)}</p>
            <p><strong>Current Value:</strong> {fmtNaira(view.currentValue)}</p>
            <p><strong>Annual Rent:</strong> {fmtNaira(view.annualRent || (view.monthlyRent ? Number(view.monthlyRent) * 12 : 0))}</p>
            <p><strong>Annual Expenses:</strong> {fmtNaira(view.annualExpenses)}</p>
            <p><strong>Expected Appreciation:</strong> {view.expectedAppreciation || view.appreciationRate || '0'}%</p>
            <p><strong>Status:</strong> {view.status}</p>
            <p><strong>Added:</strong> {new Date(view.createdAt || Date.now()).toLocaleDateString()}</p>
            <p>{view.description || ''}</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => setView(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3>Delete Property</h3>
            <p>Are you sure you want to delete <strong>{deleteTarget.propertyName}</strong>? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-primary btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}