// src/pages/Profile.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios'; // Import axios for consistent request handling
import { FiDownload, FiEye } from 'react-icons/fi'; // For download and view icons
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFile } from 'react-icons/fa'; // File icons

// Placeholder for a default profile picture (replace with your actual asset path)
import DefaultAvatar from '../assets/default-avatar.svg'; // Make sure this path is correct, or use a public URL

const Profile = () => {
    const { token, user, isAuthenticated, loading: authLoading, updateProfilePicture: updateAuthProfilePicture } = useContext(AuthContext);
    const navigate = useNavigate();

    // State for fetching/displaying current profile data
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for editing general profile information
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(null);
    const [savingChanges, setSavingChanges] = useState(false); // For general info save button

    // State for profile picture upload
    const fileInputRef = useRef(null); // Ref to hide/show file input
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [pictureUploadError, setPictureUploadError] = useState(null);
    const [pictureUploadSuccess, setPictureUploadSuccess] = useState(null);

    // NEW STATE: For user's uploaded datasets
    const [userDatasets, setUserDatasets] = useState([]);
    const [userDatasetsLoading, setUserDatasetsLoading] = useState(true);
    const [userDatasetsError, setUserDatasetsError] = useState(null);

    // Axios instance for authenticated requests
    const authAxios = axios.create({
        baseURL: 'http://localhost:5000',
    });

    authAxios.interceptors.request.use(
        config => {
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        err => Promise.reject(err)
    );

    useEffect(() => {
        if (authLoading) return;
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchProfile = async () => {
            setLoading(true);
            setError(null);
            try {
                // Using authAxios for consistency
                const response = await authAxios.get('/api/profile');
                const data = response.data; // Axios puts response data in .data
                setProfileData(data);
                setEditFormData({ // Initialize edit form with fetched data
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    gender: data.gender || '',
                    national_id_passport: data.national_id_passport || '',
                    country: data.country || '',
                    institution: data.institution || '',
                    official_work: data.official_work || '',
                });
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError(err.response?.data?.error || err.message || 'Failed to fetch profile');
            } finally {
                setLoading(false);
            }
        };

        // NEW FETCH FUNCTION: Fetch user's uploaded datasets
        const fetchUserDatasets = async () => {
            setUserDatasetsLoading(true);
            setUserDatasetsError(null);
            try {
                const response = await authAxios.get('/api/user/my-datasets'); // NEW ENDPOINT
                setUserDatasets(response.data);
            } catch (err) {
                console.error('Error fetching user datasets:', err);
                setUserDatasetsError(err.response?.data?.error || err.message || 'Failed to fetch your datasets');
            } finally {
                setUserDatasetsLoading(false);
            }
        };

        fetchProfile();
        fetchUserDatasets(); // Call the new fetch function
    }, [isAuthenticated, authLoading, token, navigate]); // Added authAxios as a dependency if it were re-created each render, but it's memoized above


    // --- Profile Picture Update Logic ---
    const handlePictureClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploadingPicture(true);
        setPictureUploadError(null);
        setPictureUploadSuccess(null);

        const formData = new FormData();
        formData.append('profilePicture', file); // 'profilePicture' must match the field name in your backend multer setup

        try {
            // CORRECTED ENDPOINT for profile picture upload
            const response = await authAxios.post('http://localhost:5000/api/profile/upload-profile-picture', formData, {
                headers: {
                    // Axios automatically sets Content-Type for FormData
                },
            });

            const data = response.data;
            setProfileData(prev => ({ ...prev, profile_picture_url: data.profile_picture_url }));
            if (updateAuthProfilePicture) {
                updateAuthProfilePicture(data.profile_picture_url); // Update AuthContext
            }
            setPictureUploadSuccess('Profile picture updated successfully!');
            event.target.value = ''; // Clear file input value

        } catch (err) {
            console.error('Error uploading picture:', err);
            setPictureUploadError(err.response?.data?.error || err.message || 'An unexpected error occurred during upload.');
        } finally {
            setUploadingPicture(false);
            setTimeout(() => {
                setPictureUploadSuccess(null);
                setPictureUploadError(null);
            }, 5000);
        }
    };

    // --- General Profile Info Editing Logic ---
    const handleEditToggle = () => {
        setIsEditing(prev => !prev);
        if (isEditing) {
            // If toggling back to view mode, reset form data to current profile data
            setEditFormData({
                first_name: profileData.first_name || '',
                last_name: profileData.last_name || '',
                email: profileData.email || '',
                gender: profileData.gender || '',
                national_id_passport: profileData.national_id_passport || '',
                country: profileData.country || '',
                institution: profileData.institution || '',
                official_work: profileData.official_work || '',
            });
            setEditError(null);
            setEditSuccess(null);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSavingChanges(true);
        setEditError(null);
        setEditSuccess(null);

        try {
            const response = await authAxios.put('/api/profile/update', editFormData); // Using authAxios
            const data = response.data;
            setProfileData(prev => ({ ...prev, ...editFormData })); // Update local state
            setEditSuccess('Profile updated successfully!');
            setIsEditing(false); // Exit edit mode on success

        } catch (err) {
            console.error('Error updating profile:', err);
            setEditError(err.response?.data?.error || err.message || 'An unexpected error occurred during update.');
        } finally {
            setSavingChanges(false);
            setTimeout(() => {
                setEditSuccess(null);
                setEditError(null);
            }, 5000);
        }
    };

    // Helper to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper for file icons (copied from datasets.jsx for consistency)
    const getFileIcon = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'pdf': return <FaFilePdf />;
            case 'doc':
            case 'docx': return <FaFileWord />;
            case 'xls':
            case 'xlsx':
            case 'csv': return <FaFileExcel />;
            case 'txt': return <FaFileAlt />;
            default: return <FaFile />;
        }
    };

    const handleDownload = (filename) => {
        // Ensure the token is passed for authenticated download
        window.open(`http://localhost:5000/api/download/${filename}?token=${token}`, '_blank');
    };

    if (authLoading || loading) {
        return (
            <div className="container">
                <div className="spinner"></div> Loading profile...
            </div>
        );
    }

    if (error) {
        return (
            <div className="container alert-danger">
                Error: {error}
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className="container">
                No profile data available. Please log in.
            </div>
        );
    }

    const profilePictureUrl = profileData.profile_picture_url || DefaultAvatar;

    return (
        <div className="container profile-page"> {/* Added a class for page-level styling */}
            <div className="profile-header">
                {/* Profile Picture Section */}
                <div className="profile-picture-container" onClick={handlePictureClick}>
                    <img
                        src={profilePictureUrl}
                        alt="Profile"
                        className="profile-picture"
                    />
                    <div className="profile-picture-overlay">
                        {uploadingPicture ? (
                            <div className="spinner"></div>
                        ) : (
                            <span>Change Picture</span>
                        )}
                    </div>
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }} // Hide the actual input
                    />
                </div>
                {pictureUploadSuccess && <div className="alert-success">{pictureUploadSuccess}</div>}
                {pictureUploadError && <div className="alert-danger">{pictureUploadError}</div>}

                <h1>Hello, {profileData.first_name || profileData.username || 'User'}!</h1> {/* Use username as fallback */}
            </div>

            <div className="profile-sections">
                {/* General Information Section */}
                <div className="profile-section-card">
                    <h2>General Information</h2>
                    {editSuccess && <div className="alert-success">{editSuccess}</div>}
                    {editError && <div className="alert-danger">{editError}</div>}

                    {!isEditing ? (
                        <div className="profile-info">
                            <p><strong>Username:</strong> {profileData.username || 'N/A'}</p> {/* Display username */}
                            <p><strong>Email:</strong> {profileData.email || 'N/A'}</p>
                            <p><strong>First Name:</strong> {profileData.first_name || 'N/A'}</p>
                            <p><strong>Last Name:</strong> {profileData.last_name || 'N/A'}</p>
                            <p><strong>Gender:</strong> {profileData.gender || 'N/A'}</p>
                            <p><strong>National ID/Passport:</strong> {profileData.national_id_passport || 'N/A'}</p>
                            <p><strong>Country:</strong> {profileData.country || 'N/A'}</p>
                            <p><strong>Institution:</strong> {profileData.institution || 'N/A'}</p>
                            <p><strong>Official Work:</strong> {profileData.official_work || 'N/A'}</p>
                            <p><strong>Role:</strong> {profileData.role ? profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1) : 'N/A'}</p> {/* Display role */}
                            <p><strong>Member Since:</strong> {formatDate(profileData.created_at)}</p>
                            <button className="btn-primary" onClick={handleEditToggle}>Edit Profile</button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label htmlFor="first_name">First Name:</label>
                                <input
                                    type="text"
                                    id="first_name"
                                    name="first_name"
                                    className="form-control"
                                    value={editFormData.first_name}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="last_name">Last Name:</label>
                                <input
                                    type="text"
                                    id="last_name"
                                    name="last_name"
                                    className="form-control"
                                    value={editFormData.last_name}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    className="form-control"
                                    value={editFormData.email}
                                    onChange={handleFormChange}
                                    disabled // Email often shouldn't be directly editable this way
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gender">Gender:</label>
                                <select
                                    id="gender"
                                    name="gender"
                                    className="form-control"
                                    value={editFormData.gender}
                                    onChange={handleFormChange}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="national_id_passport">National ID/Passport:</label>
                                <input
                                    type="text"
                                    id="national_id_passport"
                                    name="national_id_passport"
                                    className="form-control"
                                    value={editFormData.national_id_passport}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="country">Country:</label>
                                <input
                                    type="text"
                                    id="country"
                                    name="country"
                                    className="form-control"
                                    value={editFormData.country}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="institution">Institution:</label>
                                <input
                                    type="text"
                                    id="institution"
                                    name="institution"
                                    className="form-control"
                                    value={editFormData.institution}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="official_work">Official Work:</label>
                                <input
                                    type="text"
                                    id="official_work"
                                    name="official_work"
                                    className="form-control"
                                    value={editFormData.official_work}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={savingChanges}>
                                {savingChanges ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button type="button" className="btn-danger" onClick={handleEditToggle} style={{ marginLeft: '10px' }}>
                                Cancel
                            </button>
                        </form>
                    )}
                </div>

                {/* NEW SECTION: My Uploaded Datasets */}
                <div className="profile-section-card my-uploads-section">
                    <h2>My Uploaded Datasets</h2>
                    {userDatasetsLoading ? (
                        <div className="spinner"></div>
                    ) : userDatasetsError ? (
                        <div className="alert-danger">{userDatasetsError}</div>
                    ) : userDatasets.length > 0 ? (
                        <div className="dataset-list">
                            {userDatasets.map(dataset => (
                                <div key={dataset.id} className="dataset-item">
                                    <div className="file-icon">
                                        {getFileIcon(dataset.filename)}
                                    </div>
                                    <div className="dataset-info">
                                        <h3><Link to={`/datasets/${dataset.id}`}>{dataset.name}</Link></h3>
                                        <p className="category">{dataset.category || 'Uncategorized'}</p>
                                        <div className="meta">
                                            <span>{dataset.size}</span>
                                            <span>•</span>
                                            <span className={`status-${dataset.status.toLowerCase()}`}>
                                                Status: <strong>{dataset.status.toUpperCase()}</strong>
                                            </span>
                                            <span>•</span>
                                            <span>Uploaded {dataset.upload_date ? new Date(dataset.upload_date).toLocaleDateString() : 'Unknown'}</span>
                                        </div>
                                    </div>
                                    <div className="dataset-actions">
                                        {/* Only show download/view if approved, or always show for user's own files?
                                            For now, allowing download of own files for review. */}
                                        <button className="btn-icon" onClick={() => handleDownload(dataset.filename)} title="Download File">
                                            <FiDownload />
                                        </button>
                                        <Link to={`/datasets/${dataset.id}`} className="btn-icon" title="View Details">
                                            <FiEye />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-results">You haven't uploaded any datasets yet.</p>
                    )}
                </div>


                {/* Password Change Section (Placeholder) */}
                <div className="profile-section-card">
                    <h2>Change Password</h2>
                    <p>Password change functionality coming soon!</p>
                </div>
            </div>
        </div>
    );
};

export default Profile;