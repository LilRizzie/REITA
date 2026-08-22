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

  return (
    <ProtectedLayout
      title="Dashboard"
      subtitle="Live information from your REITA workspace."
    >
      <section className="hero-panel premium-panel">
        <div>
          <p className="eyebrow">{role}</p>

          <h3>
            Welcome back,{' '}
            {profile?.fullName || 'User'}
          </h3>

          <p>
            Review the latest activity and
            continue where you left off.
          </p>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() =>
            setRefreshKey((value) => value + 1)
          }
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </section>

      <section className="stats-grid">
        {cards.map(([label, value]) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            change={
              loading
                ? 'Loading...'
                : 'Current data'
            }
          />
        ))}
      </section>

      {role === 'Investor' && (
        <section className="stats-grid">
          <StatCard
            label="Last Report Generated"
            value={
              recentReport
                ? new Date(
                    recentReport.createdAt
                  ).toLocaleDateString()
                : 'None yet'
            }
            change={
              recentReport?.propertyName ||
              'Generate an analysis'
            }
          />

          <StatCard
            label="Recent Analysis"
            value={
              data.analyses[0]?.propertyName ||
              'None yet'
            }
            change={
              data.analyses[0]
                ?.recommendation ||
              'Use Calculator'
            }
          />

          <StatCard
            label="Recent Property Added"
            value={
              recentProperty?.propertyName ||
              'None yet'
            }
            change={
              recentProperty?.location ||
              'Add your first property'
            }
          />
        </section>
      )}

      {data.properties.length > 0 && (
        <section className="glass-card panel-card">
          <p className="eyebrow">
            Quick insights
          </p>

          <h4>Portfolio highlights</h4>

          <div className="insight-grid">
            <div className="insight-item">
              <span>
                Highest Performing Property
              </span>

              <strong>
                {highestRoiProperty
                  ?.propertyName || '—'}
              </strong>

              <small>
                {highestRoiProperty
                  ? `${roi(
                      highestRoiProperty
                    ).toFixed(1)}% ROI`
                  : ''}
              </small>
            </div>

            <div className="insight-item">
              <span>Highest ROI</span>

              <strong>
                {propertyRois.length
                  ? `${Math.max(
                      ...propertyRois
                    ).toFixed(1)}%`
                  : '0%'}
              </strong>

              <small>
                {highestRoiProperty
                  ?.propertyName || ''}
              </small>
            </div>

            <div className="insight-item">
              <span>Lowest Expense</span>

              <strong>
                {lowestExpenseProperty
                  ? fmtNaira(
                      lowestExpenseProperty.annualExpenses
                    )
                  : '—'}
              </strong>

              <small>
                {lowestExpenseProperty
                  ?.propertyName || ''}
              </small>
            </div>

            <div className="insight-item">
              <span>Newest Property</span>

              <strong>
                {recentProperty
                  ?.propertyName || '—'}
              </strong>

              <small>
                {recentProperty
                  ? new Date(
                      recentProperty.createdAt
                    ).toLocaleDateString()
                  : ''}
              </small>
            </div>

            <div className="insight-item">
              <span>Most Expensive Property</span>

              <strong>
                {mostExpensiveProperty
                  ? fmtNaira(
                      mostExpensiveProperty.currentValue
                    )
                  : '—'}
              </strong>

              <small>
                {mostExpensiveProperty
                  ?.propertyName || ''}
              </small>
            </div>

            <div className="insight-item">
              <span>
                Largest Rental Income
              </span>

              <strong>
                {largestRentProperty
                  ? fmtNaira(
                      largestRentProperty.annualRent ||
                        largestRentProperty.annualRentalIncome
                    )
                  : '—'}
              </strong>

              <small>
                {largestRentProperty
                  ?.propertyName || ''}
              </small>
            </div>
          </div>
        </section>
      )}

      <section className="dashboard-grid-two">
        <div className="glass-card panel-card">
          <p className="eyebrow">
            Recent activity
          </p>

          <h4>Activity timeline</h4>

          {activityItems.length === 0 ? (
            <p className="muted">
              No activity yet. Add a property
              or generate a report to see
              activity here.
            </p>
          ) : (
            <ul className="timeline-list activity-timeline">
              {activityItems.map((item) => (
                <li
                  key={item.id}
                  className={`activity-${item.type}`}
                >
                  {item.label}

                  <span>
                    {new Date(
                      item.date
                    ).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="glass-card panel-card">
          <p className="eyebrow">
            Quick actions
          </p>

          <h4>Continue working</h4>

          <div className="action-stack">
            {actions.map(
              ([label, path]) => (
                <button
                  className="action-btn"
                  key={label}
                  onClick={() =>
                    navigate(path)
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </section>
    </ProtectedLayout>
  );
}