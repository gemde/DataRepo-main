import React, { useState } from 'react';
import {
  FiFilter,
  FiSearch,
  FiAward,
  FiClock,
  FiUsers,
  FiDollarSign,
  FiChevronDown,
  FiChevronRight
} from 'react-icons/fi';
import { FaTrophy, FaRegCalendarAlt } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import '../styling/contests.css';
import TopNavigationBar from '../components/topnav';

function ContestsPage() {
  const [expandedContest, setExpandedContest] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeSort, setActiveSort] = useState('Newest');

  // Sample contest data
  const contests = [
    {
      id: 1,
      title: 'COVID-19 Prediction Challenge',
      description: 'Build models to predict infection rates based on socioeconomic factors',
      prize: 'ksh 10,000',
      participants: 245,
      deadline: '2023-12-15',
      status: 'Active',
      difficulty: 'Advanced',
      categories: ['Epidemiology', 'Time Series'],
      datasets: ['WHO COVID Data', 'Demographic Data'],
      evaluation: 'RMSE'
    },
    {
      id: 2,
      title: 'Retail Sales Forecasting',
      description: 'Predict next quarter sales for major retail chains',
      prize: 'ksh 5,000',
      participants: 189,
      deadline: '2023-11-30',
      status: 'Active',
      difficulty: 'Intermediate',
      categories: ['Business', 'Forecasting'],
      datasets: ['Historical Sales Data'],
      evaluation: 'MAPE'
    },
    {
      id: 3,
      title: 'Image Classification for Wildlife',
      description: 'Classify endangered species from camera trap images',
      prize: 'AWS Credits',
      participants: 312,
      deadline: '2023-10-20',
      status: 'Completed',
      difficulty: 'Beginner',
      categories: ['Computer Vision', 'Conservation'],
      datasets: ['Wildlife Images Dataset'],
      evaluation: 'Accuracy'
    }
  ];

  const categories = ['All', 'Epidemiology', 'Time Series', 'Business', 'Computer Vision', 'Forecasting', 'Conservation'];
  /*const statuses = ['All', 'Active', 'Upcoming', 'Completed'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];*/

  // Filter and sort contests
  const filteredContests = contests
    .filter(contest => {
      const matchesSearch = contest.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          contest.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeFilter === 'All' || contest.categories.includes(activeFilter);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (activeSort === 'Newest') return new Date(b.deadline) - new Date(a.deadline);
      if (activeSort === 'Prize') return parseInt(b.prize.replace(/\D/g,'') || 0) - parseInt(a.prize.replace(/\D/g,'') || 0);
      return a.title.localeCompare(b.title);
    });

  const toggleContest = (id) => {
    setExpandedContest(expandedContest === id ? null : id);
  };

  return (<>
    <TopNavigationBar/>
    <div className="contests-container">
      {/* Hero Section */}
      <header className="contests-header">
        <h1><FaTrophy /> Data Science Contests</h1>
        <p>Compete, learn, and win prizes by solving real-world problems</p>
      </header>

      {/* Controls */}
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
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="sort-dropdown">
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
          filteredContests.map(contest => (
            <div key={contest.id} className={`contest-card ${contest.status.toLowerCase()}`}>
              <div 
                className="contest-summary"
                onClick={() => toggleContest(contest.id)}
              >
                <div className="contest-status">
                  <span className={`status-badge ${contest.status.toLowerCase()}`}>
                    {contest.status}
                  </span>
                  {contest.status === 'Active' && (
                    <span className="days-left">
                        <FaRegCalendarAlt /> {Math.ceil((new Date(contest.deadline) - new Date()) / (1000 * 60 * 60 * 24))} days left
                    </span>
                    )}
                </div>

                <div className="contest-header">
                  <h3>{contest.title}</h3>
                  <span className="toggle-icon">
                    {expandedContest === contest.id ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                </div>

                <p className="contest-description">{contest.description}</p>

                <div className="contest-meta">
                  <span><FiDollarSign /> {contest.prize}</span>
                  <span><FiUsers /> {contest.participants} participants</span>
                  <span className={`difficulty ${contest.difficulty.toLowerCase()}`}>
                    {contest.difficulty}
                  </span>
                </div>
              </div>

              {expandedContest === contest.id && (
                <div className="contest-details">
                  <div className="detail-section">
                    <h4>Datasets Provided</h4>
                    <ul>
                      {contest.datasets.map((dataset, i) => (
                        <li key={i}>{dataset}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="detail-section">
                    <h4>Evaluation Metric</h4>
                    <p>{contest.evaluation}</p>
                  </div>

                  <div className="detail-section">
                    <h4>Categories</h4>
                    <div className="tags">
                      {contest.categories.map(category => (
                        <span key={category} className="tag">{category}</span>
                      ))}
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
          ))
        ) : (
          <div className="no-results">
            <p>No contests found matching your criteria</p>
            <NavLink to="/contests/create" className="btn-suggest">
              Suggest a Contest
            </NavLink>
          </div>
        )}
      </div>

      {/* CTA */}
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