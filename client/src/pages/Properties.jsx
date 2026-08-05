import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { deleteProperty, getAllProperties, getProperties, saveProperty } from '../utils/propertyStorage';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';
const blank = {
  propertyName: '', propertyType: 'Residential', state: '', city: '', address: '',
  purchasePrice: '', purchaseDate: '', currentValue: '', annualRent: '', annualExpenses: '',
  expectedAppreciation: '', status: 'Available', description: '', image: '', favorite: false,
};
const types = ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'];
const statuses = ['Available', 'Occupied', 'Sold', 'Under Development'];

const fmtNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function Properties() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL || profile?.investorType === 'Administrator';
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState(null);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => setItems(isAdmin ? getAllProperties() : getProperties(user?.uid));
  useEffect(() => { if (user?.uid) load(); }, [user?.uid, isAdmin]);

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

  const submit = e => {
    e.preventDefault();
    if (!form.propertyName || !form.purchasePrice || !form.currentValue) {
      toast.error('Property name, purchase price, and current value are required.');
      return;
    }
    setSaving(true);
    const ownerEmail = editing?.ownerEmail || profile?.email || '';
    const ownerName = editing?.ownerName || profile?.fullName || '';
    saveProperty(user.uid, {
      ...form,
      id: editing?.id,
      ownerEmail,
      ownerName,
      annualRent: form.annualRent || form.monthlyRent ? (Number(form.annualRent || 0) || Number(form.monthlyRent || 0) * 12) : '',
      annualExpenses: form.annualExpenses || '',
      expectedAppreciation: form.expectedAppreciation || form.appreciationRate || '',
    });
    load();
    setEditing(null);
    setForm(blank);
    setSaving(false);
    toast.success(editing ? 'Property updated successfully.' : 'Property added successfully.');
  };

  const edit = p => {
    setEditing(p);
    setForm({
      ...blank,
      ...p,
      annualRent: p.annualRent || (p.monthlyRent ? Number(p.monthlyRent) * 12 : ''),
      expectedAppreciation: p.expectedAppreciation || p.appreciationRate || '',
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteProperty(user.uid, deleteTarget.id);
    load();
    setDeleteTarget(null);
    toast.success('Property deleted successfully.');
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
                <p className="property-location">{p.city || p.state || p.address || 'Location not set'}{p.state && p.city ? `, ${p.state}` : ''}</p>
                {isAdmin && <p className="property-owner">Owner: {p.ownerName || '—'} ({p.ownerEmail || '—'})</p>}
                <div className="property-card-metrics">
                  <div><span>Current Value</span><strong>{fmtNaira(p.currentValue)}</strong></div>
                  <div><span>Annual Rent</span><strong>{fmtNaira(p.annualRent || (p.monthlyRent ? Number(p.monthlyRent) * 12 : 0))}</strong></div>
                  <div><span>Purchase Date</span><strong>{p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '—'}</strong></div>
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
              <label><span>State</span><input name="state" value={form.state} onChange={change} /></label>
              <label><span>City</span><input name="city" value={form.city} onChange={change} /></label>
              <label className="full-width"><span>Address</span><input name="address" value={form.address} onChange={change} /></label>
              <label><span>Purchase Price (₦) *</span><input type="number" name="purchasePrice" value={form.purchasePrice} onChange={change} required /></label>
              <label><span>Purchase Date</span><input type="date" name="purchaseDate" value={form.purchaseDate} onChange={change} /></label>
              <label><span>Current Value (₦) *</span><input type="number" name="currentValue" value={form.currentValue} onChange={change} required /></label>
              <label><span>Annual Rent (₦)</span><input type="number" name="annualRent" value={form.annualRent} onChange={change} /></label>
              <label><span>Annual Expenses (₦)</span><input type="number" name="annualExpenses" value={form.annualExpenses} onChange={change} /></label>
              <label><span>Expected Appreciation (%)</span><input type="number" name="expectedAppreciation" value={form.expectedAppreciation} onChange={change} /></label>
              <label><span>Status</span><select name="status" value={form.status} onChange={change}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
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