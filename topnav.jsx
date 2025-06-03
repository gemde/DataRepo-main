import React from "react";
import { Navbar, Form, Container, Nav, NavDropdown, Button } from "react-bootstrap";
import { 
  FiSearch, 
  FiBell, 
  FiUser, 
  FiTool,
  FiPieChart,
  FiFolder
} from "react-icons/fi";
import { 
  FaRobot, 
  FaGraduationCap, 
  FaTrophy,
  FaHome
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import "../styling/topnav.css";

function TopNavigationBar() {
  return (
    <Navbar expand="lg" fixed="top"  className="topnav-blue-theme" style={{background:"white", height:"70px"}}>
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
            <Nav.Link as={NavLink} to={"/"} className="nav-link-custom">
              <FaHome className="nav-icon"/>
              Home
            </Nav.Link>
            <Nav.Link as={NavLink} to="/dashboard" className="nav-link-custom">
                <FiPieChart className="nav-icon"/>
              Dashboard
            </Nav.Link>
            <Nav.Link as={NavLink} to="/datasets" className="nav-link-custom">
                <FiFolder className="nav-icon"/>
              Datasets
            </Nav.Link>
            
          </Nav>

          {/* Search Bar */}

         {/* <Form.Control
                type="search"
                placeholder="Search datasets, models..."
                className="search-input"
              />

            <Button variant="primary" className="search-btn" style={{marginLeft:"10px"}}>
              Search
            </Button>*/}
          

          {/* Right-Aligned Icons */}
          <Nav className="align-items-center">
          <Nav.Link as={NavLink} to="/models" className="nav-link-custom">
              <FaRobot className="nav-icon" /> Models
            </Nav.Link>
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
            <NavDropdown
              title={<FiUser className="nav-icon" />}
              align="end"
              className="profile-dropdown"
            >
              <NavDropdown.Item as={NavLink} to="/profile">Profile</NavDropdown.Item>
              <NavDropdown.Item as={NavLink} to="/settings">Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={NavLink} to="/logout">Logout</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default TopNavigationBar;