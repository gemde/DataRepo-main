import React, { useEffect, useState } from 'react'; // Added useEffect
import { NavLink } from 'react-router-dom';
import axios from 'axios'; // Added axios
import {
  FiFilter, FiSearch, FiAward, FiClock, FiUsers, FiDollarSign, FiChevronDown, FiChevronRight
} from 'react-icons/fi';
import { FaTrophy, FaRegCalendarAlt } from 'react-icons/fa';
// Assuming TopNavigationBar is in '../components/topnav'
import TopNavigationBar from '../components/topnav';
import '../styling/contests.css'; // Your custom styling

function ContestsPage() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true); // For loading state
  const [error, setError] = useState(null);     // For error messages
  const [expandedId, setExpandedId] = useState(null); // Tracks the ID of the expanded contest
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState('Newest');

  // Define all possible categories for the filter dropdown.
  // This list should ideally be consistent with categories you allow in your DB.
  const availableCategories = [
    'All', 'Epidemiology', 'Time Series', 'Business', 'Computer Vision',
    'Forecasting', 'Conservation', 'Natural Language Processing', 'Generative AI' // Example additions
  ];

  // --- useEffect to fetch contests from the backend ---
  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true); // Start loading
        setError(null);   // Clear any previous errors

        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in to view contests.');
          setLoading(false);
          // Optional: Redirect to login page if no token
          // navigate('/login');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/contests', {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Backend should already parse categories and datasets into arrays.
        // This mapping is a safeguard, or if your backend sends them as strings.
        const processedContests = response.data.map(contest => ({
          ...contest,
          categories: Array.isArray(contest.categories)
            ? contest.categories
            : JSON.parse(contest.categories || '[]'), // Fallback if backend sends string
          datasets: Array.isArray(contest.datasets)
            ? contest.datasets
            : JSON.parse(contest.datasets || '[]'), // Fallback if backend sends string
        }));

        setContests(processedContests || []); // Ensure it's an array even if response.data is null/undefined
      } catch (err) {
        console.error('Error fetching contests:', err); // Log full error for debugging
        if (err.response) {
          // Server responded with a status other than 2xx
          if (err.response.status === 401 || err.response.status === 403) {
            setError('Session expired or unauthorized. Please log in again.');
            // navigate('/login'); // Consider redirecting
          } else if (err.response.data && err.response.data.error) {
            setError(err.response.data.error); // Use specific error from backend
          } else {
            setError(`Server error: ${err.response.status}`);
          }
        } else if (err.request) {
          // Request was made but no response received
          setError('Network error. Please check your internet connection or server.');
        } else {
          // Something else happened in setting up the request
          setError('An unexpected error occurred.');
        }
      } finally {
        setLoading(false); // End loading, regardless of success or failure
      }
    };

    fetchContests();
  }, []); // Empty dependency array means this effect runs once after the initial render

  // Filter and sort contests based on user input
  const filteredContests = contests
    .filter(contest => {
      // Use optional chaining for safe access
      const title = contest.title?.toLowerCase() || '';
      const description = contest.description?.toLowerCase() || '';

      const matchesSearch =
        title.includes(searchQuery.toLowerCase()) ||
        description.includes(searchQuery.toLowerCase());

      // Ensure contest.categories is an array for `includes`
      const contestCategories = Array.isArray(contest.categories) ? contest.categories : [];
      const matchesCategory = activeFilter === 'All' || contestCategories.includes(activeFilter);

      return matchesSearch && matchesCategory;
    })
    // Inside your .sort() method in ContestsPage.jsx
