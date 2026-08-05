import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ProtectedLayout from '../components/ProtectedLayout';
import { useAuth } from '../context/AuthContext';
import { getAllProperties, getAllReports, getAllUsers } from '../utils/propertyStorage';

const ADMIN_EMAIL = 'britneyjacksonel@gmail.com';
const GOLD = '#d4af37';
const GOLD_LIGHT = '#f7e8b3';
const COLORS = ['#d4af37', '#856404', '#5e503f', '#a98d5b', '#f7e8b3'];

const fmtNaira = (n) => `₦${Number(n || 0).toLocaleString()}`;
const roiOf = (p) => {
  const rent = Number(p.annualRent || p.annualRentalIncome || Number(p.monthlyRent || 0) * 12);
  const expenses = Number(p.annualExpenses || 0);
  const invested = Math.max(Number(p.purchasePrice || 1) - Number(p.mortgage || 0), 1);
  return ((rent - expenses) / invested) * 100;
};

function AnimatedMetric({ label, value, icon, trend }) {
  return (
    <div className="glass-card metric-card analytics-metric">
      <div className="metric-icon">{icon}</div>
      <div className="metric-content">
        <span className="metric-label">{label}</span>
        <strong className="metric-value">{value}</strong>
        <small className="metric-trend">{trend}</small>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { user, profile } = useAuth();
  const [, refresh] = useState(0);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL || profile?.investorType === 'Administrator';

  const data = useMemo(() => {
    const users = getAllUsers();
    const properties = getAllProperties();
    const reports = getAllReports();
    return { users, properties, reports };
  }, [user?.uid, refresh]);

  if (!isAdmin) return null;

  const { users, properties, reports } = data;

  const investors = users.filter(u => u.role === 'Investor').length;
  const agents = users.filter(u => u.role === 'Property Agent').length;
  const totalPortfolioValue = properties.reduce((sum, p) => sum + Number(p.currentValue || 0), 0);
  const avgRoi = properties.length ? properties.reduce((sum, p) => sum + roiOf(p), 0) / properties.length : 0;
  const avgRentalYield = properties.length ? properties.reduce((sum, p) => {
    const rent = Number(p.annualRent || p.annualRentalIncome || Number(p.monthlyRent || 0) * 12);
    const price = Number(p.purchasePrice || 1);
    return sum + (rent / price) * 100;
  }, 0) / properties.length : 0;

  const today = new Date().toDateString();
  const activeToday = users.filter(u => u.lastActive && new Date(u.lastActive).toDateString() === today).length;
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const newThisMonth = users.filter(u => {
    const d = new Date(u.createdAt || 0);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Property types pie
  const typeData = ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use']
    .map(type => ({ name: type, value: properties.filter(p => p.propertyType === type).length }))
    .filter(d => d.value > 0);

  // Property value bar
  const valueData = properties.slice(0, 10).map(p => ({
    name: p.propertyName || 'Unnamed',
    value: Number(p.currentValue || 0),
  }));

  // Monthly property additions
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyAdditions = monthLabels.map((label, i) => ({
    month: label,
    count: properties.filter(p => {
      const d = new Date(p.createdAt || 0);
      return d.getMonth() === i;
    }).length,
  }));

  // ROI analysis
  const roiData = properties.slice(0, 10).map(p => ({
    name: p.propertyName || 'Unnamed',
    roi: Number(roiOf(p).toFixed(2)),
  }));
  const maxRoi = roiData.length ? Math.max(...roiData.map(d => d.roi)) : 0;

  // Reports per month
  const reportsByMonth = monthLabels.map((label, i) => ({
    month: label,
    count: reports.filter(r => {
      const d = new Date(r.createdAt || 0);
      return d.getMonth() === i;
    }).length,
  }));

  // User distribution
  const userDist = [
    { name: 'Investors', value: investors },
    { name: 'Property Agents', value: agents },
    { name: 'Administrators', value: 1 },
  ].filter(d => d.value > 0);

  const tooltipStyle = {
    backgroundColor: 'rgba(10,10,10,0.95)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: '10px',
    color: '#e7dbc1',
  };

  return (
    <ProtectedLayout title="Analytics" subtitle="Live platform metrics drawn from real application data.">
      <div className="card-head">
        <button className="btn btn-secondary" onClick={() => refresh(n => n + 1)}>Refresh analytics</button>
      </div>

      <section className="stats-grid analytics-stats-grid">
        <AnimatedMetric label="Total Registered Users" value={users.length} icon="👥" trend="All registered accounts" />
        <AnimatedMetric label="Total Investors" value={investors} icon="📈" trend="Investor accounts" />
        <AnimatedMetric label="Total Property Agents" value={agents} icon="🏢" trend="Agent accounts" />
        <AnimatedMetric label="Total Properties" value={properties.length} icon="🏠" trend="All properties" />
        <AnimatedMetric label="Reports Generated" value={reports.length} icon="📄" trend="All reports" />
        <AnimatedMetric label="Total Portfolio Value" value={fmtNaira(totalPortfolioValue)} icon="💰" trend="Combined value" />
        <AnimatedMetric label="Average ROI" value={`${avgRoi.toFixed(1)}%`} icon="📊" trend="Across all properties" />
        <AnimatedMetric label="Average Rental Yield" value={`${avgRentalYield.toFixed(1)}%`} icon="🏷️" trend="Across all properties" />
        <AnimatedMetric label="Active Users Today" value={activeToday} icon="⚡" trend="Logged in today" />
        <AnimatedMetric label="New Users This Month" value={newThisMonth} icon="✨" trend="This month" />
      </section>

      {properties.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h4>No properties have been added yet.</h4>
          <p>Once properties are added, analytics will appear here automatically.</p>
        </div>
      ) : (
        <>
          <section className="dashboard-grid-two">
            <div className="glass-card panel-card">
              <p className="eyebrow">Property distribution</p>
              <h4>Property Types</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: '#e7dbc1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card panel-card">
              <p className="eyebrow">User distribution</p>
              <h4>Users by Role</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={userDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                      {userDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: '#e7dbc1' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="glass-card panel-card">
            <p className="eyebrow">Property values</p>
            <h4>Current Property Value</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={valueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="name" tick={{ fill: '#e7dbc1', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#e7dbc1', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => fmtNaira(v)} />
                  <Bar dataKey="value" fill={GOLD} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="dashboard-grid-two">
            <div className="glass-card panel-card">
              <p className="eyebrow">Monthly additions</p>
              <h4>Properties Added Per Month</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyAdditions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: '#e7dbc1', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#e7dbc1', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke={GOLD} strokeWidth={2} dot={{ fill: GOLD_LIGHT }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card panel-card">
              <p className="eyebrow">ROI analysis</p>
              <h4>Property ROI Comparison</h4>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={roiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: '#e7dbc1', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#e7dbc1', fontSize: 11 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v) => `${v}%`} />
                    <Bar dataKey="roi" radius={[6, 6, 0, 0]}>
                      {roiData.map((d, i) => <Cell key={i} fill={d.roi === maxRoi ? GOLD_LIGHT : GOLD} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="glass-card panel-card">
            <p className="eyebrow">Report activity</p>
            <h4>Reports Generated Per Month</h4>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={reportsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="month" tick={{ fill: '#e7dbc1', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#e7dbc1', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke={GOLD_LIGHT} strokeWidth={2} dot={{ fill: GOLD }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </ProtectedLayout>
  );
}