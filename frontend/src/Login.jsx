import React, { useState } from 'react';
import { Form, Button, Card, Alert, Container, Row, Col } from 'react-bootstrap';
import { IndianRupee, User, Lock, Mail, UserPlus } from 'lucide-react';
import axios from 'axios';

function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '', email: '', full_name: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      
      // Prepare the payload
      const payload = isRegister 
        ? {
            username: form.username,
            password: form.password,
            email: form.email,
            full_name: form.full_name
          }
        : {
            username: form.username,
            password: form.password
          };

      console.log('Sending request to:', endpoint);
      console.log('Payload:', payload);
      
      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response:', response.data);
      
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.access_token, response.data.user);
      
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          `${isRegister ? 'Registration' : 'Login'} failed. Please try again.`;
      setError(errorMessage);
    }
    
    setLoading(false);
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Container>
        <Row className="justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
          <Col md={6} lg={5}>
            <Card className="shadow-sm border-0" style={{ borderRadius: "12px" }}>
              <Card.Body className="p-5">
                <div className="text-center mb-4">
                  <IndianRupee size={48} className="text-success mb-3" />
                  <h2 className="fw-bold text-dark">Lxcriz Tracker</h2>
                  <p className="text-muted">Smart expense management</p>
                </div>

                {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold">
                      <User size={16} className="me-2" />
                      Username
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="username"
                      placeholder="Enter username"
                      value={form.username}
                      onChange={handleChange}
                      required
                      style={{ borderRadius: "8px", padding: "0.75rem" }}
                    />
                  </Form.Group>

                  {isRegister && (
                    <>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                          <Mail size={16} className="me-2" />
                          Email
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="Enter email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          style={{ borderRadius: "8px", padding: "0.75rem" }}
                        />
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold">
                          <UserPlus size={16} className="me-2" />
                          Full Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          name="full_name"
                          placeholder="Enter full name"
                          value={form.full_name}
                          onChange={handleChange}
                          required
                          style={{ borderRadius: "8px", padding: "0.75rem" }}
                        />
                      </Form.Group>
                    </>
                  )}

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold">
                      <Lock size={16} className="me-2" />
                      Password
                    </Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      placeholder="Enter password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      style={{ borderRadius: "8px", padding: "0.75rem" }}
                    />
                    <Form.Text className="text-muted">
                      {isRegister ? 'Minimum 6 characters' : 'Enter your password'}
                    </Form.Text>
                  </Form.Group>

                  <Button 
                    variant="success" 
                    type="submit" 
                    className="w-100 py-3 fw-bold"
                    disabled={loading}
                    style={{ borderRadius: "8px" }}
                  >
                    {loading ? "Please wait..." : (isRegister ? 'Create Account' : 'Sign In')}
                  </Button>
                </Form>

                <div className="text-center mt-4">
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setIsRegister(!isRegister);
                      setError('');
                      setForm({ username: '', password: '', email: '', full_name: '' });
                    }}
                    className="text-decoration-none"
                  >
                    {isRegister ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default Login;
