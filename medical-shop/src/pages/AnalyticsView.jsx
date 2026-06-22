import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { fetchAnalyticsStats } from '../api/orderApi';
import { useAuth } from '../store/AuthContext';
import { getOrderReference } from '../utils/orderDisplay';

const currency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;
const chartColors = ['#467cff', '#39d0c8', '#62e991', '#f3b44d', '#ff7d7d'];

function AnalyticsChartCard({ title, subtitle, children }) {
  return (
    <section className="premium-surface-card premium-chart-card">
      <div className="premium-section-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="premium-chart-stage">{children}</div>
    </section>
  );
}

function AnalyticsView() {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const loadAnalytics = async () => {
      setLoading(true);
      setError('');

      try {
        const analytics = await fetchAnalyticsStats();
        setData(analytics);
      } catch (fetchError) {
        setError(fetchError?.response?.data?.message || fetchError?.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [isLoggedIn, user?.role]);

  const summaryCards = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        value: String(data.summary?.totalOrders || 0),
        label: 'total orders',
      },
      {
        value: currency(data.summary?.totalRevenue || 0),
        label: 'all-time GMV',
      },
      {
        value: currency(data.summary?.deliveredRevenue || 0),
        label: 'delivered revenue',
      },
      {
        value: String(data.summary?.pendingPayments || 0),
        label: 'pending payments',
      },
    ];
  }, [data]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'admin') {
    return (
      <PremiumPageShell
        eyebrow="Restricted"
        title="Analytics is available only for admin users."
        description="Sign in with the owner account to review revenue trends, status flow, and medicine demand."
      >
        <section className="premium-empty-state">
          <div className="premium-empty-icon">A</div>
          <h2>Access needed</h2>
          <p>The analytics dashboard is protected because it contains business performance data.</p>
        </section>
      </PremiumPageShell>
    );
  }

  return (
    <PremiumPageShell
      eyebrow="Analytics"
      title="Read the business in real time, not through a dated admin screen."
      description="Revenue, order velocity, payment health, and top-selling medicines are surfaced in a cleaner operational dashboard designed to feel as premium as the customer experience."
      stats={summaryCards}
      sideContent={
        <div className="premium-highlight-panel">
          <h3>What changed</h3>
          <ul className="premium-bullet-list">
            <li>Analytics now uses the authenticated API helper instead of hand-rolled localStorage token logic.</li>
            <li>The backend response includes summary cards, status distribution, and recent order context.</li>
            <li>Every state now has better loading and error handling instead of a bare fallback screen.</li>
          </ul>
        </div>
      }
    >
      {loading ? (
        <section className="premium-empty-state">
          <div className="premium-empty-icon">...</div>
          <h2>Loading analytics</h2>
          <p>Pulling revenue trends, medicine demand, and order status distribution.</p>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="premium-note-banner is-danger">{error}</section>
      ) : null}

      {!loading && !error && data ? (
        <>
          <section className="premium-grid-three">
            {(data.statusBreakdown || []).map((item, index) => (
              <article key={item.status} className="premium-surface-card premium-ops-stat-card">
                <span
                  className="premium-ops-stat-accent"
                  style={{ background: chartColors[index % chartColors.length] }}
                />
                <strong>{item.count}</strong>
                <h3>{String(item.status || 'pending').replace(/\b\w/g, (char) => char.toUpperCase())}</h3>
                <p>Orders currently in this stage.</p>
              </article>
            ))}
          </section>

          <div className="premium-grid-two premium-analytics-layout">
            <AnalyticsChartCard
              title="Revenue Trend"
              subtitle="Last 7 days of recorded order revenue."
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(88, 121, 181, 0.18)" />
                  <XAxis dataKey="_id" stroke="#6880ae" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6880ae" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#467cff"
                    strokeWidth={3}
                    activeDot={{ r: 7 }}
                    name="Revenue"
                  />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsChartCard>

            <AnalyticsChartCard
              title="Order Volume"
              subtitle="Daily order count across the last 7 days."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(88, 121, 181, 0.18)" />
                  <XAxis dataKey="_id" stroke="#6880ae" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6880ae" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#39d0c8" radius={[12, 12, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsChartCard>
          </div>

          <div className="premium-grid-two premium-analytics-layout">
            <AnalyticsChartCard
              title="Top Medicines"
              subtitle="Highest quantity sold across all recorded orders."
            >
              <div className="premium-pie-layout">
                <div className="premium-pie-stage">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.topMedicines}
                        dataKey="qty"
                        nameKey="_id"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={112}
                        paddingAngle={4}
                      >
                        {(data.topMedicines || []).map((entry, index) => (
                          <Cell key={`${entry._id || 'medicine'}-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="premium-list-stack premium-chart-list">
                  {(data.topMedicines || []).map((medicine, index) => (
                    <article key={medicine._id || index} className="premium-support-card">
                      <strong>{medicine._id}</strong>
                      <span>{medicine.qty} sold</span>
                    </article>
                  ))}
                </div>
              </div>
            </AnalyticsChartCard>

            <section className="premium-surface-card">
              <div className="premium-section-header">
                <div>
                  <h2>Recent Orders</h2>
                  <p>Latest order activity for quick operational context.</p>
                </div>
              </div>

              <div className="premium-list-stack">
                {(data.recentOrders || []).map((order) => (
                  <article key={order.id} className="premium-order-mini-card">
                    <div className="premium-track-header">
                      <strong>{getOrderReference(order)}</strong>
                      <span className="premium-soft-badge">{order.status}</span>
                    </div>
                    <p className="premium-meta-copy">
                      {order.customerName} • {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <div className="premium-between-row">
                      <span className="premium-muted">{order.paymentStatus}</span>
                      <strong>{currency(order.totalPrice)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </PremiumPageShell>
  );
}

export default AnalyticsView;
