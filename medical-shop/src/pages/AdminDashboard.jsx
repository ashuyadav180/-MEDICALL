import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { fetchMedicines, addMedicine, updateMedicine, deleteMedicine } from '../api/medicineApi';
import { fetchOrders, updateOrderStatus, updateOrderPaymentStatus, assignOrder } from '../api/orderApi';
import { fetchDeliveryPartners } from '../api/authApi';
import { useAuth } from '../store/AuthContext';
import socket from '../socket';
import { getOrderReference } from '../utils/orderDisplay';
import { buildPackLabel, getMedicineImage } from '../utils/medicineDisplay';

const currency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;
const isFallbackProduct = (product) => String(product?.id || '').startsWith('fallback-');

const NotificationPopup = ({ message, onClose }) => (
  <div className="premium-toast">
    <div>
      <strong>New order received</strong>
      <p>{message}</p>
    </div>
    <button type="button" onClick={onClose} aria-label="Close notification">
      x
    </button>
  </div>
);

const statusLabelMap = {
  pending: 'Pending',
  packing: 'Packing',
  out: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function AdminStatCards({ orders, products, partners }) {
  const deliveredRevenue = orders
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);

  const statCards = [
    { value: String(orders.length), label: 'orders in system' },
    { value: String(orders.filter((order) => order.status === 'pending').length), label: 'pending orders' },
    { value: currency(deliveredRevenue), label: 'delivered revenue' },
    { value: String(products.length), label: 'active medicines' },
    { value: String(partners.length), label: 'delivery partners' },
  ];

  return (
    <section className="premium-grid-three premium-admin-stat-grid">
      {statCards.map((stat) => (
        <article key={stat.label} className="premium-surface-card premium-ops-stat-card">
          <strong>{stat.value}</strong>
          <h3>{stat.label}</h3>
          <p>Live operating snapshot from inventory and order data.</p>
        </article>
      ))}
    </section>
  );
}

