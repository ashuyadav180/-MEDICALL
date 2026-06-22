import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { fetchMyTasks, updateOrderStatus } from '../api/orderApi';
import { useAuth } from '../store/AuthContext';
import socket from '../socket';
import { getOrderReference } from '../utils/orderDisplay';

const currency = (value) => `Rs.${Number(value || 0).toFixed(2)}`;

function DeliveryTaskCard({ task, isUpdating, onMarkDelivered, onOpenMaps }) {
  return (
    <article className="premium-surface-card premium-task-card">
      <div className="premium-track-header">
        <div>
          <strong>{getOrderReference(task)}</strong>
          <p className="premium-meta-copy">{new Date(task.createdAt).toLocaleString()}</p>
        </div>
        <span className={`premium-soft-badge ${task.status === 'delivered' ? 'is-success' : 'is-warning'}`}>
          {task.status}
        </span>
      </div>

      <div className="premium-task-grid">
        <div>
          <h3>{task.customerName}</h3>
          <p className="premium-meta-copy">{task.customerAddress}</p>
        </div>
        <div className="premium-task-summary">
          <span>{task.paymentMethod === 'cod' ? 'Cash on delivery' : 'Paid online'}</span>
          <strong>{currency(task.totalPrice)}</strong>
        </div>
      </div>

      <div className="premium-inline-actions">
        <a href={`tel:${task.customerPhone}`} className="premium-secondary-btn">
          Call Customer
        </a>
        <button type="button" className="premium-ghost-btn" onClick={() => onOpenMaps(task.customerAddress)}>
          Open Maps
        </button>
        {task.status !== 'delivered' ? (
          <button
            type="button"
            className="premium-cta"
            onClick={() => onMarkDelivered(task.id)}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Mark Delivered'}
          </button>
        ) : null}
      </div>
    </article>
  );
}

function DeliveryDashboard() {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState('');
  const userRoomId = user?._id || user?.id;

  useEffect(() => {
    if (!isLoggedIn || !['delivery_person', 'admin'].includes(user?.role)) {
      setLoading(false);
      return undefined;
    }

    const loadTasks = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchMyTasks();
        setTasks(data);
      } catch (loadError) {
        setError(loadError?.response?.data?.message || loadError?.message || 'Failed to load delivery tasks.');
      } finally {
        setLoading(false);
      }
    };

    loadTasks();

    socket.connect();
    if (userRoomId) {
      socket.emit('join_user_room', userRoomId);
    }

    const handleTaskAssigned = (task) => {
      setTasks((current) => [task, ...current]);
      setNotice(`New delivery assigned for ${task.customerName}.`);
    };

    socket.on('new_task_assigned', handleTaskAssigned);

    return () => {
      socket.off('new_task_assigned', handleTaskAssigned);
    };
  }, [isLoggedIn, user?.role, userRoomId]);

  const pendingTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'delivered'),
    [tasks]
  );
  const completedTasks = useMemo(
    () => tasks.filter((task) => task.status === 'delivered'),
    [tasks]
  );

  const dashboardStats = useMemo(
    () => [
      { value: String(pendingTasks.length), label: 'active runs' },
      { value: String(completedTasks.length), label: 'completed deliveries' },
      {
        value: currency(tasks.reduce((sum, task) => sum + Number(task.totalPrice || 0), 0)),
        label: 'task value in queue',
      },
    ],
    [completedTasks.length, pendingTasks.length, tasks]
  );

  const handleStatusUpdate = async (id) => {
    setUpdatingTaskId(id);
    setError('');
    setNotice('');

    try {
      const updatedTask = await updateOrderStatus(id, 'delivered');
      setTasks((current) =>
        current.map((task) => (task.id === id ? { ...task, ...updatedTask } : task))
      );
      setNotice(`Marked ${getOrderReference(updatedTask)} as delivered.`);
    } catch (updateError) {
      setError(updateError?.response?.data?.message || updateError?.message || 'Failed to update order status.');
    } finally {
      setUpdatingTaskId('');
    }
  };

  const openMaps = (address) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!['delivery_person', 'admin'].includes(user?.role)) {
    return (
      <PremiumPageShell
        eyebrow="Restricted"
        title="This delivery workspace is available only to delivery staff."
        description="Use an assigned delivery account to see tasks, navigate routes, and mark deliveries complete."
      >
        <section className="premium-empty-state">
          <div className="premium-empty-icon">D</div>
          <h2>Delivery access required</h2>
          <p>The page is hidden from customer accounts because it contains live fulfillment tasks.</p>
        </section>
      </PremiumPageShell>
    );
  }

  return (
    <PremiumPageShell
      eyebrow="Delivery"
      title={`Move every order like a premium fulfillment operation, ${user?.name || 'partner'}.`}
      description="The delivery panel now has the same visual quality as the storefront, with clearer task states, better actions, and a calmer workflow for active runs."
      stats={dashboardStats}
      sideContent={
        <div className="premium-side-card">
          <span>Mission control</span>
          <strong>Keep the last-mile workflow fast, visible, and easy to act on.</strong>
          <ul className="premium-helper-list">
            <li>Assigned tasks arrive in real time through the same socket flow already used by the backend.</li>
            <li>Call, navigation, and delivery completion actions are grouped directly inside each task card.</li>
            <li>Completed deliveries stay visible so partners have quick recent history.</li>
          </ul>
        </div>
      }
    >
      {notice ? <section className="premium-note-banner is-success">{notice}</section> : null}
      {error ? <section className="premium-note-banner is-danger">{error}</section> : null}

      {loading ? (
        <section className="premium-empty-state">
          <div className="premium-empty-icon">...</div>
          <h2>Loading tasks</h2>
          <p>Checking assigned deliveries, latest statuses, and route-ready customer details.</p>
        </section>
      ) : (
        <>
          <section className="premium-surface-card">
            <div className="premium-section-header">
              <div>
                <h2>Active Deliveries</h2>
                <p>Focus mode for every order that still needs a handoff.</p>
              </div>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="premium-empty-state premium-empty-compact">
                <div className="premium-empty-icon">0</div>
                <h2>No active deliveries</h2>
                <p>Your queue is clear right now. New tasks will appear here automatically.</p>
              </div>
            ) : (
              <div className="premium-list-stack">
                {pendingTasks.map((task) => (
                  <DeliveryTaskCard
                    key={task.id}
                    task={task}
                    isUpdating={updatingTaskId === task.id}
                    onMarkDelivered={handleStatusUpdate}
                    onOpenMaps={openMaps}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="premium-surface-card">
            <div className="premium-section-header">
              <div>
                <h2>Recently Completed</h2>
                <p>Latest finished deliveries for quick confirmation.</p>
              </div>
            </div>

            {completedTasks.length === 0 ? (
              <p className="premium-muted">Completed deliveries will appear here after you mark them delivered.</p>
            ) : (
              <div className="premium-list-stack">
                {completedTasks.slice(0, 5).map((task) => (
                  <article key={task.id} className="premium-order-mini-card">
                    <div className="premium-track-header">
                      <strong>{getOrderReference(task)}</strong>
                      <span className="premium-soft-badge is-success">Delivered</span>
                    </div>
                    <p className="premium-meta-copy">{task.customerName}</p>
                    <div className="premium-between-row">
                      <span className="premium-muted">{new Date(task.createdAt).toLocaleString()}</span>
                      <strong>{currency(task.totalPrice)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </PremiumPageShell>
  );
}

export default DeliveryDashboard;
