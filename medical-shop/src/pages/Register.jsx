import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, sendOTP, verifyOTP, isFirebasePhoneAuthEnabled } from '../api/authApi'; 
import { useAuth } from '../store/AuthContext';

// Validation Helpers
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isValidMobile = (input) => /^\d{10}$/.test(input);

function Register() {
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (name.length < 3) return setError("Please enter your full name.");
    if (!isValidEmail(email)) return setError("Please enter a valid email address.");
    if (!isValidMobile(mobile)) return setError("Please enter a valid 10-digit mobile number.");
    if (password.length < 6) return setError("Password must be at least 6 characters long.");

    setLoading(true);
    setError(null);
    try {
        await sendOTP(mobile);
        setMessage(
          isFirebasePhoneAuthEnabled()
            ? `Verification code sent to ${mobile}. Please check your SMS inbox.`
            : `Verification code sent to ${mobile}. Check backend console!`
        );
        setStep(2);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return setError("Please enter the 6-digit OTP.");

    setLoading(true);
    setError(null);
    try {
        let token;
        let user;

        if (isFirebasePhoneAuthEnabled()) {
          ({ token, user } = await verifyOTP({
            phone: mobile,
            otp,
            profile: { name, email, mobile, password, mode: 'register' },
          }));
        } else {
          await verifyOTP({ phone: mobile, otp });
          ({ token, user } = await registerUser({ name, email, mobile, password }));
        }
        
        login(token, user);
        setMessage("Account created successfully!");
        setTimeout(() => navigate('/'), 1000);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="form-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontFamily: 'Baloo 2' }}>Join Bablu Medical 🏥</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '30px' }}>
          Create an account to track your orders easily.
        </p>

        {error && <div style={{ background: '#fff0f0', color: 'var(--red)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>⚠️ {error}</div>}
        {message && <div style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>✅ {message}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Full Name</label>
              <input type="text" placeholder="Aman Kumar" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Email Address</label>
              <input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Mobile Number</label>
              <input type="tel" placeholder="10-Digit Mobile" value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Password</label>
              <input type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Continue to Verify ➔'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>We've sent a 6-digit code to <strong>{mobile}</strong></p>
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Enter OTP (Check Console)</label>
              <input 
                type="text" 
                placeholder="6-Digit Code" 
                maxLength="6"
                value={otp} 
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required 
                style={{ width: '100%', marginTop: '10px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)', textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 800 }} 
              />
            </div>
            <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Verifying...' : 'Complete Signup ✅'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Edit Details</button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--green)', fontWeight: 800, textDecoration: 'none' }}>Login instead</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
