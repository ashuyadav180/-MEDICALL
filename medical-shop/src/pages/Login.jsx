import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { useAuth } from '../store/AuthContext';
import {
  loginUser,
  requestPasswordReset,
  resetPassword,
  sendOTP,
  verifyOTP,
} from '../api/authApi';

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
  const redirectPath = location.state?.from || null;

  const handleRequestOTP = async (event) => {
    event.preventDefault();
    if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
      setError('Please enter a valid email or 10-digit mobile number.');
      return;
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

  const handleVerifyOTP = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await verifyOTP({ identifier, otp });
      login(token, user);
      navigate(redirectPath || (user?.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await loginUser({ identifier, password });
      login(token, user);
      navigate(redirectPath || (user?.role === 'admin' ? '/admin' : '/'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPasswordReset = async (event) => {
    event.preventDefault();
    if (!isValidEmail(resetEmail)) {
      setError('Please enter a valid email address.');
      return;
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

  const handleResetPassword = async (event) => {
    event.preventDefault();
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
    <PremiumPageShell
      eyebrow="Secure access"
      title="Welcome back to your faster healthcare account."
      description="Use OTP or password login with a calmer, premium flow designed to get customers back into ordering, tracking, and profile management quickly."
      stats={[
        { value: 'OTP', label: 'one-tap login option' },
        { value: '24/7', label: 'account recovery support' },
      ]}
      heroBadges={['OTP-first access', 'Password recovery', 'Order history sync']}
      heroPanels={[
        { label: 'Access modes', value: 'OTP + Password' },
        { label: 'Recovery', value: 'Email reset OTP' },
        { label: 'After login', value: 'Orders, profile, reorders' },
      ]}
    >
      <div className="premium-auth-layout">
        <section className="premium-auth-panel">
          <div className="premium-section-header">
            <div>
              <h2>Login</h2>
              <p>Choose the flow that feels fastest for you.</p>
            </div>
          </div>

          <div className="premium-side-card">
            <span>Account benefits</span>
            <strong>One account powers medicines, diagnostics, consultations, and reorder history.</strong>
            <ul className="premium-helper-list">
              <li>Track orders and payment status from one dashboard.</li>
              <li>Reorder past medicines without rebuilding the basket.</li>
              <li>Recover access with guided password reset or OTP.</li>
            </ul>
          </div>
        </section>

        <section className="premium-form-panel">
          <div className="premium-section-header">
            <div>
              <h3>{showReset ? 'Reset access' : loginMethod === 'otp' ? 'OTP Login' : 'Password Login'}</h3>
              <p>{showReset ? 'Secure your account and set a fresh password.' : 'Login with email or mobile number.'}</p>
            </div>
            {!showReset ? (
              <span className="premium-pill">{loginMethod === 'otp' ? `Step ${step} of 2` : 'Ready'}</span>
            ) : null}
          </div>

          {error ? <div className="premium-note-banner is-danger">{error}</div> : null}
          {message ? <div className="premium-note-banner is-success">{message}</div> : null}

          {showReset ? (
            <>
              {resetStep === 1 ? (
                <form onSubmit={handleRequestPasswordReset} className="premium-form-grid">
                  <div className="premium-field">
                    <label>Account Email</label>
                    <input
                      type="email"
                      placeholder="example@email.com"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value.trim())}
                      required
                      className="premium-input"
                    />
                  </div>
                  <button type="submit" className="premium-cta" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Reset OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="premium-form-grid">
                  <div className="premium-field">
                    <label>Reset OTP</label>
                    <input
                      type="text"
                      placeholder="6-digit OTP"
                      maxLength="6"
                      value={resetOtp}
                      onChange={(event) => setResetOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="premium-input premium-otp-input"
                    />
                  </div>
                  <div className="premium-field">
                    <label>New Password</label>
                    <input
                      type="password"
                      placeholder="Choose a stronger password"
                      value={resetPasswordValue}
                      onChange={(event) => setResetPasswordValue(event.target.value)}
                      required
                      className="premium-input"
                    />
                  </div>
                  <button type="submit" className="premium-cta" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowReset(false);
                  setError(null);
                  setMessage(null);
                }}
                className="premium-link-button"
              >
                Back to login
              </button>
            </>
          ) : loginMethod === 'otp' ? (
            <>
              {step === 1 ? (
                <form onSubmit={handleRequestOTP} className="premium-form-grid">
                  <div className="premium-field">
                    <label>Email or Mobile Number</label>
                    <input
                      type="text"
                      placeholder="example@email.com or 9876543210"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value.trim())}
                      required
                      className="premium-input"
                    />
                  </div>
                  <button type="submit" className="premium-cta" disabled={loading}>
                    {loading ? 'Sending...' : 'Get OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="premium-form-grid">
                  <div className="premium-field">
                    <label>Enter OTP</label>
                    <input
                      type="text"
                      placeholder="6-digit code"
                      maxLength="6"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="premium-input premium-otp-input"
                    />
                  </div>
                  <button type="submit" className="premium-cta" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify and Login'}
                  </button>
                  <button type="button" onClick={() => setStep(1)} className="premium-link-button">
                    Change email or number
                  </button>
                </form>
              )}

              <div className="premium-inline-divider">
                <span>OR</span>
              </div>

              <button type="button" onClick={() => setLoginMethod('password')} className="premium-secondary-btn">
                Login with Password
              </button>
            </>
          ) : (
            <form onSubmit={handlePasswordLogin} className="premium-form-grid">
              <div className="premium-field">
                <label>Email or Mobile Number</label>
                <input
                  type="text"
                  placeholder="example@email.com or 9876543210"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value.trim())}
                  required
                  className="premium-input"
                />
              </div>
              <div className="premium-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="premium-input"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowReset(true);
                  setResetEmail(identifier && isValidEmail(identifier) ? identifier : '');
                  setError(null);
                  setMessage(null);
                }}
                className="premium-link-button"
              >
                Forgot password?
              </button>
              <button type="submit" className="premium-cta" disabled={loading}>
                {loading ? 'Logging in...' : 'Login with Password'}
              </button>
              <button type="button" onClick={() => setLoginMethod('otp')} className="premium-link-button">
                Switch back to OTP Login
              </button>
            </form>
          )}

          <div className="premium-form-note">
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#3460c9', fontWeight: 800, textDecoration: 'none' }}>
              Signup here
            </Link>
          </div>
        </section>
      </div>
    </PremiumPageShell>
  );
}

export default Login;
