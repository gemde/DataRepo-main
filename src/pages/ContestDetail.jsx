// src/pages/ContestDetail.jsx

import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom'; // Removed useNavigate as it was unused
import axios from 'axios';
import TopNavigationBar from '../components/topnav';
import { FiAward, FiClock, FiUsers, FiDollarSign, FiCalendar } from 'react-icons/fi';
import '../styling/contestDetail.css';
import Leaderboard from './Leaderboard'; // Correct import path for Leaderboard if it's in src/pages/

function ContestDetail() {
    const { id } = useParams();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContestDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication required. Please log in.');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/contests/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setContest(response.data);
            } catch (err) {
                console.error('Error fetching contest details:', err);
                if (err.response && err.response.status === 404) {
                    setError('Contest not found.');
                } else if (err.response && err.response.status === 401 || err.response.status === 403) { // Also handle 403 here
                    setError('Unauthorized access. Please log in again.');
                    // Optionally clear token and redirect to login
                    // localStorage.removeItem('token');
                    // localStorage.removeItem('role');
                    // window.location.href = '/login';
                } else {
                    setError('Failed to load contest details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchContestDetails();
    }, [id]);

    if (loading) {
        return (
            <>
                <TopNavigationBar />
                <div className="contest-detail-container">
                    <p className="loading-message">Loading contest details...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <TopNavigationBar />
                <div className="contest-detail-container">
                    <p className="error-message">{error}</p>
                    {/* Add a back button for error state for better UX */}
                    <NavLink to="/contests" className="btn-secondary">Back to Contests</NavLink>
                </div>
            </>
        );
    }

    if (!contest) {
        return (
            <>
                <TopNavigationBar />
                <div className="contest-detail-container">
                    <p className="no-contest-found">No contest found with this ID or data could not be loaded.</p>
                    {/* Add a back button for no contest found state */}
                    <NavLink to="/contests" className="btn-secondary">Back to Contests</NavLink>
                </div>
            </>
        );
    }

    return (
        <>
            <TopNavigationBar />
            <div className="contest-detail-container">
                <div className={`contest-detail-card ${contest.status?.toLowerCase()}`}>
                    <div className="contest-header">
                        <h1>{contest.title}</h1>
                        <p className="posted-by">Posted by: {contest.creator_name || 'Anonymous'}</p>
                        <div className="contest-meta">
                            <span className="meta-item"><FiDollarSign /> {contest.prize}</span>
                            <span className="meta-item"><FiUsers /> {contest.participants} participants</span>
                            <span className={`meta-item difficulty ${contest.difficulty?.toLowerCase()}`}>{contest.difficulty}</span>
                            <span className="meta-item status">{contest.status}</span>
                        </div>
                    </div>
                    <p className="contest-description">{contest.description}</p>

                    <div className="contest-info-section">
                        <h2>Datasets Provided</h2>
                        <ul>
                            {Array.isArray(contest.datasets) && contest.datasets.length > 0 ? (
                                contest.datasets.map((dataset, index) => (
                                    <li key={index}>{dataset}</li>
                                ))
                            ) : (
                                <li>No datasets specified.</li>
                            )}
                        </ul>
                    </div>

                    <div className="contest-info-section">
                        <h2>Evaluation Metric</h2>
                        <p>{contest.evaluation || 'Not specified'}</p>
                    </div>

                    <div className="contest-info-section">
                        <h2>Categories</h2>
                        <div className="categories-tags">
                            {Array.isArray(contest.categories) && contest.categories.length > 0 ? (
                                contest.categories.map((category, index) => (
                                    <span key={index} className="category-tag">{category}</span>
                                ))
                            ) : (
                                <span className="category-tag">Uncategorized</span>
                            )}
                        </div>
                    </div>

                    <div className="contest-info-section">
                        <h2>Deadline</h2>
                        <p>
                            {contest.deadline ? new Date(contest.deadline).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : 'Not specified'}
                        </p>
                    </div>

                    <div className="contest-actions-detail">
                        {contest.status === 'Active' ? (
                            <NavLink to={`/contests/${contest.id}/enter`} className="btn-primary">
                                Enter Contest
                            </NavLink>
                        ) : (
                            // Only show View Results button if contest is completed
                            contest.status === 'Completed' && (
                                <NavLink to={`/contests/${contest.id}/results`} className="btn-primary">
                                    View Results
                                </NavLink>
                            )
                        )}
                        {/* Always show Leaderboard if contest.id is available, regardless of status */}
                        {contest.id && (
                            <NavLink to={`/contests/${contest.id}/leaderboard`} className="btn-secondary">
                                View Leaderboard
                            </NavLink>
                        )}
                        <NavLink to="/contests" className="btn-secondary">
                            Back to Contests
                        </NavLink>
                    </div>
                </div>

                {/* Render Leaderboard component directly below contest details if the contest is active/completed */}
                {/* We pass contest.id to the Leaderboard component */}
                {contest.id && <Leaderboard contestId={contest.id} />}
            </div>
        </>
    );
}

export default ContestDetail;