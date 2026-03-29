import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import MedicineDetails from './pages/MedicineDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminDashboard from './pages/AdminDashboard';
import TrackOrder from './pages/TrackOrder';
import AnalyticsView from './pages/AnalyticsView';
import DeliveryDashboard from './pages/DeliveryDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import OrderDetail from './pages/OrderDetail';
import StaticInfoPage from './pages/StaticInfoPage';

function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/medicine/:id" element={<MedicineDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/delivery-dash" element={<DeliveryDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/about" element={<StaticInfoPage title="About Bablu Medical Store" body="Bablu Medical Store helps local families order medicines quickly, verify availability, and receive doorstep delivery from a trusted neighborhood shop." />} />
          <Route path="/faq" element={<StaticInfoPage title="Frequently Asked Questions" body="Use this page for common questions about order tracking, prescriptions, delivery charges, payment, and local support. Contact the store directly if you need help with a specific order." />} />
          <Route path="/terms" element={<StaticInfoPage title="Terms & Conditions" body="Medicines are subject to availability, prescription requirements, and verification by the store. Delivery timing and order acceptance may vary based on stock and service area." />} />
        </Routes>
      </div>
      <div className="container">
        <Footer />
      </div>
    </>
  );
}

export default App;
