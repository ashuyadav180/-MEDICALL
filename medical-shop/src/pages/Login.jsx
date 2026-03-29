import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { loginUser, sendOTP, verifyOTP, isFirebasePhoneAuthEnabled } from '../api/authApi';

function Login() {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' or 'password'
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) return setError("Please enter a valid 10-digit mobile number.");
    
    setLoading(true);
    setError(null);
    try {
        await sendOTP(phone);
        setMessage(
          isFirebasePhoneAuthEnabled()
            ? `OTP sent to ${phone}. Please check your SMS inbox.`
            : `OTP sent to ${phone}. Check the backend console!`
        );
        setStep(2);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
        const { token, user } = await verifyOTP({ phone, otp });
        login(token, user);
        navigate(redirectPath);
    } catch (err) {
      setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await loginUser({ email, password });
      login(token, user);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="form-card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontFamily: 'Baloo 2' }}>Welcome Back! 👋</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '30px' }}>
          Login to your account to place orders.
        </p>

        {error && <div style={{ background: '#fff0f0', color: 'var(--red)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>⚠️ {error}</div>}
        {message && <div style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>✅ {message}</div>}

        {loginMethod === 'otp' ? (
          <div>
            {step === 1 ? (
              <form onSubmit={handleRequestOTP}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Mobile Number</label>
                  <div style={{ position: 'relative', marginTop: '5px' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--muted)' }}>+91</span>
                    <input 
                      type="tel" 
                      placeholder="9876543210" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      required 
                      style={{ width: '100%', padding: '12px 12px 12px 45px', borderRadius: '10px', border: '1.5px solid var(--border)' }} 
                    />
                  </div>
                </div>
                <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Get OTP 📩'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Enter OTP (Check Console)</label>
                  <input 
                    type="text" 
                    placeholder="6-Digit Code" 
                    maxLength="6"
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required 
                    style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)', textAlign: 'center', letterSpacing: '8px', fontSize: '1.2rem', fontWeight: 800 }} 
                  />
                </div>
                <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Login ✅'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Change Number</button>
                </div>
              </form>
            )}
            <div style={{ position: 'relative', textAlign: 'center', margin: '30px 0' }}>
               <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
               <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 15px', color: 'var(--muted)', fontSize: '0.8rem' }}>OR</span>
            </div>
            <button onClick={() => setLoginMethod('password')} style={{ width: '100%', background: 'none', border: '1.5px solid var(--border)', padding: '12px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Login with Password</button>
          </div>
        ) : (
          <form onSubmit={handlePasswordLogin}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Email Address</label>
              <input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Password</label>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login with Password 🔐'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button type="button" onClick={() => setLoginMethod('otp')} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Switch back to OTP Login</button>
            </div>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--green)', fontWeight: 800, textDecoration: 'none' }}>Signup here</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
