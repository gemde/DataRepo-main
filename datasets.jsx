import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiShare2, FiStar } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import "../styling/datasets.css";
import TopNavigationBar from '../components/topnav';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  useEffect(() => {
    if (!isLoggedIn) {
      alert("You must be logged in to view datasets.");
      return navigate("/login");
    }

    fetch('http://localhost:5000/api/datasets', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then(data => setDatasets(data))
      .catch(err => {
        console.error("Fetch error:", err);
        alert("Please login again.");
        localStorage.removeItem('token');
        navigate("/login");
      });
  }, [isLoggedIn, navigate, token]);

  const categories = ['All', ...new Set(datasets.map(d => d.category || 'Uncategorized'))];

  const filteredDatasets = datasets.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleStar = (filename) => {
    fetch(`http://localhost:5000/api/datasets/${filename}/star`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setDatasets(prev =>
          prev.map(d => (d.filename === filename ? data : d))
        );
      })
      .catch(err => alert("Failed to update star"));
  };

  const handleDownload = (filename) => {
    fetch(`http://localhost:5000/api/download/${filename}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error("Download failed.");
        const disposition = response.headers.get('Content-Disposition');
        const suggestedName = disposition?.split('filename=')[1]?.replace(/"/g, '') || filename;
        return response.blob().then(blob => ({ blob, suggestedName }));
      })
      .then(({ blob, suggestedName }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      })
      .catch(err => alert("Download error"));

    setDatasets(prev =>
      prev.map(d => (d.filename === filename ? { ...d, downloads: d.downloads + 1 } : d))
    );
  };

  return (
    <>
      <TopNavigationBar />
      <div className="datasets-container">
        <header className="datasets-header">
          <h1>Explore Datasets</h1>
          <div className="controls">
            <div className="search-bar">
              <FiSearch />
              <input
                type="text"
                placeholder="Search datasets..."
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

        <div className="dataset-grid">
          {filteredDatasets.length > 0 ? (
            filteredDatasets.map(dataset => (
              <div key={dataset.id} className="dataset-card">
                <div className="card-header">
                  <h3><Link to={`/datasets/${dataset.id}`}>{dataset.name}</Link></h3>
                  <button
                    className={`star-btn ${dataset.starred ? 'starred' : ''}`}
                    onClick={() => toggleStar(dataset.filename)}
                  >
                    <FiStar />
                  </button>
                </div>
                <div className="card-body">
                  <span className="category">{dataset.category}</span>
                  <div className="meta">
                    <span>{dataset.size}</span>
                    <span>•</span>
                    <span>{dataset.downloads} downloads</span>
                    <span>•</span>
                    <span>Updated {dataset.lastUpdated}</span>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="download-btn" onClick={() => handleDownload(dataset.filename)}>
                    <FiDownload /> Download
                  </button>
                  <button className="share-btn">
                    <FiShare2 /> Share
                  </button>
                </div>
              </div>
            ))

          ) : (
            <p className="no-results">No datasets found for your search or filter.</p>
          )}
        </div>
      </div>
    </>
  );
}
