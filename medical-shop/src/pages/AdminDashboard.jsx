import { useEffect, useRef, useState } from 'react';
import { fetchMedicines, addMedicine, updateMedicine, deleteMedicine } from '../api/medicineApi';
import { fetchOrders, updateOrderStatus, assignOrder } from '../api/orderApi';
import { fetchDeliveryPartners } from '../api/authApi';
import socket from '../socket'; // Real-time socket

// --- Sub-Component: Notifications Popup ---
const NotificationPopup = ({ message, onClose }) => (
    <div className="notification-popup" style={{
        position: 'fixed', bottom: '20px', right: '20px', background: 'var(--green)', color: '#fff', 
        padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', 
        zIndex: 1000, display: 'flex', alignItems: 'center', gap: '15px', animation: 'slideIn 0.3s ease-out'
    }}>
        <div style={{ fontSize: '1.5rem' }}>🔔</div>
        <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>New Order Received!</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{message}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
    </div>
);

// --- Sub-Component: KPI Stat Cards ---
const StatCards = ({ orders }) => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const revenue = orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.totalPrice, 0);

    return (
        <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
            <div className="stat-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
                <div className="stat-num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>{totalOrders}</div>
                <div className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Total Orders</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
                <div className="stat-num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)' }}>{pendingOrders}</div>
                <div className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Pending</div>
            </div>
            <div className="stat-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
                <div className="stat-num" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>₹{revenue.toFixed(2)}</div>
                <div className="stat-label" style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Revenue</div>
            </div>
        </div>
    );
};

