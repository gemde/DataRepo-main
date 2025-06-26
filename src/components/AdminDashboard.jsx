import React, { useEffect, useState, useContext, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Tabs, Tab, Row, Col, Form } from 'react-bootstrap'; // Added Form
import axios from 'axios';
import { AuthContext } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';
import '../styling/adminDashboard.css'; // Add styling for Admin Dashboard

function AdminDashboard() {
    const { user, token, logout, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [pendingDatasets, setPendingDatasets] = useState([]);
    const [loadingDatasets, setLoadingDatasets] = useState(true);
    const [errorDatasets, setErrorDatasets] = useState('');

    const [allUsers, setAllUsers] = useState([]); // Renamed from 'users' for clarity
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [errorUsers, setErrorUsers] = useState('');

    // State for new user form (from your provided code)
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminFirstName, setNewAdminFirstName] = useState('');
    const [newAdminLastName, setNewAdminLastName] = useState('');
    const [newUserRole, setNewUserRole] = useState('user'); // Default to 'user'

    const [key, setKey] = useState('datasets'); // For tab control

    // Create a memoized axios instance to avoid re-creating it on every render
    const authAxios = React.useMemo(() => axios.create({
        baseURL: 'http://localhost:5000',
        headers: {
            Authorization: `Bearer ${token}`
        }
    }), [token]);

    const fetchPendingDatasets = useCallback(async () => {
        if (!token || user?.role !== 'admin') {
            setErrorDatasets('Unauthorized: Not an admin or not logged in.');
            setLoadingDatasets(false);
            return;
        }
        setLoadingDatasets(true);
        setErrorDatasets('');
        try {
            const response = await authAxios.get('/api/admin/datasets/pending');
            setPendingDatasets(response.data);
        } catch (err) {
            console.error('Error fetching pending datasets:', err);
            setErrorDatasets(err.response?.data?.message || 'Failed to fetch pending datasets.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate("/login");
            }
        } finally {
            setLoadingDatasets(false);
        }
    }, [user, token, logout, navigate, authAxios]);

    const fetchAllUsers = useCallback(async () => {
        if (!token || user?.role !== 'admin') {
            setErrorUsers('Unauthorized: Not an admin or not logged in.');
            setLoadingUsers(false);
            return;
        }
        setLoadingUsers(true);
        setErrorUsers('');
        try {
            const response = await authAxios.get('/api/admin/users');
            setAllUsers(response.data); // Use setAllUsers
        } catch (err) {
            console.error('Error fetching all users:', err);
            setErrorUsers(err.response?.data?.message || 'Failed to fetch user list.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate("/login");
            }
        } finally {
            setLoadingUsers(false);
        }
    }, [user, token, logout, navigate, authAxios]);

    useEffect(() => {
        if (!authLoading && user && user.role === 'admin' && token) {
            if (key === 'datasets') {
                fetchPendingDatasets();
            } else if (key === 'users') {
                fetchAllUsers();
            }
        } else if (!authLoading && (!user || user?.role !== 'admin')) {
            alert("Access Denied: You must be an administrator to view this page."); // This will be caught by App.js PrivateRoute usually
            navigate("/"); // Redirect non-admins or unauthenticated users
        }
    }, [authLoading, user, token, navigate, fetchPendingDatasets, fetchAllUsers, key]);

    const handleDatasetStatusUpdate = async (datasetId, action) => {
        // Replaced alert with window.confirm as per prior discussions for preview environment context
        if (!window.confirm(`Are you sure you want to ${action} this dataset?`)) {
            return;
        }
        try {
            await authAxios.patch(`/api/admin/datasets/${datasetId}/status`, { action });
            alert(`Dataset ${action}ed successfully!`); // Kept alert for immediate feedback
            fetchPendingDatasets(); // Refresh the list
        } catch (err) {
            console.error(`Error ${action}ing dataset:`, err);
            alert(`Failed to ${action} dataset: ` + (err.response?.data?.message || 'Server error.'));
        }
    };

    const handleUserDelete = async (userId, userEmail) => {
        if (user.id === userId) {
            alert("You cannot delete your own admin account.");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete user ${userEmail}? This cannot be undone.`)) {
            return;
        }
        try {
            await authAxios.delete(`/api/admin/users/${userId}`);
            alert(`User ${userEmail} deleted successfully.`);
            fetchAllUsers(); // Refresh the user list
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user: ' + (err.response?.data?.message || 'Server error.'));
        }
    };

    const updateUserRole = async (id, newRole) => {
        if (!window.confirm(`Are you sure you want to change user role to ${newRole}?`)) {
            return;
        }
        try {
            await authAxios.patch(`/api/admin/users/${id}`, { role: newRole });
            alert(`User role updated to ${newRole} successfully.`);
            fetchAllUsers();
        } catch (err) {
            console.error("Error updating user role:", err);
            alert("Failed to update user role: " + (err.response?.data?.message || "Server error."));
        }
    };

    const createUser = async (e) => {
        e.preventDefault();
        setErrorUsers(''); // Use specific error state for users
        // No specific message state for this action, relies on alert or re-fetch

        try {
            await authAxios.post("/api/admin/users", {
                first_name: newAdminFirstName,
                last_name: newAdminLastName,
                email: newAdminEmail,
                password: newAdminPassword,
                role: newUserRole,
            });
            alert(`${newUserRole === 'admin' ? 'Admin' : 'User'} created successfully.`); // Use alert for success feedback
            fetchAllUsers(); // Refresh users list
            // Reset form fields
            setNewAdminFirstName('');
            setNewAdminLastName('');
            setNewAdminEmail('');
            setNewAdminPassword('');
            setNewUserRole('user'); // Reset role to default after creation

        } catch (err) {
            console.error("Error creating user:", err);
            setErrorUsers(err.response?.data?.message || `Failed to create ${newUserRole}.`);
        }
    };

    // Helper function (duplicate from DatasetDetail, consider a shared utils file)
    const formatApprovalStatus = (status) => {
        switch (status) {
            case 0: return 'Pending Review';
            case 1: return 'Approved';
            case 2: return 'Rejected';
            default: return 'Unknown Status';
        }
    };

    if (authLoading || (key === 'datasets' && loadingDatasets) || (key === 'users' && loadingUsers)) {
        return (
            <Container className="admin-dashboard-page mt-4 text-center">
                <Spinner animation="border" role="status" className="mb-3" />
                <p>Loading admin data...</p>
            </Container>
        );
    }

    if (!user || user.role !== 'admin') {
        // This case should ideally be handled by App.js PrivateRoute, but for safety:
        return (
            <Container className="admin-dashboard-page mt-4">
                <Alert variant="danger" className="text-center">
                    Access Denied: You do not have administrator privileges.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="admin-dashboard-page mt-4">
            <h2 className="text-center mb-4">Administrator Dashboard</h2>

            <Tabs
                id="admin-dashboard-tabs"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
            >
                <Tab eventKey="datasets" title="Dataset Review">
                    <Row className="mb-3 align-items-center">
                        <Col>
                            <h4 className="my-3">Pending Dataset Submissions</h4>
                        </Col>
                        <Col className="text-end">
                            <Button variant="outline-primary" onClick={fetchPendingDatasets}>Refresh List</Button>
                        </Col>
                    </Row>
                    {errorDatasets && <Alert variant="danger">{errorDatasets}</Alert>}
                    {pendingDatasets.length === 0 ? (
                        <Alert variant="info" className="text-center">No pending datasets for review.</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Dataset Name</th>
                                        <th>Uploader</th>
                                        <th>Category</th>
                                        <th>Uploaded On</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingDatasets.map(dataset => (
                                        <tr key={dataset.id}>
                                            <td>{dataset.id}</td>
                                            <td>{dataset.name}</td>
                                            <td>{dataset.uploader_username || dataset.uploader_email}</td>
                                            <td>{dataset.category}</td>
                                            <td>{new Date(dataset.last_updated).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`status-badge status-${formatApprovalStatus(dataset.approved).toLowerCase().replace(/ /g, '-')}`}>
                                                    {formatApprovalStatus(dataset.approved)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button variant="success" size="sm" onClick={() => handleDatasetStatusUpdate(dataset.id, 'approve')}>
                                                        <FiCheckCircle className="me-1" /> Approve
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleDatasetStatusUpdate(dataset.id, 'reject')}>
                                                        <FiXCircle className="me-1" /> Reject
                                                    </Button>
                                                    <Link to={`/datasets/${dataset.id}`} className="btn btn-info btn-sm">
                                                        <FiInfo className="me-1" /> View Details
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Tab>

                <Tab eventKey="users" title="User Management">
                    <Row className="mb-3 align-items-center">
                        <Col>
                            <h4 className="my-3">All Registered Users</h4>
                        </Col>
                        <Col className="text-end">
                            <Button variant="outline-primary" onClick={fetchAllUsers}>Refresh List</Button>
                        </Col>
                    </Row>
                    {errorUsers && <Alert variant="danger">{errorUsers}</Alert>}
                    {allUsers.length === 0 ? (
                        <Alert variant="info" className="text-center">No users found.</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>First Name</th>
                                        <th>Last Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allUsers.map(userItem => (
                                        <tr key={userItem.id}>
                                            <td>{userItem.id}</td>
                                            <td>{userItem.first_name}</td>
                                            <td>{userItem.last_name}</td>
                                            <td>{userItem.email}</td>
                                            <td>{userItem.role}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    {userItem.role !== 'admin' && (
                                                        <Button variant="warning" size="sm" onClick={() => updateUserRole(userItem.id, 'admin')}>
                                                            Make Admin
                                                        </Button>
                                                    )}
                                                    {userItem.role === 'admin' && user.id !== userItem.id && (
                                                        <Button variant="info" size="sm" onClick={() => updateUserRole(userItem.id, 'user')}>
                                                            Demote Admin
                                                        </Button>
                                                    )}
                                                    {user.id !== userItem.id && (
                                                        <Button variant="danger" size="sm" onClick={() => handleUserDelete(userItem.id, userItem.email)}>
                                                            Delete
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}

                    {/* Form to Create New User (Admin or Regular) */}
                    <h3 className="my-3">Create New User</h3>
                    <Form onSubmit={createUser} className="p-4 border rounded-lg shadow-sm bg-light">
                        <Row className="mb-3">
                            <Form.Group as={Col} controlId="formGridFirstName">
                                <Form.Label>First Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter first name"
                                    value={newAdminFirstName}
                                    onChange={(e) => setNewAdminFirstName(e.target.value)}
                                    required
                                />
                            </Form.Group>

                            <Form.Group as={Col} controlId="formGridLastName">
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Enter last name"
                                    value={newAdminLastName}
                                    onChange={(e) => setNewAdminLastName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Row>

                        <Form.Group className="mb-3" controlId="formGridEmail">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="formGridPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formGridRole">
                            <Form.Label>Role</Form.Label>
                            <Form.Select
                                value={newUserRole}
                                onChange={(e) => setNewUserRole(e.target.value)}
                                required
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </Form.Select>
                        </Form.Group>

                        <Button variant="primary" type="submit">
                            Add New User
                        </Button>
                    </Form>
                </Tab>
                {/* Removed Contests Management tab as it was not in your provided code
                <Tab eventKey="contests" title="Contest Review">
                     <Row className="mb-3 align-items-center">
                        <Col>
                            <h4 className="my-3">Pending Contest Submissions</h4>
                        </Col>
                        <Col className="text-end">
                            <Button variant="outline-primary" onClick={fetchPendingContests}>Refresh List</Button>
                        </Col>
                    </Row>
                    {errorContests && <Alert variant="danger">{errorContests}</Alert>}
                    {pendingContests.length === 0 ? (
                        <Alert variant="info" className="text-center">No pending contests for review.</Alert>
                    ) : (
                        <div className="table-responsive">
                            <Table striped bordered hover className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Contest Title</th>
                                        <th>Uploader</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingContests.map(contest => (
                                        <tr key={contest.id}>
                                            <td>{contest.id}</td>
                                            <td>{contest.title}</td>
                                            <td>{contest.uploader_username || contest.uploader_email}</td>
                                            <td>
                                                <span className={`status-badge status-${formatApprovalStatus(contest.approved).toLowerCase().replace(/ /g, '-')}`}>
                                                    {formatApprovalStatus(contest.approved)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button variant="success" size="sm" onClick={() => handleContestStatusUpdate(contest.id, 'approve')}>
                                                        <FiCheckCircle className="me-1" /> Approve
                                                    </Button>
                                                    <Button variant="danger" size="sm" onClick={() => handleContestStatusUpdate(contest.id, 'reject')}>
                                                        <FiXCircle className="me-1" /> Reject
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    )}
                </Tab>
                */}
            </Tabs>
        </Container>
    );
}

// Helper function (duplicate from DatasetDetail, consider a shared utils file)
const formatApprovalStatus = (status) => {
    switch (status) {
        case 0: return 'Pending Review';
        case 1: return 'Approved';
        case 2: return 'Rejected';
        default: return 'Unknown Status';
    }
};

export default AdminDashboard;
