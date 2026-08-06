import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { getAllProperties, getAllReports, getAllUsers, getAnalyses, getClients, getListings, getProperties, getReports } from '../utils/propertyStorage';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';
const roi = (p) => ((Number(p.annualRent || p.annualRentalIncome || Number(p.monthlyRent || 0) * 12) - Number(p.annualExpenses || 0)) / Math.max(Number(p.purchasePrice || 1) - Number(p.mortgage || 0), 1)) * 100;
const fmtNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [, rerender] = useState(0);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;
  const role = isAdmin ? 'Administrator' : (profile?.investorType || 'Investor');

  const data = useMemo(() => ({
    properties: role === 'Administrator' ? getAllProperties() : getProperties(user?.uid),
    listings: getListings(user?.uid),
    reports: role === 'Administrator' ? getAllReports() : getReports(user?.uid),
    analyses: getAnalyses(user?.uid),
    clients: getClients(user?.uid),
    users: getAllUsers(),
  }), [role, user?.uid, rerender]);

  const propertyRois = data.properties.map(roi);
  const recentProperty = [...data.properties].sort((a, b) => b.createdAt - a.createdAt)[0];
  const recentReport = [...data.reports].sort((a, b) => b.createdAt - a.createdAt)[0];
  const totalPortfolioValue = data.properties.reduce((sum, p) => sum + Number(p.currentValue || 0), 0);

  const cards = role === 'Administrator'
    ? [
        ['Total Users', data.users.length],
        ['Total Properties', data.properties.length],
        ['Reports Generated', data.reports.length],
        ['Average ROI Across Platform', `${(propertyRois.reduce((a, b) => a + b, 0) / Math.max(propertyRois.length, 1)).toFixed(2)}%`],
      ]
    : role === 'Property Agent'
      ? [
          ['Active Listings', data.listings.filter(p => p.status === 'Available').length],
          ['Properties Sold', data.listings.filter(p => p.status === 'Sold').length],
          ['Pending Clients', data.clients.filter(c => c.status === 'New' || c.status === 'Contacted').length],
          ['Upcoming Meetings', data.clients.filter(c => c.meetingDate && new Date(c.meetingDate) >= new Date()).length],
        ]
      : [
          ['Total Properties', data.properties.length],
          ['Total Portfolio Value', fmtNaira(totalPortfolioValue)],
          ['Average ROI', `${(propertyRois.reduce((a, b) => a + b, 0) / Math.max(propertyRois.length, 1)).toFixed(2)}%`],
          ['Reports Generated', data.reports.length],
        ];

  const actions = role === 'Investor'
    ? [['Add Property', '/properties'], ['Open Calculator', '/calculator'], ['Generate Report', '/calculator']]
    : role === 'Administrator'
      ? [['Manage Users', '/users'], ['View Properties', '/properties'], ['Analytics', '/analytics']]
      : [['Add Listing', '/listings'], ['Add Client', '/clients'], ['View Reports', '/reports']];

  return (
    <ProtectedLayout title="Dashboard" subtitle="Live information from your locally saved REITA workspace.">
      <section className="hero-panel premium-panel">
        <div>
          <p className="eyebrow">{role}</p>
          <h3>Welcome back, {profile?.fullName || 'User'}</h3>
          <p>Review the latest activity and continue where you left off.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => rerender(n => n + 1)}>Refresh</button>
      </section>

      <section className="stats-grid">
        {cards.map(([label, value]) => (
          <StatCard key={label} label={label} value={value} change="Current data" />
        ))}
      </section>

      {role === 'Investor' && (
        <section className="stats-grid">
          <StatCard
            label="Last Report Generated"
            value={recentReport ? new Date(recentReport.createdAt).toLocaleDateString() : 'None yet'}
            change={recentReport?.propertyName || 'Generate an analysis'}
          />
          <StatCard
            label="Recent Analysis"
            value={data.analyses[0]?.propertyName || 'None yet'}
            change={data.analyses[0]?.recommendation || 'Use Calculator'}
          />
          <StatCard
            label="Recent Property Added"
            value={recentProperty?.propertyName || 'None yet'}
            change={recentProperty?.location || 'Add your first property'}
          />
        </section>
      )}

      <section className="dashboard-grid-two">
        <div className="glass-card panel-card">
          <p className="eyebrow">Recent activity</p>
          <h4>{role === 'Administrator' ? 'Latest registrations and properties' : 'Latest properties'}</h4>
          <ul className="timeline-list">
            {(role === 'Administrator' ? [...data.users, ...data.properties] : data.properties)
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 5)
              .map(item => (
                <li key={item.id || item.uid}>
                  {item.propertyName || item.fullName} <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </li>
              ))}
            {!data.properties.length && <li>No saved activity yet.</li>}
          </ul>
        </div>

        <div className="glass-card panel-card">
          <p className="eyebrow">Quick actions</p>
          <h4>Continue working</h4>
          <div className="action-stack">
            {actions.map(([label, path]) => (
              <button className="action-btn" key={label} onClick={() => navigate(path)}>{label}</button>
            ))}
          </div>
        </div>
      </section>
    </ProtectedLayout>
  );
}