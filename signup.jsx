import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Card, Alert, ListGroup } from 'react-bootstrap';
import '../styling/signup.css';

const SignupForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
        hasSpecialChar: false,
    hasMinLength: false,
  });
  const navigate = useNavigate();

  const validatePassword = (password) => {
    setPasswordValidations({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    validatePassword(newPassword);
  };

  const isPasswordValid = () => {
    return (
      passwordValidations.hasUpperCase &&
      passwordValidations.hasLowerCase &&
      passwordValidations.hasNumber &&
      passwordValidations.hasSpecialChar &&
      passwordValidations.hasMinLength
    );
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!agreed) {
      setError('You must agree to the Terms of Service');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid()) {
      setError('Password does not meet all requirements');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fullName, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        localStorage.setItem('token', data.token); // Store JWT
        navigate('/login'); // Redirect on success
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
  };

  return (
    <Container className="signup-container">
      <Card className="signup-card">
        <Card.Header className="signup-header">
          <h2>Gem's Analytics <br />SignUp</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSignup}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your full name"
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </Form.Group>

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

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                className="form-input"
                value={password}
                onChange={handlePasswordChange}
                required
              />
              <Form.Text className="text-muted">Password must contain:</Form.Text>
              <ListGroup className="mt-2">
                <ListGroup.Item variant={passwordValidations.hasMinLength ? 'success' : 'danger'}>
                  {passwordValidations.hasMinLength ? '✓' : '✗'} At least 8 characters
                </ListGroup.Item>
                <ListGroup.Item variant={passwordValidations.hasUpperCase ? 'success' : 'danger'}>
                  {passwordValidations.hasUpperCase ? '✓' : '✗'} At least one uppercase letter
                </ListGroup.Item>
                <ListGroup.Item variant={passwordValidations.hasLowerCase ? 'success' : 'danger'}>
                  {passwordValidations.hasLowerCase ? '✓' : '✗'} At least one lowercase letter
                </ListGroup.Item>
                <ListGroup.Item variant={passwordValidations.hasNumber ? 'success' : 'danger'}>
                  {passwordValidations.hasNumber ? '✓' : '✗'} At least one number
                </ListGroup.Item>
                <ListGroup.Item variant={passwordValidations.hasSpecialChar ? 'success' : 'danger'}>
                  {passwordValidations.hasSpecialChar ? '✓' : '✗'} At least one special character
                </ListGroup.Item>
              </ListGroup>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Show Password"
              className="show-password-check mb-3"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />

            <Form.Check
              type="checkbox"
              label="I agree to the Terms of Service and Privacy Policy"
              className="terms-check mb-4"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />

            <Button variant="primary" type="submit" className="submit-btn">
              Sign Up
            </Button>

            <p className="login-link">
              Already have an account? <a href="/login">Sign in</a>
            </p>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SignupForm;