.sort((a, b) => {
  if (activeSort === 'Newest') {
      const dateA = new Date(a.deadline || 0);
      const dateB = new Date(b.deadline || 0);
      return dateB.getTime() - dateA.getTime();
  } else if (activeSort === 'Prize') { // Use else if here to ensure only one sort applies
      const prizeA = parseInt(a.prize?.replace(/\D/g, '') || '0', 10);
      const prizeB = parseInt(b.prize?.replace(/\D/g, '') || '0', 10);
      return prizeB - prizeA;
  } else if (activeSort === 'Alphabetical') { // And here for Alphabetical
      return (a.title || '').localeCompare(b.title || '');
  }
  return 0; // If no sort criteria match, return 0 (maintain current order)
});

  // Toggle function for expanding/collapsing contest details
  const toggleContest = (id) => {
    setExpandedId(expandedId === id ? null : id); // Toggle by unique contest ID
  };

  // --- Conditional Rendering for Loading/Error States ---
  if (loading) {
    return (
      <>
        <TopNavigationBar />
        <div className="contests-container">
          <p className="loading-message">Loading contests...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopNavigationBar />
        <div className="contests-container">
          <p className="error-message" style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
            {error}
          </p>
          {/* Optional: Add a "Try Again" button */}
          {/* <button onClick={fetchContests}>Try Again</button> */}
        </div>
      </>
    );
  }

  return (
    <>
      <TopNavigationBar />
      <div className="contests-container">
        {/* Hero Section */}
        <header className="contests-header">
          <h1><FaTrophy /> Data Science Contests</h1>
          <p>Compete, learn, and win prizes by solving real-world problems</p>
        </header>

        {/* Controls (Search, Filter, Sort) */}
        <div className="contests-controls">
          <div className="search-bar">
            <FiSearch />
            <input
              type="text"
              placeholder="Search contests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <div className="filter-dropdown">
              <FiFilter />
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                {availableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className="sort-dropdown">
              {/* <FiAward /> {/* Icon for sort if desired */}
              <select
                value={activeSort}
                onChange={(e) => setActiveSort(e.target.value)}
              >
                <option value="Newest">Newest</option>
                <option value="Prize">Highest Prize</option>
                <option value="Alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contests List */}
        <div className="contests-list">
          {filteredContests.length > 0 ? (
            filteredContests.map(contest => {
              // Safely calculate days left, handling missing/invalid deadlines
              const daysLeft = contest.deadline
                ? Math.max(0, Math.ceil((new Date(contest.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
                : 'N/A';

              return (
                <div key={contest.id} className={`contest-card ${contest.status?.toLowerCase() || ''}`}>
                  <div
                    className="contest-summary"
                    onClick={() => toggleContest(contest.id)} // Use contest ID for toggle
                  >
                    <div className="contest-status">
                      <span className={`status-badge ${contest.status?.toLowerCase() || 'unknown'}`}>
                        {contest.status || 'Unknown'}
                      </span>
                      {contest.status === 'Active' && daysLeft !== 'N/A' && (
                        <span className="days-left">
                          <FaRegCalendarAlt /> {daysLeft} days left
                        </span>
                      )}
                    </div>

                    <div className="contest-header">
                      <h3>{contest.title || 'Untitled Contest'}</h3>
                      <span className="toggle-icon">
                        {expandedId === contest.id ? <FiChevronDown /> : <FiChevronRight />}
                      </span>
                    </div>

                    <p className="contest-description">
                      {contest.description || 'No description provided.'}
                      {/* Display creator name, assuming backend provides 'creator_name' field */}
                      {contest.creator_name && (
                        <>
                          <br />
                          <strong>Posted by:</strong> {contest.creator_name}
                        </>
                      )}
                    </p>

                    <div className="contest-meta">
                      <span><FiDollarSign /> {contest.prize || 'No prize'}</span>
                      <span><FiUsers /> {contest.participants || 0} participants</span>
                      <span className={`difficulty ${contest.difficulty?.toLowerCase() || 'unknown'}`}>
                        {contest.difficulty || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {expandedId === contest.id && ( // Check against expandedId
                    <div className="contest-details">
                      <div className="detail-section">
                        <h4>Datasets Provided</h4>
                        <ul>
                          {/* Safely map over datasets, ensuring it's an array */}
                          {(contest.datasets || []).length > 0 ? (
                            (contest.datasets || []).map((dataset, i) => (
                              <li key={i}>{dataset}</li>
                            ))
                          ) : (
                            <li>No datasets specified.</li>
                          )}
                        </ul>
                      </div>

                      <div className="detail-section">
                        <h4>Evaluation Metric</h4>
                        <p>{contest.evaluation || 'Not specified'}</p>
                      </div>

                      <div className="detail-section">
                        <h4>Categories</h4>
                        <div className="tags">
                          {/* Safely map over categories, ensuring it's an array */}
                          {(contest.categories || []).length > 0 ? (
                            (contest.categories || []).map(category => (
                              <span key={category} className="tag">{category}</span>
                            ))
                          ) : (
                            <span className="tag">No categories.</span>
                          )}
                        </div>
                      </div>

                      <div className="contest-actions">
                        {contest.status === 'Active' ? (
                          <>
                            <NavLink to={`/contests/${contest.id}`} className="btn-enter">
                              Enter Contest
                            </NavLink>
                            <NavLink to={`/contests/${contest.id}/leaderboard`} className="btn-leaderboard">
                              View Leaderboard
                            </NavLink>
                          </>
                        ) : (
                          <NavLink to={`/contests/${contest.id}/results`} className="btn-results">
                            View Results
                          </NavLink>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-results">
              <p>No contests found matching your criteria.</p>
              <NavLink to="/contests/create" className="btn-suggest">
                Suggest a Contest
              </NavLink>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="contest-cta">
          <h2>Have a problem to solve?</h2>
          <p>Sponsor a contest and leverage our community of data scientists</p>
          <NavLink to="/contests/create" className="btn-sponsor">
            Sponsor a Contest
          </NavLink>
        </div>
      </div>
    </>
  );
}

export default ContestsPage;