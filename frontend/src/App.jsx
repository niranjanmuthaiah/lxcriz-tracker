import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container, Row, Col, Form, Button, Table, Badge, Card, 
  Modal, Alert, Spinner, ProgressBar, Dropdown
} from "react-bootstrap";
import { 
  PlusCircle, Edit, Trash2, IndianRupee, TrendingUp, 
  Calendar, Filter, Download, Search, LogOut, User
} from "lucide-react";
import Charts from './Charts';
import Login from './Login';

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: "", amount: "", category: "" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [alert, setAlert] = useState(null);
  const [dateRange, setDateRange] = useState("all");
  
  // Auth states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const API = "/api";

  // Check for existing auth on component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
      
      // Set default axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
    }
  }, []);

  useEffect(() => { 
    if (isAuthenticated) {
      fetchExpenses(); 
    }
  }, [isAuthenticated]);

  const handleLogin = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    setIsAuthenticated(true);
    
    // Set default axios header
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    showAlert(`Welcome back, ${userData.full_name}!`, "success");
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setExpenses([]);
    
    showAlert("Logged out successfully!", "info");
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/expenses`);
      setExpenses(data);
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
        showAlert("Session expired. Please login again.", "warning");
      } else {
        showAlert("Error fetching expenses", "danger");
      }
    }
    setLoading(false);
  };

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editing) {
        await axios.put(`${API}/expenses/${editing.id}`, {
          ...form, amount: parseFloat(form.amount)
        });
        showAlert("Expense updated successfully!");
        setEditing(null);
      } else {
        await axios.post(`${API}/expenses`, {
          ...form, amount: parseFloat(form.amount)
        });
        showAlert("Expense added successfully!");
      }
      setForm({ description: "", amount: "", category: "" });
      setShowModal(false);
      fetchExpenses();
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        showAlert("Error saving expense", "danger");
      }
    }
    setLoading(false);
  };

  const handleEdit = (exp) => {
    setEditing(exp);
    setForm({ description: exp.description, amount: exp.amount, category: exp.category });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    
    setLoading(true);
    try {
      await axios.delete(`${API}/expenses/${id}`);
      showAlert("Expense deleted successfully!");
      fetchExpenses();
    } catch (error) {
      if (error.response?.status === 401) {
        handleLogout();
      } else {
        showAlert("Error deleting expense", "danger");
      }
    }
    setLoading(false);
  };

  const openModal = () => {
    setForm({ description: "", amount: "", category: "" });
    setEditing(null);
    setShowModal(true);
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Filter and search logic
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = filter === "all" || exp.category === filter;
    const matchesSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const total = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const byCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  const categories = ["Food", "Transport", "Entertainment", "Shopping", "Bills", "Health", "Other"];
  const categoryColors = {
    "Food": "success", "Transport": "primary", "Entertainment": "warning",
    "Shopping": "info", "Bills": "danger", "Health": "secondary", "Other": "dark"
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Container className="py-4">
        {/* Header */}
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <IndianRupee size={40} className="text-success me-3" />
                <div>
                  <h1 className="mb-0 text-dark fw-bold">Lxcriz Tracker</h1>
                  <p className="text-muted mb-0">Welcome back, {user?.full_name}!</p>
                </div>
              </div>
              <div className="d-flex align-items-center gap-3">
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={openModal}
                  className="d-flex align-items-center shadow-sm"
                >
                  <PlusCircle size={20} className="me-2" />
                  Add Expense
                </Button>
                <Dropdown>
                  <Dropdown.Toggle variant="outline-secondary" className="d-flex align-items-center">
                    <User size={20} className="me-2" />
                    {user?.username}
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={handleLogout}>
                      <LogOut size={16} className="me-2" />
                      Logout
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          </Col>
        </Row>

        {/* Alert */}
        {alert && (
          <Alert variant={alert.type} className="mb-4">
            {alert.message}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Row className="mb-4">
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <div className="text-success mb-2">
                  <IndianRupee size={32} />
                </div>
                <h3 className="fw-bold text-success">₹{total.toFixed(2)}</h3>
                <p className="text-muted mb-0">Total Expenses</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <div className="text-primary mb-2">
                  <TrendingUp size={32} />
                </div>
                <h3 className="fw-bold text-primary">{filteredExpenses.length}</h3>
                <p className="text-muted mb-0">Total Transactions</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <div className="text-warning mb-2">
                  <Calendar size={32} />
                </div>
                <h3 className="fw-bold text-warning">
                  ₹{filteredExpenses.length ? (total / filteredExpenses.length).toFixed(2) : "0.00"}
                </h3>
                <p className="text-muted mb-0">Average per Transaction</p>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={3} md={6} className="mb-3">
            <Card className="h-100 shadow-sm border-0">
              <Card.Body className="text-center">
                <div className="text-info mb-2">
                  <Filter size={32} />
                </div>
                <h3 className="fw-bold text-info">{Object.keys(byCategory).length}</h3>
                <p className="text-muted mb-0">Categories Used</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Category Breakdown */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0 fw-bold">Category Breakdown</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              {Object.entries(byCategory).map(([cat, amt]) => (
                <Col lg={3} md={4} sm={6} key={cat} className="mb-3">
                  <div className="d-flex align-items-center justify-content-between p-3 rounded" 
                       style={{ backgroundColor: "#f8f9fa" }}>
                    <div>
                      <h6 className="mb-0">{cat}</h6>
                      <Badge bg={categoryColors[cat] || "secondary"}>
                        ₹{amt.toFixed(2)}
                      </Badge>
                    </div>
                    <div style={{ width: "40px" }}>
                      <ProgressBar 
                        now={(amt / total) * 100} 
                        variant={categoryColors[cat] || "secondary"}
                        style={{ height: "8px" }}
                      />
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>

        {/* Charts Section */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0 fw-bold">📊 Expense Analytics</h5>
          </Card.Header>
          <Card.Body>
            <Charts expenses={filteredExpenses} />
          </Card.Body>
        </Card>

        {/* Filters and Search */}
        <Card className="mb-4 shadow-sm border-0">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    <Search size={16} className="me-2" />
                    Search Expenses
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">
                    <Filter size={16} className="me-2" />
                    Filter by Category
                  </Form.Label>
                  <Form.Select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4} className="text-end">
                <Button variant="outline-primary" className="me-2">
                  <Download size={16} className="me-2" />
                  Export CSV
                </Button>
                <Badge bg="light" text="dark" className="fs-6 p-2">
                  Showing {filteredExpenses.length} of {expenses.length} expenses
                </Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Expenses Table */}
        <Card className="shadow-sm border-0">
          <Card.Header className="bg-white border-bottom">
            <h5 className="mb-0 fw-bold">Recent Expenses</h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">Loading expenses...</p>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="text-center py-5">
                <IndianRupee size={48} className="text-muted mb-3" />
                <h5 className="text-muted">No expenses found</h5>
                <p className="text-muted">Add your first expense to get started!</p>
                <Button variant="success" onClick={openModal}>
                  <PlusCircle size={16} className="me-2" />
                  Add Expense
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-0 fw-bold">Description</th>
                      <th className="border-0 fw-bold">Amount</th>
                      <th className="border-0 fw-bold">Category</th>
                      <th className="border-0 fw-bold">Date</th>
                      <th className="border-0 fw-bold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td className="py-3">
                          <strong>{exp.description}</strong>
                        </td>
                        <td className="py-3">
                          <Badge bg="success" className="fs-6">
                            ₹{exp.amount.toFixed(2)}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Badge bg={categoryColors[exp.category] || "secondary"}>
                            {exp.category}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-center">
                          <Button 
                            size="sm" 
                            variant="outline-primary" 
                            className="me-2"
                            onClick={() => handleEdit(exp)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleDelete(exp.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Add/Edit Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {editing ? "Edit Expense" : "Add New Expense"}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  name="description"
                  placeholder="Enter expense description"
                  value={form.description}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Amount (₹)</Form.Label>
                <Form.Control
                  name="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
                <Form.Text className="text-muted">Enter amount in Indian Rupees (₹)</Form.Text>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Category</Form.Label>
                <Form.Select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                {loading && <Spinner size="sm" className="me-2" />}
                {editing ? "Update Expense" : "Add Expense"}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </Container>
    </div>
  );
}

export default App;