// --- Sub-Component: Manage Orders ---
const ManageOrders = ({ orders, setOrders, partners }) => {
    const [currentFilter, setCurrentFilter] = useState('all');
    
    const filteredOrders = currentFilter === 'all' 
        ? orders 
        : orders.filter(o => o.status === currentFilter);

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const updated = await updateOrderStatus(id, newStatus);
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: updated.status } : o));
        } catch {
            alert("Failed to update status.");
        }
    };

    const handleAssign = async (orderId, partnerId) => {
        if (!partnerId) return;
        try {
            const updated = await assignOrder(orderId, partnerId);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: updated.status, deliveryPartner: updated.deliveryPartner } : o));
            alert("Delivery Partner Assigned!");
        } catch {
            alert("Failed to assign partner.");
        }
    };

    const sendWhatsApp = (order) => {
        const OWNER_WHATSAPP = '919876543210';
        const itemLines = order.orderItems.map(i => `  • ${i.name} x${i.quantity}`).join('\n');
        const msg = encodeURIComponent(`📋 *Order ID: ${order.id}*\n👤 Name: ${order.customerName}\n📍 Addr: ${order.customerAddress}\n💊 Items:\n${itemLines}\n💰 Total: ₹${order.totalPrice.toFixed(2)}`);
        window.open(`https://wa.me/${OWNER_WHATSAPP}?text=${msg}`, '_blank');
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'packing', label: 'Packing' },
        { id: 'out', label: 'Out for Delivery' },
        { id: 'delivered', label: 'Delivered' },
    ];

    const statusLabels = {
        pending: 'Pending',
        packing: 'Packing',
        out: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
    };

    return (
        <div className="admin-section">
            <div className="order-tabs" style={{ display: 'flex', gap: '5px', background: 'var(--green-pale)', borderRadius: '12px', padding: '5px', marginBottom: '20px', overflowX: 'auto' }}>
                {tabs.map(tab => (
                    <div 
                        key={tab.id}
                        className={`order-tab ${currentFilter === tab.id ? 'active' : ''}`}
                        onClick={() => setCurrentFilter(tab.id)}
                        style={{ 
                            flex: 1, padding: '10px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', borderRadius: '10px', whiteSpace: 'nowrap',
                            background: currentFilter === tab.id ? 'var(--green)' : 'transparent',
                            color: currentFilter === tab.id ? '#fff' : 'var(--text)'
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            <div className="order-cards" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredOrders.length === 0 ? (
                    <div className="no-results">No orders found.</div>
                ) : (
                    filteredOrders.map(o => (
                        <div key={o.id} className="order-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green)' }}>{o.id}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(o.createdAt).toLocaleString()}</div>
                                </div>
                                <span className={`order-status status-${o.status}`} style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px' }}>
                                    {statusLabels[o.status] || o.status}
                                </span>
                            </div>
                            
                            <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>👤 <strong>{o.customerName}</strong> &nbsp; 📞 {o.customerPhone}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '12px' }}>📍 {o.customerAddress}</div>

                            {/* Prescription support */}
                            {o.prescriptionImage && (
                                <div style={{ marginBottom: '15px' }}>
                                    <a href={o.prescriptionImage} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        📄 View Prescription
                                    </a>
                                </div>
                            )}
                            
                            <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '15px' }}>
                                {o.orderItems.map((item, idx) => (
                                    <div key={idx}>• {item.name} × {item.quantity} — ₹{(item.price * item.quantity).toFixed(2)}</div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--green)' }}>Total: ₹{o.totalPrice.toFixed(2)}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{o.paymentMethod === 'cod' ? '💵 COD' : '📱 UPI'}</div>
                                    
                                    {/* Assignment UI */}
                                    {o.status === 'packing' && (
                                        <div style={{ marginTop: '10px' }}>
                                            <select 
                                                onChange={(e) => handleAssign(o.id, e.target.value)}
                                                style={{ fontSize: '0.75rem', padding: '4px', borderRadius: '5px', border: '1px solid var(--border)' }}
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Assign Partner</option>
                                                {partners && partners.map(p => (
                                                    <option key={p._id} value={p._id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button onClick={() => sendWhatsApp(o)} style={{ background: '#e7fbe9', color: '#1a7a4a', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>💬 WhatsApp</button>
                                    
                                    {o.status === 'pending' && <button onClick={() => handleUpdateStatus(o.id, 'packing')} style={{ background: '#cce5ff', color: '#004085', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>📦 Pack</button>}
                                    {o.status === 'packing' && <button onClick={() => handleUpdateStatus(o.id, 'out')} style={{ background: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>🛵 Send Out</button>}
                                    {o.status === 'out' && <button onClick={() => handleUpdateStatus(o.id, 'delivered')} style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>✅ Delivered</button>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// --- Sub-Component: Manage Products ---
const ManageProductsLayout = ({ products, setProducts }) => {
    const [isEditing, setIsEditing] = useState(null); 
    const [form, setForm] = useState({});

    const normalizeForm = (value) => ({
        ...value,
        price: value.price ?? '',
        stock: value.stock ?? '',
        imageUrl: value.imageUrl ?? '',
        dosage: value.dosage ?? '',
        packQuantity: value.packQuantity ?? '',
        packUnit: value.packUnit ?? '',
    });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleEdit = (p) => { setForm(normalizeForm(p)); setIsEditing(p.id); window.scrollTo({top: 0, behavior: 'smooth'}); };

    const buildPayload = () => ({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        packQuantity: form.packQuantity === '' ? null : Number(form.packQuantity),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = buildPayload();
            if (isEditing) {
                const updated = await updateMedicine(payload);
                setProducts(products.map(p => p.id === updated.id ? updated : p));
            } else {
                const added = await addMedicine(payload);
                setProducts([...products, added]);
            }
            setIsEditing(null);
            setForm(normalizeForm({}));
        } catch {
            alert("Error saving medicine.");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            await deleteMedicine(id);
            setProducts(products.filter(p => p.id !== id));
        } catch {
            alert("Error deleting medicine.");
        }
    };

    return (
        <div className="admin-section">
            <h3 className="section-title">{isEditing ? `Edit Product: ${form.name}` : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} style={{ background: 'var(--card)', padding: '20px', borderRadius: '15px', border: '1.5px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                <input name="name" placeholder="Medicine Name" value={form.name || ''} onChange={handleChange} required style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                <input name="price" type="number" step="0.01" placeholder="Price" value={form.price || ''} onChange={handleChange} required style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                <input name="stock" type="number" placeholder="Stock Qty" value={form.stock || ''} onChange={handleChange} required style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                <select name="category" value={form.category || ''} onChange={handleChange} required style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }}>
                    <option value="">Select Category</option>
                    <option value="tablet">Tablet</option>
                    <option value="syrup">Syrup</option>
                    <option value="capsule">Capsule</option>
                    <option value="cream">Cream</option>
                    <option value="drops">Drops</option>
                    <option value="injection">Injection</option>
                    <option value="other">Other</option>
                </select>
                <input name="dosage" placeholder="Strength / Dosage (e.g. 500 mg, 100 ml)" value={form.dosage || ''} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                <input name="imageUrl" placeholder="Medicine Image URL" value={form.imageUrl || ''} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                <input name="packQuantity" type="number" min="0" placeholder="Pack Quantity (e.g. 10)" value={form.packQuantity || ''} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                <input name="packUnit" placeholder="Pack Unit (e.g. tablets, capsules, ml, g)" value={form.packUnit || ''} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                <textarea name="description" placeholder="Description / Use" value={form.description || ''} onChange={handleChange} required style={{ gridColumn: 'span 2', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)', minHeight: '80px' }} />
                <button type="submit" className="add-btn" style={{ gridColumn: 'span 2', padding: '15px' }}>{isEditing ? 'Save Changes' : 'Add Product'}</button>
            </form>

            <div style={{ marginTop: '24px', display: 'grid', gap: '14px' }}>
                {products.map((product) => (
                    <div key={product.id} style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '16px', alignItems: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px' }}>
                        <img
                            src={product.imageUrl || `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" rx="20" fill="#eaf7f0"/><text x="60" y="70" font-size="44" text-anchor="middle">${product.category === 'syrup' ? '🧴' : product.category === 'capsule' ? '🟡' : product.category === 'injection' ? '💉' : '💊'}</text></svg>`)}`}
                            alt={product.name}
                            style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '14px', background: '#f7fbf8', border: '1px solid var(--border)' }}
                        />
                        <div>
                            <div style={{ fontWeight: 800, color: 'var(--green-dark)' }}>{product.name}</div>
                            <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '4px' }}>
                                {product.packQuantity ? `${product.packQuantity} ${product.packUnit || (product.category === 'capsule' ? 'capsules' : product.category === 'tablet' ? 'tablets' : 'units')}` : (product.dosage || product.category)}
                            </div>
                            {product.dosage && <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '4px' }}>Strength: {product.dosage}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={() => handleEdit(product)} className="med-link-btn">Edit</button>
                            <button type="button" onClick={() => handleDelete(product.id)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: '14px', padding: '10px 14px', fontWeight: 800 }}>Delete</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Main Admin Dashboard Component ---
function AdminDashboard() {
    const [activeView, setActiveView] = useState('summary'); 
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [partners, setPartners] = useState([]); // Added partners state
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            try {
                const [pData, oData, partData] = await Promise.all([
                    fetchMedicines(), 
                    fetchOrders(), 
                    fetchDeliveryPartners() // Fetch partners
                ]);
                setProducts(pData);
                setOrders(oData.map(o => ({...o, id: o._id})));
                setPartners(partData);
            } catch (err) {
                console.error("Dashboard error:", err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();

        // --- Socket Integration ---
        socket.connect();
        socket.emit('join_admin_room');

        socket.on('new_order', (order) => {
            // 1. Play sound
            audioRef.current.play().catch(() => console.log('Sound blocked by browser'));
            // 2. Add to list
            setOrders(prev => [{...order, id: order.id, status: 'pending'}, ...prev]);
            // 3. Show notification
            setNotification(`${order.customerName} placed ₹${order.totalPrice.toFixed(2)} order.`);
            setTimeout(() => setNotification(null), 5000);
        });

        socket.on('order_status_changed', ({id, status}) => {
            setOrders(prev => prev.map(o => o.id === id ? {...o, status} : o));
        });

        return () => {
            socket.disconnect();
            socket.off('new_order');
            socket.off('order_status_changed');
        };
    }, []);

    if (loading) return <div className="text-center p-20"><h2>Loading Dashboard...</h2></div>;

    return (
        <div className="main-content">
            {notification && <NotificationPopup message={notification} onClose={() => setNotification(null)} />}
            
            <h2 className="section-title" style={{ border: 'none', padding: 0, fontSize: '1.8rem' }}>📊 Owner Dashboard</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '30px' }}>Manage your shop orders and inventory</div>
            
            <StatCards orders={orders} />

            <div className="admin-nav" style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid var(--border)' }}>
                <button onClick={() => setActiveView('summary')} style={{ background: 'none', border: 'none', padding: '10px 0', marginRight: '20px', fontWeight: 800, cursor: 'pointer', color: activeView === 'summary' ? 'var(--green)' : 'var(--muted)', borderBottom: activeView === 'summary' ? '3px solid var(--green)' : 'none' }}>📦 Manage Orders</button>
                <button onClick={() => setActiveView('inventory')} style={{ background: 'none', border: 'none', padding: '10px 0', fontWeight: 800, cursor: 'pointer', color: activeView === 'inventory' ? 'var(--green)' : 'var(--muted)', borderBottom: activeView === 'inventory' ? '3px solid var(--green)' : 'none' }}>💊 Inventory</button>
            </div>

            <div className="admin-content">
                {activeView === 'summary' && <ManageOrders orders={orders} setOrders={setOrders} partners={partners} />}
                {activeView === 'inventory' && <ManageProductsLayout products={products} setProducts={setProducts} />}
            </div>
        </div>
    );
}

export default AdminDashboard;
