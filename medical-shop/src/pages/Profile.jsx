import React, { useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNavigate } from 'react-router-dom';

function Profile() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  // Removed selectedOrder state, as we are now navigating to a new page

  // Mock Order History Data 
  const orderHistory = [
    { 
      id: 'O1', 
      date: '2025-10-25', 
      total: 45.99, 
      status: 'Delivered', 
      shipping: '45, Main Street, Hyderabad, 500032',
      items: [{name: 'Paracetamol 500mg', qty: 2, price: 7.00}, {name: 'Vitamin C Complex', qty: 1, price: 31.99}] 
    },
    { 
      id: 'O2', 
      date: '2025-09-10', 
      total: 12.00, 
      status: 'Shipped', 
      shipping: 'B-12, Old Quarters, Bangalore, 560001',
      items: [{name: 'First Aid Bandages', qty: 4, price: 3.00}]
    },
    { 
      id: 'O3', 
      date: '2025-08-01', 
      total: 8.99, 
      status: 'Cancelled', 
      shipping: 'C-301, New Heights Apt, Mumbai, 400001',
      items: [{name: 'Cough Suppressant', qty: 1, price: 8.99}]
    },
  ];

  if (!isLoggedIn) {
    return <div className="text-center p-20">Please log in to view your profile.</div>;
  }

  const userName = user?.name || 'Customer';

  // Handler to navigate to the detailed page
  const handleViewDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };


  return (
    <div className="profile-page">
      <h1>Welcome Back, {userName}</h1>
      
      <div className="profile-grid">
        <div className="profile-details card">
          <h2>Account Details</h2>
          <p><strong>Name:</strong> {userName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          
          <button onClick={() => alert("Mock: Edit feature coming soon!")} className="cta-button" style={{width: '100%'}}>
            Update Details
          </button>
          
          
        </div>

        {/* --- Order History Section --- */}
        <div className="order-history card">
          <h2>Order History ({orderHistory.length})</h2>
          
          <table className="admin-table" style={{marginTop: '15px'}}>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Details</th> 
              </tr>
            </thead>
            <tbody>
              {orderHistory.map(order => (
                <tr key={order.id}>
                  <td>{order.id}</td>
                  <td>{order.date}</td>
                  <td>${order.total.toFixed(2)}</td>
                  <td><span className={`status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td style={{width: '10%'}}> 
                    {/* CRITICAL CHANGE: Navigate to dedicated page */}
                    <button onClick={() => handleViewDetails(order.id)} className="detail-button">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button 
            onClick={() => navigate('/')} 
            className="cta-button" 
            style={{width: '100%', marginTop: '20px', backgroundColor: '#0056b3'}}
          >
            Start New Order
          </button>
        </div>
      </div>

      {/* Removed the OrderDetailModal component render */}
    </div>
  );
}

export default Profile;
