// src/components/Navbar.jsx
import React, { useContext } from "react"; // Import useContext
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import {
  FiTool,
  FiPieChart,
  FiFolder,
  FiUser,
  FiBell
} from "react-icons/fi";
import {
  FaTrophy,
  FaGraduationCap,
  FaHome
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from '../context/AuthContext.jsx'; // Import AuthContext
import "../styling/topnav.css";

function TopNavigationBar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext); // Get isAuthenticated and logout from AuthContext

  const handleLogout = () => {
    // --- CRITICAL CHANGE: Use logout from AuthContext ---
    logout(); // Clear token and user from AuthContext and localStorage
    navigate("/login");
  };

  return (
    <Navbar expand="lg" fixed="top" className="topnav-blue-theme" style={{ background: "white", height: "70px" }}>
      <Container fluid>
        {/* Logo/Brand */}
        <Navbar.Brand as={NavLink} to="/" className="d-flex align-items-center">
          <span className="logo-icon">DR</span>
          <span className="brand-name">DataRepo</span>
        </Navbar.Brand>

        {/* Collapsible Menu */}
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          {/* Main Navigation Links */}
          <Nav className="me-auto">
            <Nav.Link as={NavLink} to="/" className="nav-link-custom">
              <FaHome className="nav-icon" /> Home
            </Nav.Link>

            {/* Conditionally render Dashboard and Datasets for authenticated users */}
            {isAuthenticated && (
              <>
                <Nav.Link as={NavLink} to="/dashboard" className="nav-link-custom">
                  <FiPieChart className="nav-icon" /> Dashboard
                </Nav.Link>
                <Nav.Link as={NavLink} to="/datasets" className="nav-link-custom">
                  <FiFolder className="nav-icon" /> Datasets
                </Nav.Link>
              </>
            )}
          </Nav>

          {/* Right-Aligned Icons */}
          <Nav className="align-items-center">
            {/* Conditionally render Contests, Learn, Data Tools, Notifications for authenticated users */}
            {isAuthenticated ? (
              <>
                <Nav.Link as={NavLink} to="/contests" className="nav-link-custom">
                  <FaTrophy className="nav-icon" /> Contests
                </Nav.Link>
                <Nav.Link as={NavLink} to="/learn" className="nav-link-custom">
                  <FaGraduationCap className="nav-icon" /> Learn
                </Nav.Link>
                <Nav.Link as={NavLink} to="/datatools" className="icon-link">
                  <FiTool className="nav-icon" />
                </Nav.Link>
                <Nav.Link as={NavLink} to="/notifications" className="icon-link">
                  <FiBell className="nav-icon" />
                </Nav.Link>

                {/* Profile Dropdown (Only visible if authenticated) */}
                <NavDropdown
                  title={<FiUser className="nav-icon" />}
                  align="end"
                  className="profile-dropdown"
                >
                  <NavDropdown.Item as={NavLink} to="/profile">Profile</NavDropdown.Item>
                  <NavDropdown.Item as={NavLink} to="/settings">Settings</NavDropdown.Item>
                  {/* You could add a "My Uploads" or "My Datasets" link here */}
                  <NavDropdown.Item as={NavLink} to="/my-uploads">My Uploads</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout} style={{ color: "red" }}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              // Show Login/Signup only if not authenticated
              <>
                <Nav.Link as={NavLink} to="/login" className="nav-link-custom">Login</Nav.Link>
                <Nav.Link as={NavLink} to="/signup" className="nav-link-custom">Signup</Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopNavigationBar;