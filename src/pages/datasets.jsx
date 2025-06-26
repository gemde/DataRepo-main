import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styling/datasets.css';
import { AuthContext } from '../context/AuthContext.jsx';
import {
    FiDownload, FiSearch, FiInfo, FiEdit // Added FiEdit for edit icon
} from 'react-icons/fi';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFile
} from 'react-icons/fa';


// --- Helper Functions ---

const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return <FaFilePdf className="file-icon-color-pdf" />;
      case 'doc':
      case 'docx': return <FaFileWord className="file-icon-color-doc" />;
      case 'xls':
      case 'xlsx':
      case 'csv': return <FaFileExcel className="file-icon-color-xls" />;
      case 'txt': return <FaFileAlt className="file-icon-color-txt" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return <FaFile className="file-icon-color-img" />;
      case 'ipynb': return <FaFileAlt className="file-icon-color-ipynb" />;
      case 'py': return <FaFileAlt className="file-icon-color-py" />;
      case 'r': return <FaFileAlt className="file-icon-color-r" />;
      case 'json': return <FaFileAlt className="file-icon-color-json" />;
      case 'zip': return <FaFileAlt className="file-icon-color-zip" />;
      default: return <FaFile className="file-icon-color-default" />;
    }
};

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EH', 'ZL', 'YL'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatApprovalStatus = (status) => {
    switch (status) {
        case 0: return 'Pending Review';
        case 1: return 'Approved';
        case 2: return 'Rejected';
        default: return 'Unknown Status';
    }
};
// --- End Helper Functions ---


function Datasets() {
    const [datasets, setDatasets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [error, setError] = useState('');
    const [loadingDatasets, setLoadingDatasets] = useState(true);

    const { user, token, logout, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const authAxios = useMemo(() => {
        const instance = axios.create({
            baseURL: 'http://localhost:5000',
        });
        instance.interceptors.request.use(
            config => {
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            err => Promise.reject(err)
        );
        return instance;
    }, [token]);

    const categories = ['All', 'Computer Science', 'Data Science', 'Machine Learning', 'Medical', 'Finance', 'Social Science', 'Other'];

    const fetchUserDatasets = useCallback(async () => {
        if (!token || !user) {
            setLoadingDatasets(false);
            return;
        }
        setLoadingDatasets(true);
        setError('');
        try {
            const response = await authAxios.get('/api/user/datasets');
            setDatasets(response.data);
        } catch (err) {
            console.error('Error fetching user datasets:', err);
            setError(err.response?.data?.message || 'Failed to fetch your datasets.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate("/login");
            }
        } finally {
            setLoadingDatasets(false);
        }
    }, [user, token, logout, navigate, authAxios]);

    useEffect(() => {
        if (!authLoading && user && token) {
            fetchUserDatasets();
        }
        if (!authLoading && !user && !token) {
            alert("Please log in to view your datasets.");
            navigate("/login");
        }
    }, [authLoading, user, token, navigate, fetchUserDatasets]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value === 'All' ? '' : e.target.value);
    };

    const filteredDatasets = datasets.filter(dataset => {
        const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (dataset.description && dataset.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                              (dataset.tags && dataset.tags.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = selectedCategory === '' || dataset.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleDownload = async (datasetId, filename) => {
        try {
            const response = await authAxios.get(`http://localhost:5000/api/datasets/${datasetId}/download`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading dataset:', err);
            alert('Failed to download dataset. Please try again.');
        }
    };

    const handleViewDetails = (datasetId) => {
        navigate(`/datasets/${datasetId}`);
    };

    const handleNewDatasetClick = () => {
        navigate('/CreateDataset');
    };

    if (authLoading || loadingDatasets) {
        return (
            <Container className="datasets-page mt-4 text-center">
                <p>Loading your datasets...</p>
                <Spinner animation="border" role="status" />
            </Container>
        );
    }

    if (!user || !token) {
        return (
            <Container className="datasets-page mt-4">
                <Alert variant="warning" className="text-center">
                    Please log in to view your datasets.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="datasets-page mt-4">
            <h2 className="text-center mb-4">Your Datasets</h2>

            <Row className="mb-4 align-items-center">
                <Col md={6}>
                    <InputGroup>
                        <Form.Control
                            placeholder="Search your datasets by name, description, or tags..."
                            aria-label="Search datasets"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                        <Button variant="outline-secondary">
                             <FiSearch /> Search
                        </Button>
                    </InputGroup>
                </Col>
                <Col md={3} className="text-center text-md-start mt-3 mt-md-0">
                    <Form.Select
                        aria-label="Filter by category"
                        value={selectedCategory}
                        onChange={handleCategoryChange}
                    >
                        {categories.map((cat, index) => (
                            <option key={index} value={cat === 'All' ? '' : cat}>
                                {cat}
                            </option>
                        ))}
                    </Form.Select>
                </Col>
                <Col md={3} className="text-center text-md-end mt-3 mt-md-0">
                    <Button variant="primary" onClick={handleNewDatasetClick}>
                        <i className="fas fa-plus-circle me-2"></i> New Dataset
                    </Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                {filteredDatasets.length > 0 ? (
                    <div className="table-responsive"> {/* Make table responsive */}
                        <table className="table table-striped table-hover dataset-list-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Description</th> {/* New column */}
                                    <th>Tags</th> {/* New column */}
                                    <th>Size</th>
                                    <th>Uploaded On</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDatasets.map(dataset => (
                                    <tr key={dataset.id}>
                                        <td>
                                            <div className="file-item-name">
                                                {getFileIcon(dataset.filename)}
                                                <Link to={`/datasets/${dataset.id}`}>{dataset.name}</Link>
                                            </div>
                                        </td>
                                        <td>{dataset.category || 'N/A'}</td>
                                        <td>{dataset.description?.substring(0, 70)}{dataset.description?.length > 70 ? '...' : ''}</td> {/* Display description */}
                                        <td>{dataset.tags || 'N/A'}</td> {/* Display tags */}
                                        <td>{formatBytes(dataset.size)}</td>
                                        <td>{new Date(dataset.last_updated).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-badge status-${formatApprovalStatus(dataset.approved).toLowerCase().replace(/ /g, '-')}`}>
                                                {formatApprovalStatus(dataset.approved)}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="d-flex flex-wrap gap-2"> {/* Use flexbox for action buttons */}
                                                <Link to={`/datasets/${dataset.id}`} className="btn btn-outline-primary btn-sm">
                                                    <FiInfo className="me-1" /> View
                                                </Link>
                                                <Button variant="success" size="sm" onClick={() => handleDownload(dataset.id, dataset.filename)}>
                                                    <FiDownload className="me-1" /> Download
                                                </Button>
                                                {(dataset.approved === 0 || dataset.approved === 2) && (
                                                    <Link to={`/edit-dataset/${dataset.id}`} className="btn btn-warning btn-sm">
                                                        <FiEdit className="me-1" /> Edit
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Col className="text-center">
                        <p>No datasets found or you haven't uploaded any yet.</p>
                        <Button variant="info" onClick={handleNewDatasetClick}>
                            Start by Uploading a New Dataset
                        </Button>
                    </Col>
                )}
            </Row>
        </Container>
    );
}

export default Datasets;
