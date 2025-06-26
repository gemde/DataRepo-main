import React, { useEffect, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Spinner, Alert, Row, Col, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import {
    FiDownload, FiInfo, FiUser, FiCalendar, FiHardDrive, FiHash, FiTag, FiFileText, FiGlobe, FiEye, FiStar
} from 'react-icons/fi';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFile
} from 'react-icons/fa';
import '../styling/datasetDetail.css'; // Assuming you have or will create this CSS file

// Helper Functions (can be put in a utils file if preferred)
const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return <FaFilePdf className="file-icon-detail" />;
      case 'doc':
      case 'docx': return <FaFileWord className="file-icon-detail" />;
      case 'xls':
      case 'xlsx':
      case 'csv': return <FaFileExcel className="file-icon-detail" />;
      case 'txt': return <FaFileAlt className="file-icon-detail" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return <FaFile className="file-icon-detail" />;
      case 'ipynb': return <FaFileAlt className="file-icon-detail" />;
      case 'py': return <FaFileAlt className="file-icon-detail" />;
      case 'r': return <FaFileAlt className="file-icon-detail" />;
      case 'json': return <FaFileAlt className="file-icon-detail" />;
      case 'zip': return <FaFileAlt className="file-icon-detail" />;
      default: return <FaFile className="file-icon-detail" />;
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

function DatasetDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token, logout, loading: authLoading } = useContext(AuthContext);

    const [dataset, setDataset] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const authAxios = axios.create({
        baseURL: 'http://localhost:5000',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const fetchDataset = useCallback(async () => {
        if (!token) {
            setError('Authentication required to view dataset details.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError('');
        try {
            const response = await authAxios.get(`/api/datasets/${id}`);
            setDataset(response.data);
        } catch (err) {
            console.error('Error fetching dataset details:', err);
            setError(err.response?.data?.message || 'Failed to load dataset details.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [id, token, logout, navigate, authAxios]);

    useEffect(() => {
        if (!authLoading && user && token) {
            fetchDataset();
        } else if (!authLoading && (!user || !token)) {
            // Redirect to login if not authenticated and not currently loading auth
            navigate('/login');
        }
    }, [authLoading, user, token, navigate, fetchDataset]);

    const handleDownload = async () => {
        try {
            const response = await authAxios.get(`/api/datasets/${dataset.id}/download`, {
                responseType: 'blob' // Important for file downloads
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', dataset.filename); // Use the actual filename
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading dataset:', err);
            alert('Failed to download dataset. Please try again.');
        }
    };

    if (authLoading || loading) {
        return (
            <Container className="dataset-detail-page text-center mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading dataset...</span>
                </Spinner>
                <p className="mt-2">Loading dataset details...</p>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="dataset-detail-page mt-5">
                <Alert variant="danger" className="text-center">
                    {error}
                    {error.includes("Authentication required") && <Button variant="link" onClick={() => navigate('/login')}>Login Now</Button>}
                </Alert>
                <div className="text-center">
                    <Button variant="secondary" onClick={() => navigate('/datasets')}>Back to My Datasets</Button>
                </div>
            </Container>
        );
    }

    if (!dataset) {
        return (
            <Container className="dataset-detail-page mt-5">
                <Alert variant="info" className="text-center">Dataset not found or no data available.</Alert>
                <div className="text-center">
                    <Button variant="secondary" onClick={() => navigate('/datasets')}>Back to My Datasets</Button>
                </div>
            </Container>
        );
    }

    const isOwner = user && dataset && user.id === dataset.user_id;
    const isAdmin = user && user.role === 'admin';

    return (
        <Container className="dataset-detail-page mt-4">
            <h2 className="text-center mb-4">{dataset.name}</h2>
            <Row className="justify-content-center">
                <Col md={8}>
                    <Card className="shadow-sm dataset-detail-card">
                        <Card.Body>
                            <div className="d-flex align-items-center mb-3">
                                <span className="file-icon-large me-3">{getFileIcon(dataset.filename)}</span>
                                <div>
                                    <h4 className="card-title mb-0">{dataset.name}</h4>
                                    <small className="text-muted">{dataset.filename}</small>
                                </div>
                            </div>

                            <hr />

                            <Row className="mb-3">
                                <Col sm={6}>
                                    <p><FiInfo className="me-2 detail-icon" /> **ID:** {dataset.id}</p>
                                    <p><FiCalendar className="me-2 detail-icon" /> **Uploaded On:** {new Date(dataset.last_updated).toLocaleDateString()}</p>
                                    <p><FiHardDrive className="me-2 detail-icon" /> **Size:** {formatBytes(dataset.size)}</p>
                                    <p><FiTag className="me-2 detail-icon" /> **Category:** {dataset.category || 'N/A'}</p>
                                </Col>
                                <Col sm={6}>
                                    <p><FiUser className="me-2 detail-icon" /> **Uploader:** {dataset.uploader_first_name} {dataset.uploader_last_name} ({dataset.uploader_email})</p>
                                    <p><FiEye className="me-2 detail-icon" /> **Visibility:** {dataset.is_public ? 'Public' : 'Private'}</p>
                                    <p><FiHash className="me-2 detail-icon" /> **File Type:** {dataset.filetype || 'Unknown'}</p>
                                    <p>
                                        <span className="me-2 detail-icon" style={{ display: 'inline-block', width: '20px' }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-circle" viewBox="0 0 16 16">
                                                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                                                <path d="m10.97 4.97-4.97 4.97-4.97-4.97A.75.75 0 0 1 3.22 5.03L7.5 9.31l4.28-4.28a.75.75 0 0 1 1.06 1.06z"/>
                                            </svg>
                                        </span>
                                        **Approval Status:**
                                        <span className={`status-badge status-${formatApprovalStatus(dataset.approved).toLowerCase().replace(/ /g, '-')}`}>
                                            {formatApprovalStatus(dataset.approved)}
                                        </span>
                                    </p>
                                </Col>
                            </Row>

                            <hr />

                            <p><FiFileText className="me-2 detail-icon" /> **Description:**</p>
                            <Card.Text className="detail-description">{dataset.description || 'No description provided.'}</Card.Text>

                            <p className="mt-3"><FiTag className="me-2 detail-icon" /> **Tags:**</p>
                            <Card.Text className="detail-tags">
                                {dataset.tags ? dataset.tags.split(',').map((tag, index) => (
                                    <span key={index} className="badge bg-secondary me-2 mb-1">{tag.trim()}</span>
                                )) : 'No tags provided.'}
                            </Card.Text>

                            <div className="d-flex justify-content-center gap-3 mt-4">
                                <Button variant="success" onClick={handleDownload} disabled={dataset.approved !== 1}>
                                    <FiDownload className="me-2" /> Download Dataset
                                </Button>
                                {(isOwner || isAdmin) && (dataset.approved === 0 || dataset.approved === 2) && (
                                     <Link to={`/edit-dataset/${dataset.id}`} className="btn btn-warning">
                                        <FiInfo className="me-2" /> Edit Metadata
                                    </Link>
                                )}
                                <Button variant="secondary" onClick={() => navigate('/datasets')}>
                                    Back to My Datasets
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default DatasetDetail;
