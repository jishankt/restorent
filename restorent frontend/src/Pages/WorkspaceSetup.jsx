import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../Context/UserContext';
import { FaFacebook, FaApple } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import './WorkspaceSetup.css';

const WorkspaceSetup = () => {
  const navigate = useNavigate();
  const { baseUrl } = useContext(UserContext);

  const [step, setStep] = useState(1); // 1 = Email Input, 2 = OTP Verification
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      const url = `${baseUrl || ''}/api/otp/send`;
      await axios.post(url, { email });
      setStep(2);
      setSuccessMsg('OTP sent! Check your inbox.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value !== '' && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) {
      setError('Please enter the full 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const url = `${baseUrl || ''}/api/otp/verify`;
      await axios.post(url, { email, otp: otpString });
      
      // Navigate to onboarding
      navigate('/onboard-organization', { state: { verifiedEmail: email } });
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-container">
      {/* Left Side: Branding Banner */}
      <div className="workspace-banner">
        <div className="banner-content">
          <div className="pill-badge">
            <span className="dot"></span> KYLE POS
          </div>
          
          <h1 className="banner-title">
            Your ultimate<br/>
            <span className="highlight-text">restaurant</span><br/>
            management platform
          </h1>
          
          <p className="banner-subtitle">
            Streamline orders, manage tables, and empower your staff — all in one powerful point-of-sale platform built for modern dining.
          </p>
          
          <div className="banner-stats">
            <div className="stat-item">
              <h3>10K+</h3>
              <p>RESTAURANTS</p>
            </div>
            <div className="stat-item">
              <h3>99.9%</h3>
              <p>UPTIME</p>
            </div>
            <div className="stat-item">
              <h3>2M+</h3>
              <p>ORDERS</p>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="circle-shape shape-1"></div>
        <div className="circle-shape shape-2"></div>
        <div className="circle-shape shape-3"></div>
      </div>

      {/* Right Side: Form */}
      <div className="workspace-form-wrapper">
        <div className="workspace-form-container">
          <div className="logo-header">
            <h2>KYLE</h2>
          </div>

          <div className="form-content">
            {step === 1 ? (
              <>
                <h2 className="form-title">Create your workspace</h2>
                <p className="form-subtitle">SaaS Organization Setup - Start your SaaS restaurant operation wizard.</p>
                
                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleEmailSubmit}>
                  <div className="input-group">
                    <label>YOUR EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      placeholder="name@restaurant.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="checkbox-group">
                    <label>
                      <input type="checkbox" defaultChecked />
                      I agree to receive product updates, special offers, and news via email
                    </label>
                    <label>
                      <input type="checkbox" />
                      I want to receive training materials
                    </label>
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Sending...' : 'Continue'}
                  </button>
                </form>

                <p className="terms-text">
                  By signing up, you agree to our <b>Terms of Service</b> and <b>Privacy Policy</b>.
                </p>

                <div className="divider">
                  <span>SIGN UP VIA SOCIAL ACCOUNT</span>
                </div>

                <div className="social-login" style={{ display: 'flex', flexDirection: 'row', gap: '15px' }}>
                  <button className="social-btn"><FaFacebook size={20} color="#1877F2" /></button>
                  <button className="social-btn"><FcGoogle size={20} /></button>
                  <button className="social-btn"><FaApple size={22} color="black" /></button>
                </div>
              </>
            ) : (
              <>
                <h2 className="form-title">Verify Your Email</h2>
                <p className="form-subtitle">We sent a 6-digit OTP code to <b>{email}</b> to verify your account.</p>

                {error && <div className="error-message">{error}</div>}
                {successMsg && <div className="success-message">{successMsg}</div>}

                <form onSubmit={handleOtpSubmit}>
                  <div className="otp-container" style={{ display: 'flex', flexDirection: 'row', gap: '10px', justifyContent: 'center' }}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-${idx}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="otp-input"
                      />
                    ))}
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify OTP & Continue'}
                  </button>
                </form>
                
                <p className="terms-text" style={{ textAlign: 'center', marginTop: '20px' }}>
                  Didn't receive the code? <span style={{ color: '#2ecc71', cursor: 'pointer', fontWeight: 'bold' }} onClick={handleEmailSubmit}>Resend OTP</span>
                </p>
              </>
            )}
          </div>

          <div className="form-footer">
            Already have an account? <span onClick={() => navigate('/login')} className="login-link">Log In</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSetup;
