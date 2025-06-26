import React, { useState, useContext } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styling/createDataset.css'; // Import the CSS for styling

function CreateDataset() {
    const { user, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [datasetName, setDatasetName] = useState('');
    const [category, setCategory] = useState('');
    // Removed description and tags states
    // const [description, setDescription] = useState('');
    // const [tags, setTags] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [visibility, setVisibility] = useState('Private'); // 'Public' or 'Private'
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Dummy categories for the dropdown (replace with actual dynamic categories if needed)
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

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setError(''); // Clear any previous file errors
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // Updated validation: description and tags are no longer required here
        if (!datasetName || !category || category === 'Select Category' || !selectedFile) {
            setError('Please fill in all required fields (Dataset Title, Category, and select a file).');
            return;
        }

        const formData = new FormData();
        formData.append('datasetName', datasetName);
        formData.append('category', category);
        // Do not append description or tags from here, they will be empty/null in backend
        formData.append('datasetFile', selectedFile);
        formData.append('is_public', visibility === 'Public' ? 1 : 0);

        setLoading(true);
        try {
            const authToken = token || localStorage.getItem('token');
            if (!authToken) {
                setError('Authentication token not found. Please log in.');
                setLoading(false);
                return;
            }

            // The backend's /api/datasets/upload route will now need to handle description and tags as optional/null
            const response = await axios.post('http://localhost:5000/api/datasets/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${authToken}`
                }
            });
            setMessage(response.data.message);
            setDatasetName('');
            setCategory('Select Category');
            setSelectedFile(null);
            setVisibility('Private'); // Reset visibility
            navigate('/datasets'); // Go back to the datasets list
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Failed to upload dataset. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <Container className="create-dataset-container mt-5">
                <Alert variant="warning" className="text-center">
                    Please log in to upload a new dataset.
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="create-dataset-container mt-5 p-4 rounded shadow-lg">
            <h2 className="text-center mb-4 text-primary">Upload New Dataset</h2>
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

                {/* REMOVED: Description and Tags fields */}
                {/* These will now be added/edited via the dedicated Edit Dataset page */}

                {/* Dataset Visibility (still required on initial upload) */}
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

                <Form.Group className="mb-4">
                    <Form.Label>Select Dataset File <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="file"
                        onChange={handleFileChange}
                        required
                        className="p-2 border-dashed-2 rounded"
                    />
                    {selectedFile && <div className="mt-2 text-muted">Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})</div>}
                </Form.Group>

                <Button variant="primary" type="submit" className="w-100 py-2" disabled={loading}>
                    {loading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            <span className="ms-2">Uploading...</span>
                        </>
                    ) : (
                        'Upload Dataset'
                    )}
                </Button>
            </Form>
        </Container>
    );
}

const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EH', 'ZL', 'YL'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export default CreateDataset;
