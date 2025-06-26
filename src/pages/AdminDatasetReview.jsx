import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react'; // Added useMemo
import {
  FiSearch, FiFilter, FiDownload, FiShare2, FiStar,
  FiUser, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import {
  FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFile
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styling/datasets.css";
import TopNavigationBar from '../components/topnav';
import { AuthContext } from '../context/AuthContext.jsx';


// --- Helper Functions ---

// Helper to get file type icon
const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return <FaFilePdf />;
      case 'doc':
      case 'docx': return <FaFileWord />;
      case 'xls':
      case 'xlsx':
      case 'csv': return <FaFileExcel />;
      case 'txt': return <FaFileAlt />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return <FaFile />;
      case 'ipynb': return <FaFileAlt />; // Jupyter Notebook icon
      case 'py': return <FaFileAlt />; // Python script icon
      case 'r': return <FaFileAlt />; // R script icon
      case 'json': return <FaFileAlt />; // JSON file icon
      case 'zip': return <FaFileAlt />; // ZIP file icon
      default: return <FaFile />;
    }
};

// Helper to format bytes to human-readable string
const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EH', 'ZL', 'YL'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper to format approval status (0=Pending, 1=Approved, 2=Rejected)
const formatApprovalStatus = (status) => {
    switch (status) {
        case 0: return 'Pending Review';
        case 1: return 'Approved';
        case 2: return 'Rejected';
        default: return 'Unknown Status';
    }
};
// --- End Helper Functions ---


export default function AdminDatasetReview() {
  const [datasets, setDatasets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loadingDatasets, setLoadingDatasets] = useState(true);

  const navigate = useNavigate();
  const { user, token, logout, loading: authLoading } = useContext(AuthContext);

  // --- FIX: Memoize authAxios instance ---
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
  }, [token]); // Dependency array: recreate instance only if token changes

  const fetchDatasetsForReview = useCallback(async () => {
    setLoadingDatasets(true);
    setError('');
    setMessage('');
    try {
      const res = await authAxios.get('/api/admin/datasets/pending');
      setDatasets(res.data);
    } catch (err) {
      console.error("Fetch datasets for review error:", err);
      setError(err.response?.data?.message || "Failed to fetch datasets for review.");
      // Do not navigate here, let the useEffect handle global auth/role checks
    } finally {
      setLoadingDatasets(false);
    }
  }, [authAxios]); // Dependency: authAxios (which is now memoized)

  // Effect to handle initial authentication and redirection
  useEffect(() => {
    if (!authLoading) { // Only run once auth context has finished loading
      if (!user || !token) {
        console.log("AdminDatasetReview: Not authenticated, redirecting to login.");
        navigate("/login");
      } else if (user.role !== 'admin') {
        console.log("AdminDatasetReview: Not an admin, redirecting to dashboard.");
        navigate("/dashboard");
      } else {
        // If authenticated as admin, proceed to fetch data
        fetchDatasetsForReview();
      }
    }
  }, [authLoading, user, token, navigate, fetchDatasetsForReview]); // Re-run if these dependencies change


  const categories = ['All', ...new Set(datasets.map(d => d.category || 'Uncategorized'))];

  const filteredDatasets = datasets.filter(d => {
    const matchesSearch = (d.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (d.tags && d.tags.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleApproval = async (datasetId, actionType) => {
    setError('');
    setMessage('');
    try {
      const endpoint = `/api/admin/datasets/${datasetId}/status`;
      await authAxios.patch(endpoint, { action: actionType });

      setMessage(`Dataset ${actionType}d successfully!`);
      fetchDatasetsForReview();
    } catch (err) {
      console.error(`Failed to ${actionType} dataset:`, err);
      setError(err.response?.data?.message || `Failed to ${actionType} dataset.`);
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout(); // Logout if token is expired or unauthorized
        navigate("/login");
      }
    }
  };

  const handleDownload = (filename) => {
    if (!token) {
      alert("You must be logged in to download files.");
      navigate("/login");
      return;
    }
    window.open(`http://localhost:5000/uploads/${filename}?token=${token}`, '_blank');
  };

  // Render loading state while AuthContext is processing or datasets are being fetched
  if (authLoading || loadingDatasets) {
    return (
      <>
        <TopNavigationBar />
        <div className="datasets-container">Loading data...</div>
      </>
    );
  }

  return (
    <>
      <TopNavigationBar />
      <div className="datasets-container">
        <header className="datasets-header">
          <h1>Pending Datasets for Review</h1>
          <div className="controls">
            <div className="search-bar">
              <FiSearch />
              <input
                type="text"
                placeholder="Search pending datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-dropdown">
              <FiFilter />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {error && <div className="alert alert-danger">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        <div className="dataset-grid">
          {filteredDatasets.length > 0 ? (
            filteredDatasets.map(dataset => (
              <div key={dataset.id} className="dataset-card review-card">
                <div className="file-icon">
                  {getFileIcon(dataset.filename)}
                </div>
                <div className="card-header">
                  <h3><Link to={`/datasets/${dataset.id}`}>{dataset.name}</Link></h3>
                </div>
                <div className="card-body">
                  <span className="category">{dataset.category || 'Uncategorized'}</span>
                  {dataset.uploader_username && (
                    <div className="uploader-info">
                      <FiUser /> Uploaded by: <strong>{dataset.uploader_username || dataset.uploader_email || 'N/A'}</strong>
                    </div>
                  )}
                  {dataset.description && (
                    <p className="dataset-description-preview">
                        {dataset.description.substring(0, 150)}{dataset.description.length > 150 ? '...' : ''}
                    </p>
                  )}
                  {dataset.tags && (
                    <p className="dataset-tags-preview">
                        Tags: {dataset.tags}
                    </p>
                  )}
                  <div className="meta">
                    <span>{formatBytes(dataset.size || 0)}</span>
                    <span>•</span>
                    <span>Current Status: <strong>
                      {formatApprovalStatus(dataset.approved)}
                    </strong></span>
                    <span>•</span>
                    <span>Uploaded {dataset.created_at ? new Date(dataset.created_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
                <div className="card-footer review-actions">
                  <button className="download-btn" onClick={() => handleDownload(dataset.filename)}>
                    <FiDownload /> Review File
                  </button>
                  <button className="approve-btn" onClick={() => handleApproval(dataset.id, 'approve')}>
                    <FiCheckCircle /> Approve
                  </button>
                  <button className="reject-btn" onClick={() => handleApproval(dataset.id, 'reject')}>
                    <FiXCircle /> Reject
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">No pending datasets found for review.</p>
          )}
        </div>
      </div>
    </>
  );
}
