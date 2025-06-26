import React, { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    FiUpload, FiDatabase, FiUsers,
    FiClock, FiDownload, FiSearch, FiSettings,
    FiCheckCircle, FiXCircle, FiInfo, FiFilter,
    FiCalendar, FiHash, FiShare2
} from 'react-icons/fi';
import {
    FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFile,
    FaRegStar, FaStar // For starred datasets if applicable
} from 'react-icons/fa';
import "../styling/dashboard.css";
import TopNavigationBar from "../components/topnav";
import { AuthContext } from '../context/AuthContext.jsx';


// --- Helper Functions ---

// Helper to get file type icon
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
      case 'ipynb': return <FaFileAlt className="file-icon-color-ipynb" />; // Jupyter Notebook icon
      case 'py': return <FaFileAlt className="file-icon-color-py" />; // Python script icon
      case 'r': return <FaFileAlt className="file-icon-color-r" />; // R script icon
      case 'json': return <FaFileAlt className="file-icon-color-json" />; // JSON file icon
      case 'zip': return <FaFileAlt className="file-icon-color-zip" />; // ZIP file icon
      default: return <FaFile className="file-icon-color-default" />;
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


export default function Dashboard() {
    const [globalStats, setGlobalStats] = useState({
        totalUsers: 0,
        totalApprovedDatasets: 0,
        totalApprovedContests: 0,
    });
    const [recentFiles, setRecentFiles] = useState([]); // Global recent approved files

    const [myDatasets, setMyDatasets] = useState([]); // User-specific datasets
    const [loadingMyDatasets, setLoadingMyDatasets] = useState(true);

    // Search and filter states for global datasets section
    const [globalSearchTerm, setGlobalSearchTerm] = useState("");
    const [globalSelectedCategory, setGlobalSelectedCategory] = useState('All');
    const [globalSelectedFileType, setGlobalSelectedFileType] = useState('All');

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loadingGlobalData, setLoadingGlobalData] = useState(true);

    const navigate = useNavigate();
    const { user, token, logout, loading: authLoading } = useContext(AuthContext);

    // --- FIX: Memoize authAxios instance to prevent flickering ---
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

    const fetchGlobalDashboardData = useCallback(async () => {
        setLoadingGlobalData(true);
        try {
            const statsRes = await authAxios.get('/api/stats');
            setGlobalStats(statsRes.data);

            const filesRes = await authAxios.get('/api/recent-files');
            setRecentFiles(filesRes.data);
        } catch (err) {
            console.error('Error fetching global dashboard data:', err);
            setError(err.response?.data?.message || 'Failed to load global dashboard data. Please check server logs.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate("/login");
            }
        } finally {
            setLoadingGlobalData(false);
        }
    }, [authAxios, logout, navigate]); // Depend on memoized authAxios

    const fetchMyUploadedDatasets = useCallback(async () => {
        if (!token || !user) {
            setLoadingMyDatasets(false);
            return;
        }
        setLoadingMyDatasets(true);
        setError('');
        try {
            const res = await authAxios.get('/api/user/datasets');
            setMyDatasets(res.data);
        } catch (err) {
            console.error("Error fetching user's uploaded datasets:", err);
            setError(err.response?.data?.message || "Failed to load your uploaded datasets.");
            if (err.response?.status === 401 || err.response?.status === 403) {
                logout();
                navigate("/login");
            }
        } finally {
            setLoadingMyDatasets(false);
        }
    }, [user, token, logout, navigate, authAxios]); // Depend on memoized authAxios

    useEffect(() => {
        if (authLoading) {
            return;
        }
        if (!token) {
            alert("⚠️ You must be logged in to access the dashboard.");
            navigate("/login");
            return;
        }
        fetchGlobalDashboardData();
    }, [token, navigate, authLoading, fetchGlobalDashboardData]);


    useEffect(() => {
        if (!authLoading && user && token) {
            fetchMyUploadedDatasets();
        }
    }, [authLoading, user, token, fetchMyUploadedDatasets]);


    const handleNavigateToUpload = () => {
        navigate('/CreateDataset');
    };

    const handleDownload = (filename) => {
        if (!token) {
            alert("⚠️ You must be logged in to download files.");
            navigate("/login");
            return;
        }
        window.open(`http://localhost:5000/uploads/${filename}?token=${token}`, '_blank');
        setRecentFiles(prev =>
            prev.map(d => (d.filename === filename ? { ...d, downloads: (d.downloads || 0) + 1 } : d))
        );
    };

    // Filter for Global Recent Files (for the Kaggle-like section)
    const filteredGlobalRecentFiles = recentFiles.filter(file => {
        const matchesSearch = (file.name || "").toLowerCase().includes(globalSearchTerm.toLowerCase()) ||
                              (file.description && file.description.toLowerCase().includes(globalSearchTerm.toLowerCase())) ||
                              (file.tags && file.tags.toLowerCase().includes(globalSearchTerm.toLowerCase()));

        const matchesCategory = globalSelectedCategory === 'All' || file.category === globalSelectedCategory;
        const matchesFileType = globalSelectedFileType === 'All' || file.filetype === globalSelectedFileType;
        return matchesSearch && matchesCategory && matchesFileType;
    });

    // Collect unique categories and file types from all available datasets for filters
    const allCategories = ['All', ...new Set(recentFiles.map(d => d.category || 'Uncategorized'))];
    const allFileTypes = ['All', ...new Set(recentFiles.map(d => d.filetype || 'Unknown'))];

    // Derive counts for user's files
    const totalMyUploads = myDatasets.length;
    const myPendingCount = myDatasets.filter(d => d.approved === 0).length;
    const myApprovedCount = myDatasets.filter(d => d.approved === 1).length;
    const myRejectedCount = myDatasets.filter(d => d.approved === 2).length;


    if (authLoading) {
        return (
            <>
                <TopNavigationBar />
                <div className="dashboard-container">Loading authentication and user data...</div>
            </>
        );
    }

    if (!user || !token) {
        navigate("/login");
        return null;
    }

    return (
        <>
            <TopNavigationBar />
            <div className="dashboard-main-wrapper">
                <header className="dashboard-header-main">
                    <h1>Explore Datasets</h1>
                    <div className="search-bar-full">
                        <FiSearch />
                        <input
                            type="text"
                            placeholder="Search all datasets..."
                            value={globalSearchTerm}
                            onChange={(e) => setGlobalSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn-upload-header" onClick={handleNavigateToUpload}>
                        <FiUpload /> Upload New Dataset
                    </button>
                </header>

                <div className="dashboard-content-area">
                    <aside className="dashboard-sidebar">
                        <h2>Filters</h2>
                        <div className="filter-group">
                            <h3><FiFilter /> Category</h3>
                            <select
                                value={globalSelectedCategory}
                                onChange={(e) => setGlobalSelectedCategory(e.target.value)}
                            >
                                {allCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <h3><FiInfo /> File Type</h3>
                            <select
                                value={globalSelectedFileType}
                                onChange={(e) => setGlobalSelectedFileType(e.target.value)}
                            >
                                {allFileTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                    </aside>

                    <main className="dashboard-main-content-area">
                        {error && <div className="alert alert-danger">{error}</div>}
                        {message && <div className="alert alert-success">{message}</div>}

                        {/* User's Uploaded Files Overview */}
                        <section className="my-uploads-section">
                            <h2 className="section-title">Your Uploads</h2>
                            {loadingMyDatasets ? (
                                <p>Loading your uploaded files...</p>
                            ) : (
                                <>
                                    <div className="summary-cards">
                                        <div className="summary-card total-uploads">
                                            <FiUpload />
                                            <h3>Total Uploads</h3>
                                            <p>{totalMyUploads}</p>
                                        </div>
                                        <div className="summary-card pending-uploads">
                                            <FiClock />
                                            <h3>Pending Review</h3>
                                            <p>{myPendingCount}</p>
                                        </div>
                                        <div className="summary-card approved-uploads">
                                            <FiCheckCircle />
                                            <h3>Approved</h3>
                                            <p>{myApprovedCount}</p>
                                        </div>
                                        <div className="summary-card rejected-uploads">
                                            <FiXCircle />
                                            <h3>Rejected</h3>
                                            <p>{myRejectedCount}</p>
                                        </div>
                                    </div>

                                    <div className="my-datasets-detail-list">
                                        <h3>My Files (Detail)</h3>
                                        {myDatasets.length === 0 ? (
                                            <p className="no-results">You haven't uploaded any datasets yet. <Link to="/CreateDataset">Upload one now!</Link></p>
                                        ) : (
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Category</th>
                                                        <th>Size</th>
                                                        <th>Uploaded On</th>
                                                        <th>Status</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {myDatasets.map(dataset => (
                                                        <tr key={dataset.id}>
                                                            <td>
                                                                <div className="file-item-name">
                                                                    {getFileIcon(dataset.filename)}
                                                                    <Link to={`/datasets/${dataset.id}`}>{dataset.name}</Link>
                                                                </div>
                                                            </td>
                                                            <td>{dataset.category || 'N/A'}</td>
                                                            <td>{formatBytes(dataset.size)}</td>
                                                            <td>{new Date(dataset.last_updated).toLocaleDateString()}</td>
                                                            <td>
                                                                <span className={`status-badge status-${formatApprovalStatus(dataset.approved).toLowerCase().replace(/ /g, '-')}`}>
                                                                    {formatApprovalStatus(dataset.approved)}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <Link to={`/datasets/${dataset.id}`} className="action-link">
                                                                    <FiInfo /> View
                                                                </Link>
                                                                {/* NEW: Edit button for datasets that are pending or rejected */}
                                                                {(dataset.approved === 0 || dataset.approved === 2) && (
                                                                    <Link to={`/edit-dataset/${dataset.id}`} className="action-button edit-btn">
                                                                        Edit
                                                                    </Link>
                                                                )}
                                                                {dataset.approved === 2 && ( // Show Re-upload button only if rejected
                                                                    <button className="action-button reupload-btn" onClick={() => navigate('/CreateDataset')}>
                                                                        Re-upload
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </>
                            )}
                        </section>

                        {/* Global Datasets Browse Section (Kaggle-like cards) */}
                        <section className="global-datasets-section">
                            <h2 className="section-title">Global Approved Datasets</h2>
                            {loadingGlobalData ? (
                                <p>Loading global datasets...</p>
                            ) : (
                                <>
                                    {filteredGlobalRecentFiles.length > 0 ? (
                                        <div className="dataset-cards-grid">
                                            {filteredGlobalRecentFiles.map(dataset => (
                                                <div key={dataset.id} className="dataset-card">
                                                    <div className="card-header-icon">{getFileIcon(dataset.filename)}</div>
                                                    <h3 className="card-title"><Link to={`/datasets/${dataset.id}`}>{dataset.name}</Link></h3>
                                                    {/* Display description and tags from dataset_metadata */}
                                                    {dataset.description && (
                                                        <p className="card-description">
                                                            {dataset.description.substring(0, 100)}{dataset.description.length > 100 ? '...' : ''}
                                                        </p>
                                                    )}
                                                    {dataset.tags && (
                                                        <p className="card-tags">Tags: {dataset.tags}</p>
                                                    )}
                                                    <div className="card-meta-info">
                                                        <span className="card-meta-item">
                                                            <FiUsers className="meta-icon" /> Uploader: {dataset.uploader_username || dataset.uploader_email || 'Anonymous'}
                                                        </span>
                                                        <span className="card-meta-item">
                                                            <FiCalendar className="meta-icon" /> Last Updated: {dataset.last_updated ? new Date(dataset.last_updated).toLocaleDateString() : 'N/A'}
                                                        </span>
                                                        <span className="card-meta-item">
                                                            <FiHash className="meta-icon" /> Category: {dataset.category || 'N/A'}
                                                        </span>
                                                        <span className="card-meta-item">
                                                            <FiDownload className="meta-icon" /> Downloads: {dataset.downloads || 0}
                                                        </span>
                                                        <span className="card-meta-item">
                                                            <FiInfo className="meta-icon" /> Size: {formatBytes(dataset.size || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="card-actions">
                                                        <button className="btn-card-download" onClick={() => handleDownload(dataset.filename)}>
                                                            <FiDownload /> Download
                                                        </button>
                                                        {/* Assuming starred functionality is global and can be toggled by any user */}
                                                        <button className="btn-card-star">
                                                            {dataset.starred ? <FaStar className="starred" /> : <FaRegStar />}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-results">No matching global approved datasets found.</p>
                                    )}
                                </>
                            )}
                        </section>

                        {/* Quick Actions (moved to main content area) */}
                        <section className="quick-actions-section">
                            <h2 className="section-title">Quick Actions</h2>
                            <div className="action-buttons-grid">
                                <button className="btn-action">
                                    <FiSettings /> Manage Storage
                                </button>
                                <button className="btn-action">
                                    <FiShare2 /> Share Dataset
                                </button>
                                {/* Add more quick actions specific to data management */}
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}
