import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { getProfileImage, getProperties, getReports, removeProfileImage, saveProfileImage } from '../utils/propertyStorage';
import { toast } from 'react-toastify';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';

const nigeriaStates = [
  'Abia',
  'Lagos',
  'Abuja',
  'Rivers',
  'Ogun',
  'Kaduna',
  'Kano',
  'Delta',
  'Enugu',
  'Oyo',
];

const defaultProfile = {
  fullName: '',
  email: '',
  phoneNumber: '',
  gender: 'Prefer not to say',
  dateOfBirth: '',
  state: 'Lagos',
  city: '',
  residentialAddress: '',
  preferredInvestmentType: 'Residential',
  riskTolerance: 'Balanced',
  investmentExperience: 'Intermediate',
  preferredCurrency: '₦',
  emailNotifications: true,
  smsNotifications: false,
  connectedGoogle: true,
};

export default function Profile() {
  const { profile, user } = useAuth();
  const [photo, setPhoto] = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [formData, setFormData] = useState(defaultProfile);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedProfile = window.localStorage.getItem('reita-profile-settings');
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setFormData({ ...defaultProfile, ...parsed, email: profile?.email || parsed.email || '' });
      } catch (error) {
        console.error('Unable to parse saved profile settings', error);
      }
    } else if (profile) {
      setFormData((current) => ({
        ...current,
        fullName: profile.fullName || current.fullName,
        email: profile.email || current.email,
      }));
    }
  }, [profile]);
  useEffect(() => { if (user?.uid) setPhoto(getProfileImage(user.uid)); }, [user?.uid]);

  const summaryItems = useMemo(() => {
    const properties = user?.uid ? getProperties(user.uid) : [];
    const reports = user?.uid ? getReports(user.uid) : [];
    const totalValue = properties.reduce((sum, p) => sum + Number(p.currentValue || 0), 0);
    const totalPurchase = properties.reduce((sum, p) => sum + Number(p.purchasePrice || 0), 0);
    const totalProfit = totalValue - totalPurchase;
    const avgRoi = properties.length
      ? properties.reduce((sum, p) => {
          const netIncome = Number(p.annualRentalIncome || Number(p.monthlyRent || 0) * 12) - Number(p.annualExpenses || 0);
          const invested = Math.max(Number(p.purchasePrice || 1) - Number(p.mortgage || 0), 1);
          return sum + (netIncome / invested) * 100;
        }, 0) / properties.length
      : 0;

    return [
      { label: 'Number of Properties', value: String(properties.length) },
      { label: 'Total Portfolio Value', value: `₦${totalValue.toLocaleString()}` },
      { label: 'Estimated Annual Profit', value: `₦${totalProfit.toLocaleString()}` },
      { label: 'Average ROI', value: `${avgRoi.toFixed(1)}%` },
      { label: 'Reports Generated', value: String(reports.length) },
    ];
  }, [user?.uid]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('reita-profile-settings', JSON.stringify({ ...formData, email: profile?.email || formData.email }));
    }
    setIsDirty(false);
    toast.success('Profile saved.');
  };
  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      toast.error(`Image must be ${maxSizeMB} MB or smaller.`);
      event.target.value = '';
      return;
    }

    setPhotoLoading(true);

    const reader = new FileReader();
    reader.onload = () => {
      saveProfileImage(user.uid, reader.result);
      setPhoto(reader.result);
      setPhotoLoading(false);
      toast.success('Profile picture saved.');
    };
    reader.onerror = () => {
      setPhotoLoading(false);
      toast.error('Unable to read the image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (!user?.uid) return;
    removeProfileImage(user.uid);
    setPhoto('');
    toast.success('Profile picture removed.');
  };

  const handleCancel = () => {
    if (typeof window === 'undefined') return;

    const storedProfile = window.localStorage.getItem('reita-profile-settings');
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setFormData({ ...defaultProfile, ...parsed, email: profile?.email || parsed.email || '' });
      } catch (error) {
        console.error('Unable to restore saved profile settings', error);
      }
    } else if (profile) {
      setFormData((current) => ({ ...current, fullName: profile.fullName || '', email: profile.email || '' }));
    }
    setIsDirty(false);
  };

  return (
    <ProtectedLayout title="Profile & Settings" subtitle="Shape your investment identity with a premium personal workspace.">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="profile-shell">
        <section className="glass-card profile-hero-card">
          <div className="profile-banner" />
          <div className="profile-hero-body">
            <div className="profile-avatar-wrap">
              <div className="profile-avatar">
                {photoLoading ? (
                  <span className="avatar-spinner" aria-label="Loading" />
                ) : photo ? (
                  <img className="avatar-image" src={photo} alt="Profile" />
                ) : (
                  <span className="avatar-initial">{(formData.fullName || 'A').slice(0, 1)}</span>
                )}
              </div>
              <label className="avatar-change-btn">
                {photoLoading ? 'Processing…' : 'Change Photo'}
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhoto} hidden disabled={photoLoading} />
              </label>
              {photo && !photoLoading && (
                <button type="button" className="table-action" onClick={handleRemovePhoto}>Remove Photo</button>
              )}
            </div>
            <div className="profile-hero-copy">
              <div className="profile-hero-topline">
                <div>
                  <p className="eyebrow">Premium profile</p>
                  <h3>{formData.fullName || profile?.fullName || 'Investor Name'}</h3>
                </div>
                <span className="pill">{(user?.email?.toLowerCase() === ADMIN_EMAIL) ? 'Administrator' : (profile?.investorType || 'Investor')}</span>
              </div>
              <p className="muted">{formData.email || profile?.email || 'investor@reita.com'}</p>
              <p className="muted">Member since {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>
        </section>

        <div className="profile-grid">
          <section className="glass-card profile-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Personal information</p>
                <h4>Identity details</h4>
              </div>
            </div>

            <div className="field-grid">
              <label>
                <span>Full Name</span>
                <input name="fullName" value={formData.fullName} onChange={handleChange} />
              </label>
              <label>
                <span>Email</span>
                <input name="email" value={formData.email} onChange={handleChange} readOnly />
              </label>
              <label>
                <span>Phone Number</span>
                <input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="e.g. +234 812 345 6789" />
              </label>
              <label>
                <span>Gender</span>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Prefer not to say</option>
                </select>
              </label>
              <label>
                <span>Date of Birth</span>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              </label>
              <label>
                <span>State</span>
                <select name="state" value={formData.state} onChange={handleChange}>
                  {nigeriaStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>City</span>
                <input name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Lekki" />
              </label>
              <label className="full-width">
                <span>Residential Address</span>
                <input name="residentialAddress" value={formData.residentialAddress} onChange={handleChange} placeholder="Enter full address" />
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </section>

          <section className="glass-card profile-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Investment preferences</p>
                <h4>Portfolio style</h4>
              </div>
            </div>
            <div className="field-grid compact">
              <label>
                <span>Preferred Investment Type</span>
                <select name="preferredInvestmentType" value={formData.preferredInvestmentType} onChange={handleChange}>
                  <option>Residential</option>
                  <option>Commercial</option>
                  <option>Mixed-use</option>
                  <option>Development</option>
                </select>
              </label>
              <label>
                <span>Risk Tolerance</span>
                <select name="riskTolerance" value={formData.riskTolerance} onChange={handleChange}>
                  <option>Conservative</option>
                  <option>Balanced</option>
                  <option>Aggressive</option>
                </select>
              </label>
              <label>
                <span>Investment Experience</span>
                <select name="investmentExperience" value={formData.investmentExperience} onChange={handleChange}>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
              <label>
                <span>Preferred Currency</span>
                <input name="preferredCurrency" value={formData.preferredCurrency} onChange={handleChange} />
              </label>
            </div>
          </section>

          <section className="glass-card profile-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Account summary</p>
                <h4>High-level snapshot</h4>
              </div>
            </div>
            <div className="summary-grid">
              {summaryItems.map((item) => (
                <div key={item.label} className="summary-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card profile-card">
            <div className="card-head">
              <div>
                <p className="eyebrow">Security</p>
                <h4>Access & notifications</h4>
              </div>
            </div>
            <div className="security-list">
              <button type="button" className="action-btn security-action">Change Password</button>
              <div className="security-row">
                <span>Connected Google Account</span>
                <strong>{formData.connectedGoogle ? 'Connected' : 'Not connected'}</strong>
              </div>
              <label className="toggle-row">
                <span>Email Notifications</span>
                <input type="checkbox" name="emailNotifications" checked={formData.emailNotifications} onChange={handleChange} />
              </label>
              <label className="toggle-row">
                <span>SMS Notifications</span>
                <input type="checkbox" name="smsNotifications" checked={formData.smsNotifications} onChange={handleChange} />
              </label>
            </div>
          </section>
        </div>

        <div className="mobile-save-bar">
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </motion.div>

    </ProtectedLayout>
  );
}
