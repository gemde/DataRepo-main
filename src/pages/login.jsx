// src/components/Login.jsx
import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext.jsx'; // Import AuthContext
import '../styling/login.css';

const Login = () => {
  const [mode, setMode] = useState('login'); // 'login', 'forgot', or 'reset' (for after receiving token)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetToken, setResetToken] = useState(''); // To store the token received via email (in a real app, this would come from a link)
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login: authLogin } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
      } else {
        authLogin(data.token, data.user); // Store token and user data in AuthContext and localStorage

        if (data.user && data.user.role === 'admin') {
          navigate('/admindashboard'); // Redirect admins
        } else {
          navigate('/profile'); // Redirect non-admins
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- NEW: Handle requesting a password reset link (forgot password) ---
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send reset link.');
      } else {
        setMessage(data.message || 'Password reset link sent to your email.');
        // In a real application, the user would receive an email
        // with a link like /reset-password?token=XYZ.
        // For development, we'll store the token from the response directly.
        if (data.resetToken) {
            setResetToken(data.resetToken);
            setMode('reset'); // Automatically switch to reset mode if token received
            setMessage('Password reset token received. Enter your new password.');
        } else {
            // This case might happen if backend doesn't return token in prod
            setMessage('If your email is registered, a password reset link has been sent.');
            setMode('login'); // Stay on login or switch back after message
        }
      }
    } catch (err) {
      console.error("Forgot password request error:", err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- MODIFIED: Handle setting new password with a token ---
  const handleResetPasswordWithToken = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    // Add more complex password validation if needed
    if (newPassword.length < 8) { // Basic length check for example
        setError('New password must be at least 8 characters long.');
        setLoading(false);
        return;
    }


    try {
      // Use the resetToken obtained from the forgot-password response or a URL param
      // In a production app, the token would come from the URL:
      // const urlParams = new URLSearchParams(window.location.search);
      // const tokenFromUrl = urlParams.get('token');
      // If token is from URL, use that. Otherwise, use state.
      const tokenToSend = resetToken; // Using state for dev demonstration

      if (!tokenToSend) {
          setError("Password reset token is missing. Please request a new link.");
          setLoading(false);
          return;
      }

      const res = await fetch(`http://localhost:5000/api/reset-password/${tokenToSend}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Password reset failed.');
      } else {
        setMessage('Password has been reset successfully. You can now log in.');
        setMode('login'); // Switch back to login mode
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setResetToken(''); // Clear token after use
      }
    } catch (err) {
      console.error("Password reset error:", err);
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (targetMode) => { // --- MODIFIED: Accept target mode directly ---
    setError('');
    setMessage('');
    setMode(targetMode);
    // Clear relevant fields when switching modes
    if (targetMode === 'login') {
        setNewPassword('');
        setConfirmNewPassword('');
        setResetToken('');
    } else if (targetMode === 'forgot') {
        setPassword('');
    }
  };

  return (
    <Container className="login-container">
      <Card className="login-card">
        <Card.Header className="login-header">
          <h3>Gem's Analytics<br />{mode === 'login' ? 'Login' : mode === 'forgot' ? 'Forgot Password' : 'Reset Password'}</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Form onSubmit={mode === 'login' ? handleLogin : (mode === 'forgot' ? handleForgotPasswordRequest : handleResetPasswordWithToken)}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            {mode === 'login' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-flex justify-content-between mb-3">
                  <Form.Check type="checkbox" label="Remember me?" className="remember-me" />
                  <span
                    className="forgot-password"
                    style={{ cursor: 'pointer', color: 'blue' }}
                    onClick={() => toggleMode('forgot')} // --- MODIFIED: Use new toggleMode pattern ---
                  >
                    Forgot password?
                  </span>
                </div>

                <Button variant="primary" type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </>
            )}

            {mode === 'forgot' && ( // --- NEW: Forgot Password Request Form ---
                <>
                    <Button variant="primary" type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Sending Link...' : 'Send Reset Link'}
                    </Button>
                    <div className="d-flex justify-content-center mt-3">
                        <span
                            className="back-to-login"
                            style={{ cursor: 'pointer', color: 'blue' }}
                            onClick={() => toggleMode('login')}
                        >
                            Back to login
                        </span>
                    </div>
                </>
            )}

            {mode === 'reset' && ( // --- NEW: Reset Password Form (after token is obtained) ---
              <>
                <Form.Group className="mb-3">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter new password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm new password"
                    className="form-input"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-flex justify-content-between mb-3">
                  <span
                    className="forgot-password"
                    style={{ cursor: 'pointer', color: 'blue' }}
                    onClick={() => toggleMode('login')} // --- MODIFIED: Use new toggleMode pattern ---
                  >
                    Back to login
                  </span>
                </div>

                <Button variant="success" type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </>
            )}
          </Form>

          {mode === 'login' && (
            <>
              <div className="divider"><span>welcome back</span></div>
              <p className="signup-link">Don't have an account? <Link to="/signup">Sign up</Link></p>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Login;