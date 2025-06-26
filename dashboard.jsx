import {
  FiUpload, FiDatabase, FiUsers,
  FiClock, FiDownload, FiSearch, FiSettings
} from 'react-icons/fi';
import "../styling/dashboard.css";
import TopNavigationBar from "./topnav";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [recentFiles, setRecentFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Fetch recent files
  const fetchRecentFiles = () => {
    const token = localStorage.getItem("token");
    fetch('http://localhost:5000/api/recent-files', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setRecentFiles(data))
      .catch(err => console.error('Error fetching recent files:', err));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ You must be logged in to access the dashboard.");
      navigate("/login");
      return;
    }

    // Fetch dashboard stats
    fetch('http://localhost:5000/api/stats', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching stats:', err));

    fetchRecentFiles();
  }, [navigate]);

  const iconMap = {
    users: <FiUsers />,
    datasets: <FiDatabase />,
    downloads: <FiDownload />,
    upload: <FiUpload />,
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ You must be logged in to upload files.");
      navigate("/login");
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const name = prompt("Enter a dataset name:", file.name);
    const category = prompt("Enter a category for this dataset:", "General");

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('category', category);

    fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        alert('✅ File uploaded successfully!');
        fetchRecentFiles(); // Refresh
      })
      .catch(err => {
        console.error('Upload failed:', err);
        alert('❌ Upload failed');
      });
  };

  // Handle file download
  const handleDownload = (filename) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ You must be logged in to download files.");
      navigate("/login");
      return;
    }

    window.open(`http://localhost:5000/api/download/${filename}?token=${token}`, '_blank');
  };

  // Filter recent files by search
  const filteredFiles = recentFiles.filter(file =>
    (file.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <TopNavigationBar />
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <h1><FiDatabase /> Dashboard</h1>
          <div className="header-actions">
            <button className="btn-upload" onClick={() => document.getElementById('fileUpload').click()}>
              <FiUpload /> Upload
            </button>
            <input
              type="file"
              id="fileUpload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div className="search-bar">
              <FiSearch />
              <input
                type="text"
                placeholder="Search datasets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* Stats */}
        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon">{iconMap[stat.key] || <FiDatabase />}</div>
              <div className="stat-info">
                <h3>{stat.value}</h3>
                <p>{stat.title}</p>
                <span className="stat-trend">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <section className="activity-section">
          <h2><FiClock /> Recent Files</h2>
          <div className="file-list">
            {filteredFiles.length > 0 ? (
              filteredFiles.map((file) => (
                <div key={file.id} className="file-item">
                  <div className="file-icon">
                    {file.fileType === "csv" ? "📊"
                      : file.fileType === "zip" ? "🗜️"
                      : file.fileType === "pdf" ? "📕"
                      : "📄"}
                  </div>
                  <div className="file-details">
                    <h3>{file.name || "Unnamed file"}</h3>
                    <p>{(file.fileType || "Unknown type").toUpperCase()} • {file.size || "Unknown size"}</p>
                  </div>
                  <div className="file-time">
                    {file.last_Updated
                      ? new Date(file.lastUpdated).toLocaleDateString()
                      : "Unknown time"}
                  </div>
                  <button className="btn-download" onClick={() => handleDownload(file.filename)}>
                    <FiDownload />
                  </button>
                </div>
              ))
            ) : (
              <p>No matching files found.</p>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="btn-action">
              <FiSettings /> Manage Storage
            </button>
            <button className="btn-action">
              <FiUsers /> Share Dataset
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
