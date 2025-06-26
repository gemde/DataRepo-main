// src/components/Leaderboard.jsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styling/Leaderboard.css'; // You'll need to create this CSS file

function Leaderboard({ contestId }) {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication required to view leaderboard.');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/contests/${contestId}/leaderboard`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setLeaderboardData(response.data);
            } catch (err) {
                console.error('Error fetching leaderboard data:', err);
                setError('Failed to load leaderboard. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (contestId) { // Only fetch if contestId is provided
            fetchLeaderboard();
        }
    }, [contestId]); // Re-fetch when contestId changes

    if (loading) {
        return <div className="leaderboard-container"><p>Loading leaderboard...</p></div>;
    }

    if (error) {
        return <div className="leaderboard-container"><p className="error-message">{error}</p></div>;
    }

    if (leaderboardData.length === 0) {
        return <div className="leaderboard-container"><p>No submissions yet for this contest. Be the first!</p></div>;
    }

    return (
        <div className="leaderboard-container">
            <h2>Leaderboard</h2>
            <table className="leaderboard-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Participant</th>
                        <th>Score</th>
                        <th>Submitted On</th>
                    </tr>
                </thead>
                <tbody>
                    {leaderboardData.map((entry, index) => (
                        <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{entry.username || entry.email}</td> {/* Display username or email */}
                            <td>{entry.score !== null ? entry.score.toFixed(4) : 'N/A'}</td> {/* Format score, handle null */}
                            <td>{new Date(entry.submission_date).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default Leaderboard;