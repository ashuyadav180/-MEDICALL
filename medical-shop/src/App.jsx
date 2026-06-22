import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './styles/premiumPages.css';
import './styles/pharma-premium.css';

const Home               = lazy(() => import('./pages/Home'));
const MedicineDetails    = lazy(() => import('./pages/MedicineDetails'));
const Cart               = lazy(() => import('./pages/Cart'));
const Checkout           = lazy(() => import('./pages/Checkout'));
const OrderConfirmation  = lazy(() => import('./pages/OrderConfirmation'));
const AdminDashboard     = lazy(() => import('./pages/AdminDashboard'));
const TrackOrder         = lazy(() => import('./pages/TrackOrder'));
const AnalyticsView      = lazy(() => import('./pages/AnalyticsView'));
const DeliveryDashboard  = lazy(() => import('./pages/DeliveryDashboard'));
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const Contact            = lazy(() => import('./pages/Contact'));
const Profile            = lazy(() => import('./pages/Profile'));
const OrderDetail        = lazy(() => import('./pages/OrderDetail'));
const StaticInfoPage     = lazy(() => import('./pages/StaticInfoPage'));
const Medicines          = lazy(() => import('./pages/Medicines'));

const routeFallback = (
  <div style={{ padding: '80px 0', textAlign: 'center', color: '#6b7280', fontFamily: 'Inter,sans-serif' }}>
    Loading…
  </div>
);

/* Routes that should render FULL-WIDTH (no container padding) */
const FULL_WIDTH_ROUTES = ['/', '/medicines'];

function AppContent() {
  const { pathname } = useLocation();
  const isFullWidth  = FULL_WIDTH_ROUTES.some(r => pathname === r || (r !== '/' && pathname.startsWith(r)));

  return (
    <>
      <Navbar />

      <Suspense fallback={routeFallback}>
        {isFullWidth ? (
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/medicines" element={<Medicines />} />
          </Routes>
        ) : (
          <div className="container">
            <Routes>
              <Route path="/medicine/:id"       element={<MedicineDetails />} />
              <Route path="/cart"               element={<Cart />} />
              <Route path="/checkout"           element={<Checkout />} />
              <Route path="/order-confirmation" element={<OrderConfirmation />} />
              <Route path="/track"              element={<TrackOrder />} />
              <Route path="/analytics"          element={<AnalyticsView />} />
              <Route path="/admin"              element={<AdminDashboard />} />
              <Route path="/delivery-dash"      element={<DeliveryDashboard />} />
              <Route path="/login"              element={<Login />} />
              <Route path="/register"           element={<Register />} />
              <Route path="/contact"            element={<Contact />} />
              <Route path="/profile"            element={<Profile />} />
              <Route path="/orders/:id"         element={<OrderDetail />} />
              <Route path="/about"              element={<StaticInfoPage title="About Bablu Medical Store" body="Bablu Medical Store helps local families order medicines quickly, verify availability, and receive doorstep delivery from a trusted neighborhood shop." />} />
              <Route path="/faq"                element={<StaticInfoPage title="Frequently Asked Questions" body="Use this page for common questions about order tracking, prescriptions, delivery charges, payment, and local support. Contact the store directly if you need help with a specific order." />} />
              <Route path="/terms"              element={<StaticInfoPage title="Terms & Conditions" body="Medicines are subject to availability, prescription requirements, and verification by the store. Delivery timing and order acceptance may vary based on stock and service area." />} />
            </Routes>
          </div>
        )}
      </Suspense>

      <div className="container">
        <Footer />
      </div>
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
