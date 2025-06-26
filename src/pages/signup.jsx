// src/components/SignupForm.jsx or src/pages/SignupForm.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Container, Card, Alert, ListGroup } from 'react-bootstrap';
import '../styling/signup.css';

const SignupForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    national_id_passport: '',
    country: '',
    institution: '',
    officialWork: '',
    // --- MODIFIED: Default role to 'user' and remove role selection input ---
    role: 'user', // Always default to 'user' for new sign-ups
    agreed: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordValidations, setPasswordValidations] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    if (name === 'password') validatePassword(value);
  };

  const validatePassword = (password) => {
    setPasswordValidations({
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      hasMinLength: password.length >= 8,
    });
  };

  const isPasswordValid = () => Object.values(passwordValidations).every(Boolean);
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (step < 3) {
        // Basic validation for current step before moving to next
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.gender || !formData.national_id_passport || !formData.country) {
                return setError('Please fill in all required personal details.');
            }
        }
        if (step === 2) {
            if (!formData.institution || !formData.officialWork || !formData.email) {
                return setError('Please fill in all required professional and contact details.');
            }
        }
        // If validations pass, move to next step
        setError(''); // Clear error if next step successful
        return nextStep();
    }

    // Final validation and submission on the last step (step 3)
    setError('');

    if (!formData.agreed) {
        return setError('You must agree to the Terms of Service.');
    }
    if (formData.password !== formData.confirmPassword) {
        return setError('Passwords do not match.');
    }
    if (!isPasswordValid()) {
        return setError('Password does not meet all requirements.');
    }

    try {
      const payload = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        password: formData.password,
        gender: formData.gender,
        national_id_passport: formData.national_id_passport,
        country: formData.country,
        institution: formData.institution,
        official_work: formData.officialWork,
        role: formData.role, // This will now always be 'user' from initial state
        agreed: formData.agreed
      };
      console.log("Sending payload:", payload);

      const res = await fetch('http://localhost:5000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
      } else {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        navigate('/login');
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError('Server error. Please try again.');
    }
  };

  return (
    <Container className="signup-container">
      <Card className="signup-card">
        <Card.Header className="signup-header">
          <h1 className="text-3xl font-bold mb-4">JHUB AFRICA</h1>
          <h2>Gem's Analytics Sign Up</h2>
        </Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSignup}>
            {step === 1 && (
              <>
                <h4>Step 1: Personal Details</h4>
                <Form.Group className="mb-3"><Form.Label>First Name</Form.Label><Form.Control name="firstName" value={formData.firstName} onChange={handleChange} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Last Name</Form.Label><Form.Control name="lastName" value={formData.lastName} onChange={handleChange} required /></Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Gender</Form.Label>
                    <Form.Select name="gender" value={formData.gender} onChange={handleChange} required>
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3"><Form.Label>National ID / Passport</Form.Label><Form.Control name="national_id_passport" value={formData.national_id_passport} onChange={handleChange} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Country</Form.Label><Form.Control name="country" value={formData.country} onChange={handleChange} required /></Form.Group>
                <Button type="submit">Next</Button>
              </>
            )}

            {step === 2 && (
              <>
                <h4>Step 2: Professional & Contact Details</h4>
                <Form.Group className="mb-3"><Form.Label>Institution</Form.Label><Form.Control name="institution" value={formData.institution} onChange={handleChange} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Official Work</Form.Label><Form.Control name="officialWork" value={formData.officialWork} onChange={handleChange} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required /></Form.Group>

                <div className="d-flex justify-content-between mt-3">
                  <Button onClick={prevStep}>Back</Button>
                  <Button type="submit">Next</Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h4>Step 3: Account Credentials & Terms</h4>
                <Form.Group className="mb-3"><Form.Label>Password</Form.Label><Form.Control type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>Confirm Password</Form.Label><Form.Control type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required /></Form.Group>
                <Form.Check type="checkbox" label="Show Password" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />

                {/* DYNAMIC Conditional Rendering for Password Validations */}
                {formData.password.length > 0 && !isPasswordValid() && (
                    <ListGroup className="mt-2">
                        <ListGroup.Item variant={passwordValidations.hasMinLength ? 'success' : 'danger'}>{passwordValidations.hasMinLength ? '✓' : '✗'} At least 8 characters</ListGroup.Item>
                        <ListGroup.Item variant={passwordValidations.hasUpperCase ? 'success' : 'danger'}>{passwordValidations.hasUpperCase ? '✓' : '✗'} One uppercase letter</ListGroup.Item>
                        <ListGroup.Item variant={passwordValidations.hasLowerCase ? 'success' : 'danger'}>{passwordValidations.hasLowerCase ? '✓' : '✗'} One lowercase letter</ListGroup.Item>
                        <ListGroup.Item variant={passwordValidations.hasNumber ? 'success' : 'danger'}>{passwordValidations.hasNumber ? '✓' : '✗'} One number</ListGroup.Item>
                        <ListGroup.Item variant={passwordValidations.hasSpecialChar ? 'success' : 'danger'}>{passwordValidations.hasSpecialChar ? '✓' : '✗'} One special character</ListGroup.Item>
                    </ListGroup>
                )}
                 {/* Optional: Show a positive message if password is valid and being typed */}
                 {formData.password.length > 0 && isPasswordValid() && (
                    <Alert variant="success" className="mt-2">Password looks good!</Alert>
                )}

                {/* --- REMOVED: Role selection input for security --- */}
                {/* <Form.Group className="mb-3 mt-3">
                    <Form.Label>Role</Form.Label>
                    <Form.Select name="role" value={formData.role} onChange={handleChange}>
                        <option value="user">Regular User</option>
                        <option value="admin">Admin</option>
                    </Form.Select>
                </Form.Group> */}

                <Form.Check type="checkbox" name="agreed" label="I agree to the Terms of Service and Privacy Policy" checked={formData.agreed} onChange={handleChange} required />
                <div className="d-flex justify-content-between mt-3">
                  <Button onClick={prevStep}>Back</Button>
                  <Button type="submit">Sign Up</Button>
                </div>
              </>
            )}
            <p className="mt-3 text-center">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SignupForm;