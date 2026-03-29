import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';

function AnalyticsView() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE_URL}/api/orders/analytics/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setData(response.data);
            } catch (err) {
                console.error('Analytics error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="text-center p-20"><h2>Loading Analytics...</h2></div>;
    if (!data) return <div className="text-center p-20"><h2>No data available.</h2></div>;

    const COLORS = ['#1a7a4a', '#22a05a', '#f0920a', '#1a6abf', '#e03a3a'];

    return (
        <div className="main-content">
            <h2 className="section-title">Business Analytics 📊</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px', marginBottom: '40px' }}>
                {/* 1. Revenue Over Last 7 Days */}
                <div className="form-card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--green)' }}>Revenue Trend (Last 7 Days)</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={data.stats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="revenue" stroke="#1a7a4a" strokeWidth={3} activeDot={{ r: 8 }} name="Revenue (₹)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 2. Orders Count */}
                <div className="form-card" style={{ height: '400px' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--green)' }}>Orders Distributed</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart data={data.stats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" tick={{ fontSize: 10 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#22a05a" name="Total Orders" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 3. Top Sold Medicines */}
                <div className="form-card" style={{ height: '400px', gridColumn: 'span 2' }}>
                    <h3 style={{ marginBottom: '20px', color: 'var(--green)' }}>Top 5 Medicines (by Quantity)</h3>
                    <div style={{ display: 'flex', alignItems: 'center', height: '90%' }}>
                        <ResponsiveContainer width="60%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={data.topMedicines} 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} outerRadius={120} 
                                    paddingAngle={5} 
                                    dataKey="qty" nameKey="_id"
                                >
                                    {data.topMedicines.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.COLORS?.length || index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ padding: '20px', flex: 1 }}>
                            {data.topMedicines.map((m, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.9rem' }}>
                                    <span style={{ fontWeight: 700 }}>{m._id}</span>
                                    <span>{m.qty} sold</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AnalyticsView;
