// src/pages/ContestResults.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import TopNavigationBar from '../components/topnav'; // Assuming topnav is in components
import '../styling/ContestResults.css'; // Link to the CSS file

function ContestResults() {
    const { id } = useParams(); // Get contest ID from URL
    const navigate = useNavigate();
    const [resultsData, setResultsData] = useState([]);
    const [contestStatus, setContestStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [contestTitle, setContestTitle] = useState(''); // To display contest title

    useEffect(() => {
        const fetchContestResults = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication required to view results. Please log in.');
                    setLoading(false);
                    // Optionally redirect to login
                    // navigate('/login');
                    return;
                }

                // First, fetch contest details to check status and get title
                const contestResponse = await axios.get(`http://localhost:5000/api/contests/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const contest = contestResponse.data;
                setContestStatus(contest.status);
                setContestTitle(contest.title); // Set the contest title

                // Check if the contest is completed before fetching results
                if (contest.status !== 'Completed') {
                    setError(`Results are only available for completed contests. Current status: "${contest.status}".`);
                    setLoading(false);
                    return;
                }

                // If completed, fetch results
                const resultsResponse = await axios.get(`http://localhost:5000/api/contests/${id}/results`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setResultsData(resultsResponse.data);

            } catch (err) {
                console.error('Error fetching contest results:', err);
                if (err.response && err.response.status === 404) {
                    setError('Contest not found.');
                } else if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    setError('Access forbidden or unauthorized. Please log in again.');
                } else if (err.response && err.response.data && err.response.data.error) {
                    setError(err.response.data.error);
                } else {
                    setError('Failed to load contest results. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchContestResults();
        }
    }, [id, navigate]); // Re-fetch when contestId changes or navigate function changes

    if (loading) {
        return (
            <>
                <TopNavigationBar />
                <div className="contest-results-container">
                    <p>Loading contest results...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <TopNavigationBar />
                <div className="contest-results-container">
                    <p className="error-message">{error}</p>
                    <div className="contest-results-actions">
                        <button className="btn-primary" onClick={() => navigate(`/contests/${id}`)}>
                            Back to Contest Details
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/contests')}>
                            Back to All Contests
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // Display appropriate message if no results are found after loading
    if (resultsData.length === 0) {
        return (
            <>
                <TopNavigationBar />
                <div className="contest-results-container">
                    <h2>Final Results for: {contestTitle || `Contest ID: ${id}`}</h2>
                    <p>No final results available yet or no submissions were evaluated for this contest.</p>
                    <div className="contest-results-actions">
                        <button className="btn-primary" onClick={() => navigate(`/contests/${id}`)}>
                            Back to Contest Details
                        </button>
                        <button className="btn-secondary" onClick={() => navigate('/contests')}>
                            Back to All Contests
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <TopNavigationBar />
            <div className="contest-results-container">
                <h2>Final Results for: {contestTitle}</h2>
                <table className="contest-results-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Participant</th>
                            <th>Score</th>
                            <th>Submitted On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resultsData.map((entry, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{entry.username || entry.email || 'N/A'}</td> {/* Display username or email */}
                                <td>{entry.score !== null ? entry.score.toFixed(4) : 'N/A'}</td> {/* Format score, handle null */}
                                <td>{new Date(entry.submission_date).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="contest-results-actions">
                    <button className="btn-primary" onClick={() => navigate(`/contests/${id}`)}>
                        Back to Contest Details
                    </button>
                    <button className="btn-secondary" onClick={() => navigate('/contests')}>
                        Back to All Contests
                    </button>
                </div>
            </div>
        </>
    );
}

export default ContestResults;