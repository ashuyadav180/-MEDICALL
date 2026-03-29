// src/main.jsx (RE-ADDED CART PROVIDER)
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './store/AuthContext.jsx'; 
import { CartProvider } from './store/CartContext.jsx'; // <--- Re-added
import './i18n'; // <--- Import i18n
import './index.css';

console.log('🚀 React App initializing in main.jsx...');

const root = ReactDOM.createRoot(document.getElementById('root'));

console.log('✨ Mounting App to #root...');

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <React.Suspense fallback={<div>Loading... ✨</div>}>
            <App />
          </React.Suspense>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);