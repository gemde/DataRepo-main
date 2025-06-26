import React, { useState, useEffect, useContext } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import '../styling/createDataset.css'; // Reuse styling from createDataset

function EditDataset() {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams(); // Get dataset ID from URL parameter

    const [datasetName, setDatasetName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [visibility, setVisibility] = useState('Private'); // 'Public' or 'Private'
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true); // Loading for initial data fetch
    const [submitting, setSubmitting] = useState(false); // Loading for form submission

    const datasetCategories = [
        'Select Category',
        'Computer Science',
        'Data Science',
        'Machine Learning',
        'Medical',
        'Finance',
        'Social Science',
        'Other'
    ];

    // --- Effect to fetch existing dataset data ---
    useEffect(() => {
        if (!token || !user) {
            setError("Authentication token missing. Please log in.");
            setLoading(false);
            return;
        }

        const fetchDatasetDetails = async () => {
            try {
                // Fetch dataset details using the /api/datasets/:id endpoint
                const response = await axios.get(`http://localhost:5000/api/datasets/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                const dataset = response.data;

                // Pre-fill the form fields with existing data
                setDatasetName(dataset.name || '');
                setCategory(dataset.category || 'Select Category');
                setDescription(dataset.description || '');
                setTags(dataset.tags || '');
                setVisibility(dataset.is_public ? 'Public' : 'Private');

                // Basic authorization check: only uploader or admin can edit
                if (dataset.user_id !== user.id && user.role !== 'admin') {
                    setError("You are not authorized to edit this dataset.");
                    setLoading(false);
                    return;
                }

            } catch (err) {
                console.error('Error fetching dataset for editing:', err);
                setError(err.response?.data?.message || 'Failed to load dataset details for editing.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    navigate("/login"); // Redirect if unauthorized or token expired
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDatasetDetails();
    }, [id, user, token, navigate]); // Re-fetch if ID, user, or token changes

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setSubmitting(true);

        if (!datasetName || !category || category === 'Select Category' || !description) {
            setError('Please fill in all required fields.');
            setSubmitting(false);
            return;
        }

        try {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) {
                setError('Authentication token not found. Please log in.');
                setSubmitting(false);
                return;
            }

            const updateData = {
                name: datasetName,
                category: category,
                description: description,
                tags: tags,
                is_public: visibility === 'Public' ? 1 : 0 // Convert to 0 or 1
            };

            const response = await axios.patch(`http://localhost:5000/api/datasets/${id}`, updateData, { // Use PATCH for partial update
                headers: {
                    Authorization: `Bearer ${authToken}`
                }
            });
            setMessage(response.data.message);
            // Optionally redirect after successful update, e.g., back to user's datasets
            navigate('/datasets');
        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.message || 'Failed to update dataset. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!user) {
        return (
            <Container className="create-dataset-container mt-5">
                <Alert variant="warning" className="text-center">
                    Please log in to edit datasets.
                </Alert>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container className="create-dataset-container mt-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="text-center mt-3">Loading dataset for editing...</p>
            </Container>
        );
    }

    if (error && error.includes("not authorized")) {
        return (
            <Container className="create-dataset-container mt-5">
                <Alert variant="danger" className="text-center">
                    {error}
                </Alert>
            </Container>
        );
    }


    return (
        <Container className="create-dataset-container mt-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 text-primary">Edit Dataset Details</h2>
            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Dataset Title <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter dataset title"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Category <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        {datasetCategories.map((cat, index) => (
                            <option key={index} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={5}
                        placeholder="Provide a detailed description of your dataset"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Tags (comma-separated)</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="e.g., climate, weather, sensor, time-series"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                        Enter relevant keywords separated by commas (e.g., "finance, stocks, market").
                    </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Visibility <span className="text-danger">*</span></Form.Label>
                    <Form.Select
                        value={visibility}
                        onChange={(e) => setVisibility(e.target.value)}
                        required
                    >
                        <option value="Private">Private</option>
                        <option value="Public">Public</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                        Choose whether your dataset is publicly accessible or private.
                    </Form.Text>
                </Form.Group>

                {/* File upload is not typically part of editing metadata after initial upload.
                    If you need to replace the file, it would be a separate action/component.
                <Form.Group className="mb-4">
                    <Form.Label>Select Dataset File</Form.Label>
                    <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        className="p-2 border-dashed-2 rounded"
                    />
                    {selectedFile && <div className="mt-2 text-muted">Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})</div>}
                </Form.Group>
                */}

                <Button variant="primary" type="submit" className="w-100 py-2" disabled={submitting}>
                    {submitting ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            <span className="ms-2">Updating...</span>
                        </>
                    ) : (
                        'Update Dataset Details'
                    )}
                </Button>
            </Form>
        </Container>
    );
}

export default EditDataset;
