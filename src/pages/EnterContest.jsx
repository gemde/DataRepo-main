// src/pages/EnterContestPage.jsx (Updated code)

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopNavigationBar from '../components/topnav';
import axios from 'axios';
import '../styling/enterContest.css';

function EnterContest() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contest, setContest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null); // New state for selected file
    const [submissionMessage, setSubmissionMessage] = useState(''); // New state for submission feedback
    const [isSubmitting, setIsSubmitting] = useState(false); // New state for submission loading

    useEffect(() => {
        const fetchContestDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Authentication required. Please log in.');
                    setLoading(false);
                    // navigate('/login'); // Uncomment if you want to redirect to login
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/contests/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setContest(response.data);
            } catch (err) {
                console.error('Error fetching contest details for submission:', err);
                if (err.response && err.response.status === 404) {
                    setError('Contest not found.');
                } else {
                    setError('Failed to load contest details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchContestDetails();
    }, [id, navigate]);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleSubmitSolution = async () => {
        if (!selectedFile) {
            setSubmissionMessage('Please select a file to submit.');
            return;
        }

        setIsSubmitting(true);
        setSubmissionMessage(''); // Clear previous messages
        setError(null); // Clear previous errors

        const formData = new FormData();
        formData.append('submissionFile', selectedFile); // 'submissionFile' is the field name backend expects
        formData.append('contestId', contest.id); // Send contest ID
        formData.append('userId', localStorage.getItem('userId')); // Assuming userId is stored in localStorage after login

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`http://localhost:5000/api/contests/${id}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });
            setSubmissionMessage(response.data.message);
            setSelectedFile(null); // Clear selected file after successful submission
            // Optionally, refresh leaderboard data or navigate
        } catch (err) {
            console.error('Error submitting solution:', err);
            const errorMessage = err.response?.data?.error || 'Failed to submit solution. Please try again.';
            setError(errorMessage);
            setSubmissionMessage('');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <TopNavigationBar />
                <div className="enter-contest-container">
                    <p className="loading-message">Loading contest information...</p>
                </div>
            </>
        );
    }

    if (error && !isSubmitting) { // Only show error if it's not a submission error, or if submission error has happened
        return (
            <>
                <TopNavigationBar />
                <div className="enter-contest-container">
                    <p className="error-message">{error}</p>
                </div>
            </>
        );
    }

    if (!contest) {
        return (
            <>
                <TopNavigationBar />
                <div className="enter-contest-container">
                    <p className="no-contest-found">Contest details could not be loaded.</p>
                </div>
            </>
        );
    }

    if (contest.status !== 'Active') {
        return (
            <>
                <TopNavigationBar />
                <div className="enter-contest-container">
                    <div className="status-message">
                        <h2>Contest Not Active</h2>
                        <p>This contest is currently <strong>{contest.status}</strong> and cannot be entered.</p>
                        <button className="btn-primary" onClick={() => navigate(`/contests/${id}`)}>
                            Back to Contest Details
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <TopNavigationBar />
            <div className="enter-contest-container">
                <div className="enter-contest-card">
                    <h1>Enter Contest: {contest.title}</h1>
                    <p className="contest-description">{contest.description}</p>

                    <div className="entry-instructions">
                        <h2>Submission Guidelines</h2>
                        <p>
                            To participate in this contest, please prepare your solution according to the following instructions:
                        </p>
                        <ul>
                            <li><strong>Dataset:</strong> {contest.datasets.join(', ') || 'N/A'}</li>
                            <li><strong>Evaluation Metric:</strong> {contest.evaluation || 'N/A'}</li>
                            <li><strong>Deadline:</strong> {new Date(contest.deadline).toLocaleDateString()}</li>
                            <li>
                                Ensure your submission file is in the specified format (e.g., CSV, JSON, Jupyter Notebook).
                            </li>
                            <li>
                                Submissions will be evaluated against a hidden test set.
                            </li>
                        </ul>
                    </div>

                    <div className="submission-form">
                        <h3>Submit Your Solution</h3>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="file-input"
                            id="submissionFile" // Add an ID for styling
                        />
                        <label htmlFor="submissionFile" className="custom-file-upload">
                            {selectedFile ? selectedFile.name : 'Choose File'}
                        </label>
                        <button
                            onClick={handleSubmitSolution}
                            className="btn-primary"
                            disabled={!selectedFile || isSubmitting} // Disable if no file or submitting
                        >
                            {isSubmitting ? 'Submitting...' : 'Upload Solution'}
                        </button>
                        {submissionMessage && <p className="success-message">{submissionMessage}</p>}
                        {error && isSubmitting && <p className="error-message">{error}</p>} {/* Show submission-specific error */}
                    </div>

                    <div className="enter-contest-actions">
                        <button className="btn-secondary" onClick={() => navigate(`/contests/${id}`)}>
                            Back to Contest Details
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default EnterContest;