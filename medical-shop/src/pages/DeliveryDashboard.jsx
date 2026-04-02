import React, { useState, useEffect } from 'react';
import { fetchMyTasks, updateOrderStatus } from '../api/orderApi';
import { useAuth } from '../store/AuthContext';
import socket from '../socket';

function DeliveryDashboard() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const userRoomId = user?._id || user?.id;

    useEffect(() => {
        const loadTasks = async () => {
            try {
                const data = await fetchMyTasks();
                setTasks(data);
            } catch (err) {
                console.error("Error loading tasks:", err);
            } finally {
                setLoading(false);
            }
        };
        loadTasks();

        // Socket for real-time task notifications
        socket.connect();
        if (userRoomId) {
            socket.emit('join_user_room', userRoomId);
        }
        socket.on(`new_task_assigned`, (task) => {
            setTasks(prev => [task, ...prev]);
            alert(`New task assigned: ${task.customerName}`);
        });

        return () => {
            socket.off('new_task_assigned');
        };
    }, [userRoomId]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await updateOrderStatus(id, newStatus);
            setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
        } catch {
            alert("Failed to update status.");
        }
    };

    const openMaps = (address) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="text-center p-20"><h2>Loading Tasks...</h2></div>;

    const pendingTasks = tasks.filter(t => t.status !== 'delivered');
    const completedTasks = tasks.filter(t => t.status === 'delivered');

    return (
        <div className="main-content" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🛵</div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Delivery Panel</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>Welcome back, {user?.name}</p>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--green)' }}>📋 My Active Tasks ({pendingTasks.length})</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {pendingTasks.length === 0 ? (
                    <div className="no-results" style={{ padding: '40px' }}>No active deliveries. Chill time! ☕</div>
                ) : (
                    pendingTasks.map(task => (
                        <div key={task.id} style={{ background: 'var(--card)', padding: '20px', borderRadius: '15px', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--green)' }}>#{task.id?.slice(-6)}</span>
                                <span style={{ fontSize: '0.7rem', background: 'var(--green-pale)', color: 'var(--green)', padding: '3px 10px', borderRadius: '10px', fontWeight: 800 }}>{task.status.toUpperCase()}</span>
                            </div>

                            <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '5px' }}>{task.customerName}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '15px' }}>📍 {task.customerAddress}</div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                <a href={`tel:${task.customerPhone}`} style={{ textDecoration: 'none', background: '#e7fbe9', color: '#1a7a4a', padding: '12px', borderRadius: '10px', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                                    📞 Call Customer
                                </a>
                                <button onClick={() => openMaps(task.customerAddress)} style={{ background: '#e5f3ff', color: '#1a6abf', padding: '12px', borderRadius: '10px', border: 'none', textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}>
                                    🗺 Open Maps
                                </button>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f0f0f0', paddingTop: '15px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Payment</div>
                                    <div style={{ fontWeight: 800 }}>{task.paymentMethod === 'cod' ? '💵 COD: ₹' + task.totalPrice : '✅ Paid UPI'}</div>
                                </div>
                                <button 
                                    onClick={() => handleStatusUpdate(task.id, 'delivered')}
                                    style={{ background: 'var(--green)', color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
                                >
                                    ✅ Set Delivered
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {completedTasks.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '15px', color: 'var(--muted)' }}>✔️ Recently Completed</h3>
                    {completedTasks.slice(0, 3).map(task => (
                        <div key={task.id} style={{ padding: '10px', background: '#f9f9f9', borderRadius: '10px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                            <span>{task.customerName}</span>
                            <span style={{ color: 'var(--green)', fontWeight: 700 }}>Delivered</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DeliveryDashboard;
