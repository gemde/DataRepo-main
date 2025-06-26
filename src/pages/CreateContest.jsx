// src/pages/CreateContest.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavigationBar from '../components/topnav';
import axios from 'axios';
import '../styling/CreateContest.css'; // You'll need to create this CSS file

function CreateContest() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [prize, setPrize] = useState('');
    const [deadline, setDeadline] = useState('');
    const [difficulty, setDifficulty] = useState('Easy'); // Default
    const [categories, setCategories] = useState([]); // Array of selected categories
    const [newCategory, setNewCategory] = useState(''); // For adding custom categories
    const [datasets, setDatasets] = useState([]); // Array of selected dataset names
    const [allAvailableDatasets, setAllAvailableDatasets] = useState([]); // To populate dropdown
    const [evaluation, setEvaluation] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loadingDatasets, setLoadingDatasets] = useState(true);
    const [userRole, setUserRole] = useState(null); // To check if user is admin

    const predefinedCategories = [
        'Classification', 'Regression', 'Clustering', 'Computer Vision',
        'Natural Language Processing', 'Time Series', 'Reinforcement Learning',
        'Tabular Data', 'Image Processing', 'Text Analysis'
    ];

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role'); // Assuming you store role in localStorage
        setUserRole(role);

        if (!token || role !== 'admin') {
            setError('Access Denied: Only administrators can create contests. Redirecting to home...');
            setTimeout(() => navigate('/'), 3000); // Redirect non-admins
            return;
        }

        const fetchDatasets = async () => {
            try {
                setLoadingDatasets(true);
                const response = await axios.get('http://localhost:5000/api/datasets', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setAllAvailableDatasets(response.data.map(ds => ds.filename)); // Assuming 'filename' is the relevant field
            } catch (err) {
                console.error('Error fetching datasets:', err);
                setError('Failed to load available datasets.');
            } finally {
                setLoadingDatasets(false);
            }
        };

        fetchDatasets();
    }, [navigate]);

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        if (value && !categories.includes(value)) {
            setCategories([...categories, value]);
        }
    };

    const handleRemoveCategory = (catToRemove) => {
        setCategories(categories.filter(cat => cat !== catToRemove));
    };

    const handleAddCustomCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            setCategories([...categories, newCategory.trim()]);
            setNewCategory('');
        }
    };

    const handleDatasetChange = (e) => {
        const value = e.target.value;
        if (value && !datasets.includes(value)) {
            setDatasets([...datasets, value]);
        }
    };

    const handleRemoveDataset = (dsToRemove) => {
        setDatasets(datasets.filter(ds => ds !== dsToRemove));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (userRole !== 'admin') {
            setError('Unauthorized to create contests.');
            return;
        }

        const token = localStorage.getItem('token');

        const contestData = {
            title,
            description,
            prize: parseFloat(prize), // Ensure prize is a number
            deadline,
            difficulty,
            categories,
            datasets,
            evaluation
        };

        // Basic client-side validation
        if (!title || !description || !prize || !deadline || !evaluation || categories.length === 0 || datasets.length === 0) {
            setError('Please fill in all required fields and select at least one category and dataset.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/contests', contestData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMessage(response.data.message);
            // Clear form
            setTitle('');
            setDescription('');
            setPrize('');
            setDeadline('');
            setDifficulty('Easy');
            setCategories([]);
            setNewCategory('');
            setDatasets([]);
            setEvaluation('');
            // Optionally navigate to the new contest or contests list
            setTimeout(() => navigate('/contests'), 2000);
        } catch (err) {
            console.error('Error creating contest:', err);
            setError(err.response?.data?.error || 'Failed to create contest. Please try again.');
        }
    };

    if (userRole !== 'admin' && !error) { // Show loading until redirect or error message
        return (
            <>
                <TopNavigationBar />
                <div className="create-contest-container">
                    <p>Checking permissions...</p>
                </div>
            </>
        );
    }

    return (
        <>
            <TopNavigationBar />
            <div className="create-contest-container">
                <div className="create-contest-card">
                    <h1>Create New Contest</h1>
                    {message && <p className="success-message">{message}</p>}
                    {error && <p className="error-message">{error}</p>}

                    <form onSubmit={handleSubmit} className="create-contest-form">
                        <div className="form-group">
                            <label htmlFor="title">Contest Title:</label>
                            <input
                                type="text"
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description:</label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            ></textarea>
                        </div>

                        <div className="form-group">
                            <label htmlFor="prize">Prize ($):</label>
                            <input
                                type="number"
                                id="prize"
                                value={prize}
                                onChange={(e) => setPrize(e.target.value)}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="deadline">Deadline:</label>
                            <input
                                type="datetime-local" // Use datetime-local for date and time
                                id="deadline"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="difficulty">Difficulty:</label>
                            <select
                                id="difficulty"
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                                required
                            >
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Categories:</label>
                            <select onChange={handleCategoryChange} value="">
                                <option value="" disabled>Select category</option>
                                {predefinedCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <div className="selected-tags">
                                {categories.map(cat => (
                                    <span key={cat} className="tag">
                                        {cat}
                                        <button type="button" onClick={() => handleRemoveCategory(cat)}>x</button>
                                    </span>
                                ))}
                            </div>
                            <div className="custom-category-input">
                                <input
                                    type="text"
                                    placeholder="Add custom category"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                />
                                <button type="button" onClick={handleAddCustomCategory}>Add</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Datasets:</label>
                            {loadingDatasets ? (
                                <p>Loading datasets...</p>
                            ) : error.includes('datasets') ? (
                                <p className="error-message">Failed to load datasets. Please check server.</p>
                            ) : (
                                <select onChange={handleDatasetChange} value="">
                                    <option value="" disabled>Select dataset</option>
                                    {allAvailableDatasets.length > 0 ? (
                                        allAvailableDatasets.map(ds => (
                                            <option key={ds} value={ds}>{ds}</option>
                                        ))
                                    ) : (
                                        <option disabled>No datasets available. Upload some first!</option>
                                    )}
                                </select>
                            )}
                            <div className="selected-tags">
                                {datasets.map(ds => (
                                    <span key={ds} className="tag">
                                        {ds}
                                        <button type="button" onClick={() => handleRemoveDataset(ds)}>x</button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="evaluation">Evaluation Metric:</label>
                            <input
                                type="text"
                                id="evaluation"
                                value={evaluation}
                                onChange={(e) => setEvaluation(e.target.value)}
                                placeholder="e.g., RMSE, Accuracy, F1-Score"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary">Create Contest</button>
                            <button type="button" className="btn-secondary" onClick={() => navigate('/contests')}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

export default CreateContest;