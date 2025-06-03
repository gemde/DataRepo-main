import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Alert } from 'react-bootstrap';
import '../styling/login.css';

const LoginForm = () => {
  const [mode, setMode] = useState('login'); // 'login' or 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

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
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      }
    } catch {
      setError('Server error. Please try again.');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Reset failed');
      } else {
        setMessage('Password reset successful. You can now log in.');
        setMode('login');
        setPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch {
      setError('Server error. Please try again.');
    }
  };

  const toggleMode = () => {
    setError('');
    setMessage('');
    setMode(mode === 'login' ? 'reset' : 'login');
  };

  return (
    <Container className="login-container">
      <Card className="login-card">
        <Card.Header className="login-header">
          <h3>Gem's Analytics<br />{mode === 'login' ? 'Login' : 'Reset Password'}</h3>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {message && <Alert variant="success">{message}</Alert>}

          <Form onSubmit={mode === 'login' ? handleLogin : handlePasswordReset}>
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

            {mode === 'login' ? (
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
                    onClick={toggleMode}
                  >
                    Forgot password?
                  </span>
                </div>

                <Button variant="primary" type="submit" className="submit-btn">Sign In</Button>
              </>
            ) : (
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
                    onClick={toggleMode}
                  >
                    Back to login
                  </span>
                </div>

                <Button variant="success" type="submit" className="submit-btn">Reset Password</Button>
              </>
            )}
          </Form>

          {mode === 'login' && (
            <>
              <div className="divider"><span>welcome back</span></div>
              <p className="signup-link">Don't have an account? <a href="/signup">Sign up</a></p>
            </>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginForm;
