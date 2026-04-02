import { useEffect, useRef, useState } from 'react';
import { fetchMedicines, addMedicine, updateMedicine, deleteMedicine } from '../api/medicineApi';
import { fetchOrders, updateOrderStatus, updateOrderPaymentStatus, assignOrder } from '../api/orderApi';
import { fetchDeliveryPartners } from '../api/authApi';
import socket from '../socket';
import { getOrderReference } from '../utils/orderDisplay';

const NotificationPopup = ({ message, onClose }) => (
  <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: 'var(--green)', color: '#fff', padding: '15px 25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '15px' }}>
    <div style={{ fontWeight: 800 }}>New Order</div>
    <div style={{ fontSize: '0.86rem' }}>{message}</div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>x</button>
  </div>
);

const StatCards = ({ orders }) => {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((order) => order.status === 'pending').length;
  const revenue = orders.filter((order) => order.status === 'delivered').reduce((sum, order) => sum + order.totalPrice, 0);

  return (
    <div className="stats-row admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
      <div className="stat-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>{totalOrders}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Total Orders</div>
      </div>
      <div className="stat-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange)' }}>{pendingOrders}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Pending</div>
      </div>
      <div className="stat-card" style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--green)' }}>Rs.{revenue.toFixed(2)}</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Revenue</div>
      </div>
    </div>
  );
};