function ManageOrders({ orders, setOrders, partners, setNotice, setDashboardError }) {
  const [currentFilter, setCurrentFilter] = useState('all');

  const filteredOrders = currentFilter === 'all'
    ? orders
    : orders.filter((order) => order.status === currentFilter);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updated = await updateOrderStatus(id, newStatus);
      setOrders((current) =>
        current.map((order) =>
          order.id === id
            ? { ...order, status: updated.status, paymentStatus: updated.paymentStatus, deliveredAt: updated.deliveredAt }
            : order
        )
      );
      setNotice(`Order ${getOrderReference(updated)} moved to ${statusLabelMap[updated.status] || updated.status}.`);
      setDashboardError('');
    } catch (error) {
      setDashboardError(error?.response?.data?.message || error?.message || 'Failed to update order status.');
    }
  };

  const handleUpdatePayment = async (id, paymentStatus) => {
    try {
      const updated = await updateOrderPaymentStatus(id, paymentStatus);
      setOrders((current) =>
        current.map((order) =>
          order.id === id
            ? { ...order, paymentStatus: updated.paymentStatus, paidAt: updated.paidAt }
            : order
        )
      );
      setNotice(`Payment status updated for ${getOrderReference(updated)}.`);
      setDashboardError('');
    } catch (error) {
      setDashboardError(error?.response?.data?.message || error?.message || 'Failed to update payment status.');
    }
  };

  const handleAssign = async (orderId, partnerId) => {
    if (!partnerId) {
      return;
    }

    try {
      const updated = await assignOrder(orderId, partnerId);
      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? { ...order, status: updated.status, deliveryPartner: updated.deliveryPartner }
            : order
        )
      );
      const assignedPartner = partners.find((partner) => partner._id === partnerId)?.name || 'delivery partner';
      setNotice(`Assigned ${getOrderReference(updated)} to ${assignedPartner}.`);
      setDashboardError('');
    } catch (error) {
      setDashboardError(error?.response?.data?.message || error?.message || 'Failed to assign delivery partner.');
    }
  };

  const sendWhatsApp = (order) => {
    const ownerWhatsApp = '919371493956';
    const itemLines = order.orderItems
      .map((item) => `- ${item.name} x${item.quantity}`)
      .join('\n');
    const msg = encodeURIComponent(
      `Order ID: ${getOrderReference(order)}\nName: ${order.customerName}\nAddress: ${order.customerAddress}\nItems:\n${itemLines}\nTotal: ${currency(order.totalPrice)}`
    );
    window.open(`https://wa.me/${ownerWhatsApp}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'packing', label: 'Packing' },
    { id: 'out', label: 'Out for delivery' },
    { id: 'delivered', label: 'Delivered' },
  ];

  return (
    <section className="premium-surface-card">
      <div className="premium-section-header">
        <div>
          <h2>Manage Orders</h2>
          <p>Review prescriptions, confirm payments, assign riders, and move orders through fulfillment.</p>
        </div>
      </div>

      <div className="premium-filter-row">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`premium-filter-pill ${currentFilter === tab.id ? 'is-active' : ''}`}
            onClick={() => setCurrentFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="premium-empty-state premium-empty-compact">
          <div className="premium-empty-icon">0</div>
          <h2>No orders found</h2>
          <p>The current filter does not have matching orders yet.</p>
        </div>
      ) : (
        <div className="premium-list-stack">
          {filteredOrders.map((order) => (
            <article key={order.id} className="premium-surface-card premium-admin-order-card">
              <div className="premium-track-header">
                <div>
                  <strong>{getOrderReference(order)}</strong>
                  <p className="premium-meta-copy">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="premium-inline-actions">
                  <span className={`premium-soft-badge ${order.status === 'delivered' ? 'is-success' : 'is-warning'}`}>
                    {statusLabelMap[order.status] || order.status}
                  </span>
                  <span className={`premium-soft-badge ${order.paymentStatus === 'received' ? 'is-success' : 'is-warning'}`}>
                    {order.paymentStatus === 'received' ? 'Payment received' : 'Payment pending'}
                  </span>
                </div>
              </div>

              <div className="premium-admin-order-grid">
                <div>
                  <h3>{order.customerName}</h3>
                  <p className="premium-meta-copy">{order.customerPhone}</p>
                  <p className="premium-meta-copy">{order.customerAddress}</p>
                </div>
                <div className="premium-order-finance">
                  <strong>{currency(order.totalPrice)}</strong>
                  <span>{order.paymentMethod === 'cod' ? 'Cash on delivery' : 'UPI / QR payment'}</span>
                  {order.paymentReference ? <span>Ref: {order.paymentReference}</span> : null}
                </div>
              </div>

              <div className="premium-item-summary-list">
                {order.orderItems.map((item, index) => (
                  <div key={`${order.id}-${index}`} className="premium-item-summary-row">
                    <span>{item.name}</span>
                    <span>{item.quantity} x {currency(item.price)}</span>
                  </div>
                ))}
              </div>

              <div className="premium-inline-actions">
                {order.prescriptionImage ? (
                  <a href={order.prescriptionImage} target="_blank" rel="noreferrer" className="premium-secondary-btn">
                    View Prescription
                  </a>
                ) : null}
                {order.paymentScreenshot ? (
                  <a href={order.paymentScreenshot} target="_blank" rel="noreferrer" className="premium-secondary-btn">
                    View Payment Proof
                  </a>
                ) : null}
                <button type="button" className="premium-ghost-btn" onClick={() => sendWhatsApp(order)}>
                  Send WhatsApp
                </button>
                {order.paymentStatus !== 'received' ? (
                  <button type="button" className="premium-ghost-btn" onClick={() => handleUpdatePayment(order.id, 'received')}>
                    Mark Paid
                  </button>
                ) : (
                  <button type="button" className="premium-ghost-btn" onClick={() => handleUpdatePayment(order.id, 'pending')}>
                    Reset Payment
                  </button>
                )}
                {order.status === 'pending' ? (
                  <button type="button" className="premium-cta" onClick={() => handleUpdateStatus(order.id, 'packing')}>
                    Move to Packing
                  </button>
                ) : null}
                {order.status === 'packing' ? (
                  <>
                    <select
                      className="premium-select premium-inline-select"
                      defaultValue=""
                      onChange={(event) => handleAssign(order.id, event.target.value)}
                    >
                      <option value="" disabled>
                        Assign Partner
                      </option>
                      {partners.map((partner) => (
                        <option key={partner._id} value={partner._id}>
                          {partner.name}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="premium-cta" onClick={() => handleUpdateStatus(order.id, 'out')}>
                      Send Out
                    </button>
                  </>
                ) : null}
                {order.status === 'out' ? (
                  <button type="button" className="premium-cta" onClick={() => handleUpdateStatus(order.id, 'delivered')}>
                    Mark Delivered
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ManageProductsLayout({ products, setProducts, setNotice, setDashboardError }) {
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleEdit = (product) => {
    setForm(normalizeForm(product));
    setIsEditing(product.id);
    setSelectedFile(null);
    setPreviewUrl(product.imageUrl || getMedicineImage(product));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetEditor = () => {
    setIsEditing(null);
    setForm(normalizeForm({}));
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const buildMedicineFormData = (medicine) => {
    const formData = new FormData();
    [
      'name',
      'price',
      'description',
      'manufacturer',
      'sourceName',
      'sourceUrl',
      'imageUrl',
      'dosage',
      'packQuantity',
      'packUnit',
      'category',
      'stock',
    ].forEach((key) => {
      const value = medicine[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    return formData;
  };

  const handleCreateFromFallback = async (product) => {
    try {
      const added = await addMedicine(buildMedicineFormData(product));
      setProducts((current) => current.map((item) => (item.id === product.id ? added : item)));
      setNotice(`${added.name} is now saved in backend inventory.`);
      setDashboardError('');
    } catch (error) {
      setDashboardError(error?.response?.data?.message || error?.message || 'Error saving fallback medicine to backend.');
    }
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
        setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)));
        setNotice(`Updated ${updated.name}.`);
      } else {
        const added = await addMedicine(formData);
        setProducts((current) => [...current, added]);
        setNotice(`Added ${added.name} to inventory.`);
      }

      setDashboardError('');
      resetEditor();
    } catch (error) {
      setDashboardError(error?.response?.data?.message || error?.message || 'Error saving medicine.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this medicine from inventory?')) {
      return;
    }

    try {
      await deleteMedicine(id);
      setProducts((current) => current.filter((product) => product.id !== id));
      setNotice('Medicine removed from inventory.');
      setDashboardError('');
    } catch (error) {
      setDashboardError(error?.response?.data?.message || error?.message || 'Error deleting medicine.');
    }
  };

  return (
    <section className="premium-grid-two premium-admin-inventory-layout">
      <section className="premium-form-panel">
        <div className="premium-section-header">
          <div>
            <h2>{isEditing ? `Edit ${form.name}` : 'Add New Medicine'}</h2>
            <p>Manage pricing, stock, pack details, and polished medicine imagery from one place.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="premium-form-grid">
          <div className="premium-form-split">
            <div className="premium-field">
              <label htmlFor="product-name">Medicine Name</label>
              <input id="product-name" name="name" value={form.name || ''} onChange={handleChange} required className="premium-input" />
            </div>
            <div className="premium-field">
              <label htmlFor="product-category">Category</label>
              <select id="product-category" name="category" value={form.category || ''} onChange={handleChange} required className="premium-select">
                <option value="">Select Category</option>
                <option value="tablet">Tablet</option>
                <option value="syrup">Syrup</option>
                <option value="capsule">Capsule</option>
                <option value="cream">Cream</option>
                <option value="drops">Drops</option>
                <option value="injection">Injection</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="premium-form-split">
            <div className="premium-field">
              <label htmlFor="product-price">Price</label>
              <input id="product-price" name="price" type="number" step="0.01" value={form.price || ''} onChange={handleChange} required className="premium-input" />
            </div>
            <div className="premium-field">
              <label htmlFor="product-stock">Stock Quantity</label>
              <input id="product-stock" name="stock" type="number" value={form.stock || ''} onChange={handleChange} required className="premium-input" />
            </div>
          </div>

          <div className="premium-form-split">
            <div className="premium-field">
              <label htmlFor="product-dosage">Strength / Dosage</label>
              <input id="product-dosage" name="dosage" value={form.dosage || ''} onChange={handleChange} className="premium-input" />
            </div>
            <div className="premium-field">
              <label htmlFor="product-pack-quantity">Pack Quantity</label>
              <input id="product-pack-quantity" name="packQuantity" type="number" min="0" value={form.packQuantity || ''} onChange={handleChange} className="premium-input" />
            </div>
          </div>

          <div className="premium-form-split">
            <div className="premium-field">
              <label htmlFor="product-pack-unit">Pack Unit</label>
              <input id="product-pack-unit" name="packUnit" value={form.packUnit || ''} onChange={handleChange} className="premium-input" />
            </div>
            <div className="premium-field">
              <label htmlFor="product-image">Medicine Image</label>
              <label className="premium-upload-panel premium-upload-inline" htmlFor="product-image">
                <span>{selectedFile ? selectedFile.name : 'Upload image from your device'}</span>
                <input id="product-image" type="file" accept="image/*" onChange={handleFileChange} hidden />
              </label>
            </div>
          </div>

          <div className="premium-field">
            <label htmlFor="product-description">Description / Use</label>
            <textarea id="product-description" name="description" value={form.description || ''} onChange={handleChange} required className="premium-textarea" />
          </div>

          <div className="premium-inline-actions">
            <button type="submit" className="premium-cta">
              {isEditing ? 'Save Changes' : 'Add Medicine'}
            </button>
            {isEditing ? (
              <button type="button" className="premium-secondary-btn" onClick={resetEditor}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="premium-upload-preview">
          <div className="premium-upload-preview-media">
            <img src={previewUrl || getMedicineImage(form)} alt={form.name || 'Medicine preview'} />
          </div>
          <div>
            <strong>{form.name || 'Preview'}</strong>
            <p className="premium-meta-copy">{buildPackLabel(form)}</p>
          </div>
        </div>
      </section>

      <section className="premium-surface-card">
        <div className="premium-section-header">
          <div>
            <h2>Inventory Library</h2>
            <p>Review the live catalog with richer fallback imagery for tablets, syrups, capsules, and more.</p>
          </div>
        </div>

        <div className="premium-list-stack premium-admin-product-list">
          {products.map((product) => (
            <article key={product.id} className="premium-admin-product-row">
              <div className="premium-admin-product-media">
                <img
                  src={getMedicineImage(product)}
                  alt={product.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = getMedicineImage({ ...product, imageUrl: '' });
                  }}
                />
              </div>

              <div className="premium-admin-product-copy">
                <strong>{product.name}</strong>
                <p className="premium-meta-copy">{buildPackLabel(product)}</p>
                <div className="premium-inline-actions">
                  <span className="premium-pill">{product.category || 'other'}</span>
                  <span className="premium-pill">{currency(product.price)}</span>
                  <span className="premium-pill">{product.stock} in stock</span>
                </div>
          </div>

          <div className="premium-inline-actions">
                {isFallbackProduct(product) ? (
                  <button type="button" className="premium-cta" onClick={() => handleCreateFromFallback(product)}>
                    Add to Backend
                  </button>
                ) : (
                  <>
                    <button type="button" className="premium-secondary-btn" onClick={() => handleEdit(product)}>
                      Edit
                    </button>
                    <button type="button" className="premium-ghost-btn premium-danger-btn" onClick={() => handleDelete(product.id)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

function AdminDashboard() {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const [activeView, setActiveView] = useState('summary');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [notice, setNotice] = useState('');
  const audioRef = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'admin') {
      setLoading(false);
      return undefined;
    }

    const loadDashboardData = async () => {
      setLoading(true);
      setDashboardError('');

      try {
        const [productResult, orderResult, partnerResult] = await Promise.allSettled([
          fetchMedicines(),
          fetchOrders(),
          fetchDeliveryPartners(),
        ]);

        if (productResult.status === 'fulfilled') {
          setProducts(productResult.value);
        }

        if (orderResult.status === 'fulfilled') {
          setOrders(orderResult.value);
        }

        if (partnerResult.status === 'fulfilled') {
          setPartners(partnerResult.value);
        }

        if (productResult.status === 'rejected' || orderResult.status === 'rejected' || partnerResult.status === 'rejected') {
          setDashboardError(
            orderResult.reason?.response?.data?.message ||
            productResult.reason?.response?.data?.message ||
            partnerResult.reason?.response?.data?.message ||
            orderResult.reason?.message ||
            productResult.reason?.message ||
            partnerResult.reason?.message ||
            'Failed to load part of the admin dashboard.'
          );
        }
      } catch (error) {
        setDashboardError(error?.response?.data?.message || error?.message || 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    socket.connect();
    socket.emit('join_admin_room');

    const handleNewOrder = (order) => {
      audioRef.current.play().catch(() => {});
      setOrders((current) => [{ ...order, id: order.id, status: order.status || 'pending' }, ...current]);
      setNotification(`${order.customerName} placed an order worth ${currency(order.totalPrice)}.`);
      setTimeout(() => setNotification(null), 5000);
    };

    const handleStatusChanged = ({ id, status }) => {
      setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)));
    };

    const handlePaymentChanged = ({ id, paymentStatus }) => {
      setOrders((current) => current.map((order) => (order.id === id ? { ...order, paymentStatus } : order)));
    };

    socket.on('new_order', handleNewOrder);
    socket.on('order_status_changed', handleStatusChanged);
    socket.on('order_payment_changed', handlePaymentChanged);

    return () => {
      socket.disconnect();
      socket.off('new_order', handleNewOrder);
      socket.off('order_status_changed', handleStatusChanged);
      socket.off('order_payment_changed', handlePaymentChanged);
    };
  }, [isLoggedIn, user?.role]);

  const heroStats = useMemo(() => ([
    { value: String(orders.length), label: 'orders managed' },
    { value: String(products.length), label: 'medicines tracked' },
    { value: String(partners.length), label: 'partners available' },
  ]), [orders.length, partners.length, products.length]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'admin') {
    return (
      <PremiumPageShell
        eyebrow="Restricted"
        title="Only admin users can access the owner dashboard."
        description="Sign in with the owner account to manage medicines, payments, delivery assignment, and real-time orders."
      >
        <section className="premium-empty-state">
          <div className="premium-empty-icon">A</div>
          <h2>Owner access only</h2>
          <p>This workspace contains protected business controls and live operational data.</p>
        </section>
      </PremiumPageShell>
    );
  }

  return (
    <PremiumPageShell
      eyebrow="Owner Dashboard"
      title="Run the store with the same precision and polish customers feel on the storefront."
      description="Inventory, payments, fulfillment, and new order activity now live inside one cleaner operational layer instead of scattered legacy panels."
      stats={heroStats}
      sideContent={
        <div className="premium-highlight-panel">
          <h3>Operational upgrade</h3>
          <ul className="premium-bullet-list">
            <li>Live socket notifications still fire for new orders, status changes, and payment updates.</li>
            <li>Order management and inventory editing now share the same premium form and card system.</li>
            <li>Medicine previews use the upgraded fallback artwork so missing images no longer look broken.</li>
          </ul>
        </div>
      }
    >
      {notification ? <NotificationPopup message={notification} onClose={() => setNotification(null)} /> : null}
      {notice ? <section className="premium-note-banner is-success">{notice}</section> : null}
      {dashboardError ? <section className="premium-note-banner is-danger">{dashboardError}</section> : null}

      {loading ? (
        <section className="premium-empty-state">
          <div className="premium-empty-icon">...</div>
          <h2>Loading owner dashboard</h2>
          <p>Syncing inventory, orders, and delivery partner availability.</p>
        </section>
      ) : (
        <>
          <AdminStatCards orders={orders} products={products} partners={partners} />

          <section className="premium-surface-card">
            <div className="premium-filter-row">
              <button
                type="button"
                className={`premium-filter-pill ${activeView === 'summary' ? 'is-active' : ''}`}
                onClick={() => setActiveView('summary')}
              >
                Manage Orders
              </button>
              <button
                type="button"
                className={`premium-filter-pill ${activeView === 'inventory' ? 'is-active' : ''}`}
                onClick={() => setActiveView('inventory')}
              >
                Inventory
              </button>
            </div>
          </section>

          {activeView === 'summary' ? (
            <ManageOrders
              orders={orders}
              setOrders={setOrders}
              partners={partners}
              setNotice={setNotice}
              setDashboardError={setDashboardError}
            />
          ) : (
            <ManageProductsLayout
              products={products}
              setProducts={setProducts}
              setNotice={setNotice}
              setDashboardError={setDashboardError}
            />
          )}
        </>
      )}
    </PremiumPageShell>
  );
}

export default AdminDashboard;
