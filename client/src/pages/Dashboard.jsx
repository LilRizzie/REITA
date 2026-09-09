import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProtectedLayout from '../components/ProtectedLayout';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';

import {
  getAllReports,
  getAllUsers,
  getAnalyses,
  getClients,
  getListings,
  getProperties,
  getReports,
} from '../utils/propertyStorage';

const roi = (p) =>
  (
    (
      Number(
        p.annualRent ||
        p.annualRentalIncome ||
        Number(p.monthlyRent || 0) * 12
      ) -
      Number(p.annualExpenses || 0)
    ) /
    Math.max(
      Number(p.purchasePrice || 1) -
        Number(p.mortgage || 0),
      1
    )
  ) * 100;

const fmtNaira = (n) =>
  `₦${Number(n || 0).toLocaleString()}`;

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  const [properties, setProperties] = useState([]);
  const [reports, setReports] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [listings, setListings] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const role = user?.role || profile?.investorType || 'Investor';

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [
          propertyData,
          reportData,
          analysisData,
        ] = await Promise.all([
          getProperties(user?.uid),
          role === 'Administrator'
            ? getAllReports()
            : getReports(user?.uid),
          getAnalyses(user?.uid),
        ]);

        if (!active) return;

        setProperties(
          Array.isArray(propertyData)
            ? propertyData
            : []
        );

        setReports(
          Array.isArray(reportData)
            ? reportData
            : []
        );

        setAnalyses(
          Array.isArray(analysisData)
            ? analysisData
            : []
        );

        // These are still localStorage-backed.
        setListings(
          getListings(user?.uid) || []
        );

        setClients(
          getClients(user?.uid) || []
        );

        setUsers(
          getAllUsers() || []
        );
      } catch (error) {
        console.error(
          'Dashboard data loading error:',
          error
        );

        if (!active) return;

        setProperties([]);
        setReports([]);
        setAnalyses([]);
        setListings(getListings(user?.uid) || []);
        setClients(getClients(user?.uid) || []);
        setUsers(getAllUsers() || []);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    if (user?.uid) {
      loadDashboard();
    }

    return () => {
      active = false;
    };
  }, [
    user?.uid,
    role,
    refreshKey,
  ]);

  const data = useMemo(
    () => ({
      properties,
      listings,
      reports,
      analyses,
      clients,
      users,
    }),
    [
      properties,
      listings,
      reports,
      analyses,
      clients,
      users,
    ]
  );

  const propertyRois = data.properties.map(roi);

  const recentProperty = [...data.properties].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  )[0];

  const recentReport = [...data.reports].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  )[0];

  const totalPortfolioValue =
    data.properties.reduce(
      (sum, p) =>
        sum + Number(p.currentValue || 0),
      0
    );

  const averageRoi =
    propertyRois.length > 0
      ? (
          propertyRois.reduce(
            (a, b) => a + b,
            0
          ) / propertyRois.length
        ).toFixed(2)
      : '0.00';

  const highestRoiProperty =
    data.properties.length
      ? data.properties.reduce(
          (best, p) =>
            roi(p) > roi(best) ? p : best,
          data.properties[0]
        )
      : null;

  const lowestExpenseProperty =
    data.properties.length
      ? data.properties.reduce(
          (best, p) =>
            Number(p.annualExpenses || 0) <
            Number(best.annualExpenses || 0)
              ? p
              : best,
          data.properties[0]
        )
      : null;

  const mostExpensiveProperty =
    data.properties.length
      ? data.properties.reduce(
          (best, p) =>
            Number(p.currentValue || 0) >
            Number(best.currentValue || 0)
              ? p
              : best,
          data.properties[0]
        )
      : null;

  const largestRentProperty =
    data.properties.length
      ? data.properties.reduce(
          (best, p) =>
            Number(
              p.annualRent ||
                p.annualRentalIncome ||
                0
            ) >
            Number(
              best.annualRent ||
                best.annualRentalIncome ||
                0
            )
              ? p
              : best,
          data.properties[0]
        )
      : null;

  const cards =
    role === 'Administrator'
      ? [
          [
            'Total Users',
            data.users.length,
          ],
          [
            'Total Properties',
            data.properties.length,
          ],
          [
            'Reports Generated',
            data.reports.length,
          ],
          [
            'Average ROI Across Platform',
            `${averageRoi}%`,
          ],
        ]
      : role === 'Property Agent'
        ? [
            [
              'Properties Managed',
              data.listings.length,
            ],
            [
              'Pending Listings',
              data.listings.filter(
                (p) =>
                  p.status === 'Pending' ||
                  p.status === 'Available'
              ).length,
            ],
            [
              'Completed Listings',
              data.listings.filter(
                (p) =>
                  p.status === 'Sold' ||
                  p.status === 'Under Contract'
              ).length,
            ],
            [
              'Properties Sold',
              data.listings.filter(
                (p) => p.status === 'Sold'
              ).length,
            ],
          ]
        : [
            [
              'My Portfolio Value',
              fmtNaira(
                totalPortfolioValue
              ),
            ],
            [
              'My Properties',
              data.properties.length,
            ],
            [
              'Average ROI',
              `${averageRoi}%`,
            ],
            [
              'Reports Generated',
              data.reports.length,
            ],
          ];

  const actions =
    role === 'Investor'
      ? [
          ['Available Investments', '/investments'],
          ['Open Calculator', '/calculator'],
          ['Generate Report', '/calculator'],
        ]
      : role === 'Administrator'
        ? [
            ['Manage Users', '/users'],
            ['View Properties', '/properties'],
            ['Analytics', '/analytics'],
          ]
        : [
            ['Add Listing', '/listings'],
            ['Add Client', '/clients'],
            ['View Reports', '/reports'],
          ];

  const activityItems = useMemo(() => {
    const items = [];

    data.properties.forEach((p) => {
      items.push({
        id: `prop-${p.id}`,
        type: 'property',
        label: `Property Added: ${
          p.propertyName || 'Unnamed Property'
        }`,
        date:
          p.createdAt || Date.now(),
      });
    });

    data.reports.forEach((r) => {
      items.push({
        id: `report-${r.id}`,
        type: 'report',
        label: `Report Generated: ${
          r.propertyName || 'Property'
        }`,
        date:
          r.createdAt || Date.now(),
      });
    });

    data.analyses.forEach((a) => {
      items.push({
        id: `analysis-${a.id}`,
        type: 'analysis',
        label: `Analysis Completed: ${
          a.propertyName || 'Property'
        }`,
        date:
          a.createdAt || Date.now(),
      });
    });

    return items
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      )
      .slice(0, 8);
  }, [
    data.properties,
    data.reports,
    data.analyses,
  ]);

  const portfolioSummary = [
    {
      label: 'TOTAL PORTFOLIO VALUE',
      value: fmtNaira(totalPortfolioValue),
      change: '+ 8.4%',
      footnote: '+$96,820 this year',
    },
    {
      label: 'TOTAL INVESTED',
      value: fmtNaira(
        data.properties.reduce(
          (sum, property) => sum + Number(property.purchasePrice || property.currentValue || 0),
          0
        )
      ),
      change: 'Across 8 properties',
      footnote: ' ',
    },
    {
      label: 'RENTAL INCOME',
      value: fmtNaira(
        data.properties.reduce(
          (sum, property) =>
            sum + Number(
              property.annualRent || property.annualRentalIncome || Number(property.monthlyRent || 0) * 12
            ),
          0
        )
      ),
      change: 'Past 12 months',
      footnote: ' ',
    },
    {
      label: 'AVERAGE YIELD',
      value: `${averageRoi}%`,
      change: '+0.6% vs last year',
      footnote: ' ',
    },
  ];

  const allocationData = [
    { label: 'Residential', value: 42, amount: '$524,370', color: 'gold' },
    { label: 'Commercial', value: 28, amount: '$349,580', color: 'amber' },
    { label: 'Mixed Use', value: 18, amount: '$224,730', color: 'slate' },
    { label: 'Land', value: 12, amount: '$149,820', color: 'blue' },
  ];

  return (
    <ProtectedLayout
      title="Dashboard"
      subtitle="Live information from your REITA workspace."
    >
      <section className="portfolio-overview">
        <p className="portfolio-kicker">PORTFOLIO OVERVIEW</p>
        <h1 className="portfolio-title">
          Good evening,{' '}
          {user?.fullName || user?.displayName || profile?.fullName || 'Jackson'}.
        </h1>
        <p className="portfolio-subtitle">
          Here&apos;s how your real-estate portfolio is performing.
        </p>
      </section>

      <section className="portfolio-summary-grid">
        {portfolioSummary.map((item) => (
          <article key={item.label} className="summary-stat">
            <p className="summary-label">{item.label}</p>
            <h3>{item.value}</h3>
            {item.change && item.change.startsWith('+') ? (
              <div className="summary-change-row">
                <span className="summary-badge">{item.change}</span>
                <span className="summary-footnote">{item.footnote}</span>
              </div>
            ) : (
              <div className="summary-meta-row">
                <span className="summary-footnote">{item.change}</span>
                <span className="summary-footnote">{item.footnote}</span>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="portfolio-panels">
        <div className="panel-card chart-panel">
          <div className="panel-header-row">
            <div>
              <p className="eyebrow">PERFORMANCE</p>
              <h4>Portfolio growth</h4>
            </div>
            <div className="range-switch" aria-label="Performance ranges">
              <button type="button" className="range-button active">1M</button>
              <button type="button" className="range-button">6M</button>
              <button type="button" className="range-button">1Y</button>
              <button type="button" className="range-button">All</button>
            </div>
          </div>

          <div className="portfolio-chart" aria-label="Portfolio growth chart">
            <div className="chart-axis left">
              <span>$1.3M</span>
              <span>$1.1M</span>
              <span>$900K</span>
              <span>$700K</span>
            </div>
            <div className="chart-body">
              <div className="chart-surface">
                <div className="chart-fill" />
              </div>
              <div className="chart-labels">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-card allocation-panel">
          <div className="panel-header-row allocation-header">
            <div>
              <p className="eyebrow">ALLOCATION</p>
              <h4>By property type</h4>
            </div>
            <button type="button" className="text-link">View details →</button>
          </div>

          <div className="allocation-bar" aria-label="Asset allocation">
            {allocationData.map((item) => (
              <span
                key={item.label}
                className={`allocation-segment ${item.color}`}
                style={{ width: `${item.value}%` }}
                title={`${item.label} ${item.value}%`}
              />
            ))}
          </div>

          <div className="allocation-list">
            {allocationData.map((item) => (
              <div key={item.label} className="allocation-row">
                <div className="allocation-name">
                  <span className={`dot ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                <div className="allocation-value">
                  <strong>{item.value}%</strong>
                  <span>{item.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bottom-row">
        <div className="panel-card activity-panel">
          <div className="panel-header-row simple-row">
            <div>
              <p className="eyebrow">RECENT ACTIVITY</p>
              <h4>Latest updates on your portfolio</h4>
            </div>
            <button type="button" className="ghost-action" onClick={() => navigate('/properties')}>
              View Properties
            </button>
          </div>

          {activityItems.length === 0 ? (
            <p className="muted">No activity yet. Add a property or generate a report to see activity here.</p>
          ) : (
            <ul className="timeline-list activity-timeline">
              {activityItems.map((item) => (
                <li key={item.id} className={`activity-${item.type}`}>
                  <span>{item.label}</span>
                  <time>{new Date(item.date).toLocaleDateString()}</time>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel-card quick-actions-panel">
          <div className="quick-action-row">
            <button type="button" className="ghost-action" onClick={() => navigate('/properties')}>View Properties</button>
            <button type="button" className="ghost-action" onClick={() => navigate('/reports')}>Generate Report</button>
            <button type="button" className="ghost-action" onClick={() => navigate('/properties')}>Add Property</button>
          </div>
        </div>
      </section>
    </ProtectedLayout>
  );
}