import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { loginUser, sendOTP, verifyOTP, requestPasswordReset, resetPassword } from '../api/authApi';

const isValidEmail = (value) => /\S+@\S+\.\S+/.test(value);
const isValidPhone = (value) => /^\d{10}$/.test(String(value || '').replace(/\D/g, ''));

function Login() {
  const [step, setStep] = useState(1);
  const [loginMethod, setLoginMethod] = useState('otp');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetStep, setResetStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from || '/';

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
      return setError('Please enter a valid email or 10-digit mobile number.');
    }

    setLoading(true);
    setError(null);
    try {
      const response = await sendOTP(identifier);
      setMessage(
        response.channel === 'email'
          ? `OTP sent to ${identifier}. Please check your inbox.`
          : `OTP generated for ${identifier}. Check the backend console for now.`
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
      const { token, user } = await verifyOTP({ identifier, otp });
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
      const { token, user } = await loginUser({ identifier, password });
      login(token, user);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (e) => {
    e.preventDefault();
    if (!isValidEmail(resetEmail)) {
      return setError('Please enter a valid email address.');
    }

    setLoading(true);
    setError(null);
    try {
      await requestPasswordReset(resetEmail);
      setMessage(`Password reset OTP sent to ${resetEmail}.`);
      setResetStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await resetPassword({ email: resetEmail, otp: resetOtp, password: resetPasswordValue });
      setMessage('Password reset successful. You can log in now.');
      setShowReset(false);
      setResetStep(1);
      setResetOtp('');
      setResetPasswordValue('');
      setIdentifier(resetEmail);
      setLoginMethod('password');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ display: 'flex', justifyContent: 'center', padding: '60px 20px' }}>
      <div className="form-card" style={{ maxWidth: '420px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '10px', fontFamily: 'Baloo 2' }}>Welcome Back!</h2>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '30px' }}>
          Login with email or mobile number.
        </p>

        {error && <div style={{ background: '#fff0f0', color: 'var(--red)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>{error}</div>}
        {message && <div style={{ background: 'var(--green-pale)', color: 'var(--green)', padding: '12px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>{message}</div>}

        {showReset ? (
          <div>
            {resetStep === 1 ? (
              <form onSubmit={handleRequestPasswordReset}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Account Email</label>
                  <input type="email" placeholder="example@email.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value.trim())} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                </div>
                <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div style={{ display: 'grid', gap: '12px' }}>
                  <input type="text" placeholder="6-digit OTP" maxLength="6" value={resetOtp} onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                  <input type="password" placeholder="New password" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
                  <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button type="button" onClick={() => { setShowReset(false); setError(null); setMessage(null); }} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Back to login</button>
            </div>
          </div>
        ) : loginMethod === 'otp' ? (
          <div>
            {step === 1 ? (
              <form onSubmit={handleRequestOTP}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Email or Mobile Number</label>
                  <input
                    type="text"
                    placeholder="example@email.com or 9876543210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value.trim())}
                    required
                    style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }}
                  />
                </div>
                <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                  {loading ? 'Sending...' : 'Get OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Enter OTP</label>
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
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
                <div style={{ textAlign: 'center', marginTop: '15px' }}>
                  <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>Change Email / Number</button>
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
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Email or Mobile Number</label>
              <input type="text" placeholder="example@email.com or 9876543210" value={identifier} onChange={(e) => setIdentifier(e.target.value.trim())} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green)' }}>Password</label>
              <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', marginTop: '5px', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--border)' }} />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setShowReset(true); setResetEmail(identifier && isValidEmail(identifier) ? identifier : ''); setError(null); setMessage(null); }} style={{ background: 'none', border: 'none', color: 'var(--blue)', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                Forgot password?
              </button>
            </div>
            <button type="submit" className="add-btn" style={{ width: '100%', padding: '14px' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Login with Password'}
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