const ManageOrders = ({ orders, setOrders, partners }) => {
  const [currentFilter, setCurrentFilter] = useState('all');

  const filteredOrders = currentFilter === 'all' ? orders : orders.filter((order) => order.status === currentFilter);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status: updated.status, paymentStatus: updated.paymentStatus } : order)));
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleUpdatePayment = async (id, paymentStatus) => {
    try {
      const updated = await updateOrderPaymentStatus(id, paymentStatus);
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, paymentStatus: updated.paymentStatus, paidAt: updated.paidAt } : order)));
    } catch {
      alert('Failed to update payment status.');
    }
  };

  const handleAssign = async (orderId, partnerId) => {
    if (!partnerId) return;
    try {
      const updated = await assignOrder(orderId, partnerId);
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: updated.status, deliveryPartner: updated.deliveryPartner } : order)));
      alert('Delivery partner assigned.');
    } catch {
      alert('Failed to assign partner.');
    }
  };

  const sendWhatsApp = (order) => {
    const ownerWhatsApp = '919371493956';
    const itemLines = order.orderItems.map((item) => `  - ${item.name} x${item.quantity}`).join('\n');
    const msg = encodeURIComponent(`Order ID: ${getOrderReference(order)}\nName: ${order.customerName}\nAddress: ${order.customerAddress}\nItems:\n${itemLines}\nTotal: Rs.${order.totalPrice.toFixed(2)}`);
    window.open(`https://wa.me/${ownerWhatsApp}?text=${msg}`, '_blank');
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'packing', label: 'Packing' },
    { id: 'out', label: 'Out for Delivery' },
    { id: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="admin-section">
      <div className="admin-tab-strip" style={{ display: 'flex', gap: '5px', background: 'var(--green-pale)', borderRadius: '12px', padding: '5px', marginBottom: '20px', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setCurrentFilter(tab.id)}
            style={{
              flex: 1,
              padding: '10px',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: '10px',
              whiteSpace: 'nowrap',
              background: currentFilter === tab.id ? 'var(--green)' : 'transparent',
              color: currentFilter === tab.id ? '#fff' : 'var(--text)',
            }}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {filteredOrders.length === 0 ? (
          <div className="no-results">No orders found.</div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} style={{ background: 'var(--card)', border: '1.5px solid var(--border)', borderRadius: '15px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--green)' }}>{getOrderReference(order)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className={`status-${order.status}`} style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px' }}>{order.status}</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', background: order.paymentStatus === 'received' ? 'var(--green-soft)' : '#fff7dd', color: order.paymentStatus === 'received' ? 'var(--green-dark)' : '#9a6700' }}>
                    {order.paymentStatus === 'received' ? 'Payment Received' : 'Payment Pending'}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}><strong>{order.customerName}</strong> • {order.customerPhone}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '10px' }}>{order.customerAddress}</div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {order.prescriptionImage && (
                  <a href={order.prescriptionImage} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--blue)', fontWeight: 700, textDecoration: 'none' }}>
                    View Prescription
                  </a>
                )}
                {order.paymentScreenshot && (
                  <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#8a5a00', fontWeight: 700, textDecoration: 'none' }}>
                    View Payment Screenshot
                  </a>
                )}
              </div>

              <div style={{ background: '#f9f9f9', padding: '12px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '15px' }}>
                {order.orderItems.map((item, idx) => (
                  <div key={idx}>• {item.name} x {item.quantity} - Rs.{(item.price * item.quantity).toFixed(2)}</div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--green)' }}>Total: Rs.{order.totalPrice.toFixed(2)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'UPI / QR'}</div>
                  {order.paymentReference && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '4px' }}>Ref: {order.paymentReference}</div>}
                  {order.status === 'packing' && (
                    <div style={{ marginTop: '10px' }}>
                      <select onChange={(event) => handleAssign(order.id, event.target.value)} style={{ fontSize: '0.75rem', padding: '4px', borderRadius: '5px', border: '1px solid var(--border)' }} defaultValue="">
                        <option value="" disabled>Assign Partner</option>
                        {partners.map((partner) => (
                          <option key={partner._id} value={partner._id}>{partner.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => sendWhatsApp(order)} style={{ background: '#e7fbe9', color: '#1a7a4a', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>WhatsApp</button>
                  {order.paymentStatus !== 'received' ? (
                    <button onClick={() => handleUpdatePayment(order.id, 'received')} style={{ background: '#fff3cd', color: '#8a5a00', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Mark Paid</button>
                  ) : (
                    <button onClick={() => handleUpdatePayment(order.id, 'pending')} style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Reset Payment</button>
                  )}
                  {order.status === 'pending' && <button onClick={() => handleUpdateStatus(order.id, 'packing')} style={{ background: '#cce5ff', color: '#004085', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Pack</button>}
                  {order.status === 'packing' && <button onClick={() => handleUpdateStatus(order.id, 'out')} style={{ background: '#d4edda', color: '#155724', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Send Out</button>}
                  {order.status === 'out' && <button onClick={() => handleUpdateStatus(order.id, 'delivered')} style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '6px 12px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Delivered</button>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ManageProductsLayout = ({ products, setProducts }) => {
  const [isEditing, setIsEditing] = useState(null);
  const [form, setForm] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const normalizeForm = (value) => ({
    ...value,
    price: value.price ?? '',
    stock: value.stock ?? '',
    imageUrl: value.imageUrl ?? '',
    dosage: value.dosage ?? '',
    packQuantity: value.packQuantity ?? '',
    packUnit: value.packUnit ?? '',
  });

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEdit = (product) => {
    setForm(normalizeForm(product));
    setIsEditing(product.id);
    setSelectedFile(null);
    setPreviewUrl(product.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== undefined && form[key] !== null) {
          formData.append(key, form[key]);
        }
      });

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      if (isEditing) {
        const updated = await updateMedicine(isEditing, formData);
        setProducts(products.map((product) => (product.id === updated.id ? updated : product)));
      } else {
        const added = await addMedicine(formData);
        setProducts([...products, added]);
      }

      setIsEditing(null);
      setForm(normalizeForm({}));
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error) {
      console.error(error);
      alert('Error saving medicine.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await deleteMedicine(id);
      setProducts(products.filter((product) => product.id !== id));
    } catch {
      alert('Error deleting medicine.');
    }
  };

  return (
    <div className="admin-section">
      <h3 className="section-title">{isEditing ? `Edit Product: ${form.name}` : 'Add New Product'}</h3>
      <form onSubmit={handleSubmit} className="admin-product-form" style={{ background: 'var(--card)', padding: '20px', borderRadius: '15px', border: '1.5px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
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
        <input name="dosage" placeholder="Strength / Dosage" value={form.dosage || ''} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)' }}>Medicine Image</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid var(--border)', background: '#f7fbf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewUrl ? <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '1.2rem' }}>IMG</span>}
            </div>
            <label style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px dashed var(--green)', textAlign: 'center', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: 'var(--green)', background: 'var(--green-pale)' }}>
              {selectedFile ? 'Change Image' : 'Upload Image'}
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        <input name="packQuantity" type="number" min="0" placeholder="Pack Quantity" value={form.packQuantity || ''} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
        <input name="packUnit" placeholder="Pack Unit" value={form.packUnit || ''} onChange={handleChange} style={{ padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
        <textarea name="description" placeholder="Description / Use" value={form.description || ''} onChange={handleChange} required style={{ gridColumn: 'span 2', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)', minHeight: '80px' }} />
        <button type="submit" className="add-btn" style={{ gridColumn: 'span 2', padding: '15px' }}>{isEditing ? 'Save Changes' : 'Add Product'}</button>
      </form>

      <div style={{ marginTop: '24px', display: 'grid', gap: '14px' }}>
        {products.map((product) => (
          <div key={product.id} className="admin-product-row" style={{ display: 'grid', gridTemplateColumns: '96px 1fr auto', gap: '16px', alignItems: 'center', background: '#fff', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px' }}>
            <img src={product.imageUrl} alt={product.name} style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '14px', background: '#f7fbf8', border: '1px solid var(--border)' }} />
            <div>
              <div style={{ fontWeight: 800, color: 'var(--green-dark)' }}>{product.name}</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '4px' }}>
                {product.packQuantity ? `${product.packQuantity} ${product.packUnit || 'units'}` : (product.dosage || product.category)}
              </div>
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

function AdminDashboard() {
  const [activeView, setActiveView] = useState('summary');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [productData, orderData, partnerData] = await Promise.all([
          fetchMedicines(),
          fetchOrders(),
          fetchDeliveryPartners(),
        ]);
        setProducts(productData);
        setOrders(orderData);
        setPartners(partnerData);
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();

    socket.connect();
    socket.emit('join_admin_room');

    socket.on('new_order', (order) => {
      audioRef.current.play().catch(() => {});
      setOrders((prev) => [{ ...order, id: order.id, status: 'pending' }, ...prev]);
      setNotification(`${order.customerName} placed Rs.${order.totalPrice.toFixed(2)} order.`);
      setTimeout(() => setNotification(null), 5000);
    });

    socket.on('order_status_changed', ({ id, status }) => {
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)));
    });

    socket.on('order_payment_changed', ({ id, paymentStatus }) => {
      setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, paymentStatus } : order)));
    });

    return () => {
      socket.disconnect();
      socket.off('new_order');
      socket.off('order_status_changed');
      socket.off('order_payment_changed');
    };
  }, []);

  if (loading) {
    return <div className="text-center p-20"><h2>Loading Dashboard...</h2></div>;
  }

  return (
    <div className="main-content">
      {notification && <NotificationPopup message={notification} onClose={() => setNotification(null)} />}

      <h2 className="section-title" style={{ border: 'none', padding: 0, fontSize: '1.8rem' }}>Owner Dashboard</h2>
      <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '30px' }}>Manage your shop orders and inventory</div>

      <StatCards orders={orders} />

      <div className="admin-view-tabs" style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '2px solid var(--border)' }}>
        <button onClick={() => setActiveView('summary')} style={{ background: 'none', border: 'none', padding: '10px 0', marginRight: '20px', fontWeight: 800, cursor: 'pointer', color: activeView === 'summary' ? 'var(--green)' : 'var(--muted)', borderBottom: activeView === 'summary' ? '3px solid var(--green)' : 'none' }}>Manage Orders</button>
        <button onClick={() => setActiveView('inventory')} style={{ background: 'none', border: 'none', padding: '10px 0', fontWeight: 800, cursor: 'pointer', color: activeView === 'inventory' ? 'var(--green)' : 'var(--muted)', borderBottom: activeView === 'inventory' ? '3px solid var(--green)' : 'none' }}>Inventory</button>
      </div>

      <div className="admin-content">
        {activeView === 'summary' && <ManageOrders orders={orders} setOrders={setOrders} partners={partners} />}
        {activeView === 'inventory' && <ManageProductsLayout products={products} setProducts={setProducts} />}
      </div>
    </div>
  );
}

export default AdminDashboard;
