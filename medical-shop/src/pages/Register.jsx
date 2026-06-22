import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PremiumPageShell from '../components/ui/PremiumPageShell';
import { sendOTP, verifyOTP } from '../api/authApi';
import { useAuth } from '../store/AuthContext';

const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const isValidMobile = (input) => /^\d{10}$/.test(input);

function Register() {
  const [step, setStep] = useState(1);
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

  const handleSendOTP = async (event) => {
    event.preventDefault();
    if (name.length < 3) {
      setError('Please enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isValidMobile(mobile)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sendOTP(email);
      setMessage(`Verification code sent to ${email}. Please check your inbox.`);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (event) => {
    event.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { token, user } = await verifyOTP({
        identifier: email,
        otp,
        profile: { name, email, mobile, password, mode: 'register' },
      });

      login(token, user);
      setMessage('Account created successfully.');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PremiumPageShell
      eyebrow="Create account"
      title="Set up a polished healthcare account in minutes."
      description="Register once and move across ordering, profile management, tracking, and repeat purchases with a faster and more reliable customer flow."
      stats={[
        { value: '2-step', label: 'verified signup flow' },
        { value: 'Email', label: 'secure OTP verification' },
      ]}
      heroBadges={['Verified signup', 'Reusable account', 'Healthcare ready']}
      heroPanels={[
        { label: 'Verification', value: '2-step onboarding' },
        { label: 'Identity', value: 'Email + mobile' },
        { label: 'Ready for', value: 'Orders, profile, tracking' },
      ]}
    >
      <div className="premium-auth-layout">
        <section className="premium-auth-panel">
          <div className="premium-section-header">
            <div>
              <h2>Why create an account?</h2>
              <p>Everything stays synced once you verify your identity.</p>
            </div>
          </div>

          <div className="premium-side-card">
            <span>Member flow</span>
            <strong>Save time on every next order with remembered details and order history.</strong>
            <ul className="premium-helper-list">
              <li>Use email or mobile later at login.</li>
              <li>Track orders and reorder from profile in one tap.</li>
              <li>Keep prescription-ready shopping and delivery data together.</li>
            </ul>
          </div>
        </section>

        <section className="premium-form-panel">
          <div className="premium-section-header">
            <div>
              <h3>{step === 1 ? 'Signup details' : 'Verify your email'}</h3>
              <p>{step === 1 ? 'Fill in your essentials to begin verification.' : `We sent a verification code to ${email}.`}</p>
            </div>
            <span className="premium-pill">Step {step} of 2</span>
          </div>

          {error ? <div className="premium-note-banner is-danger">{error}</div> : null}
          {message ? <div className="premium-note-banner is-success">{message}</div> : null}

          {step === 1 ? (
            <form onSubmit={handleSendOTP} className="premium-form-grid">
              <div className="premium-field">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Aman Kumar"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="premium-input"
                />
              </div>
              <div className="premium-field">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="premium-input"
                />
              </div>
              <div className="premium-field">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="premium-input"
                />
              </div>
              <div className="premium-field">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="premium-input"
                />
              </div>
              <button type="submit" className="premium-cta" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Continue to Verify'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyAndRegister} className="premium-form-grid">
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
                {loading ? 'Verifying...' : 'Complete Signup'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="premium-link-button">
                Edit Details
              </button>
            </form>
          )}

          <div className="premium-form-note">
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#3460c9', fontWeight: 800, textDecoration: 'none' }}>
              Login instead
            </Link>
          </div>
        </section>
      </div>
    </PremiumPageShell>
  );
}

export default Register;
