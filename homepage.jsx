import TopNavigationBar from "../components/topnav";
import "../styling/homepage.css";
import {
  FiDatabase, FiClock, FiBook, FiUsers, FiTarget
} from "react-icons/fi";

export default function Homepage() {
  // TODO: Replace with real API data when backend is ready
  const recentActivity = [
    { id: 1, name: "Sales_Q3_2023.csv", action: "uploaded", time: "2 hours ago" },
    { id: 2, name: "Climate_Data.zip", action: "downloaded", time: "1 day ago" },
  ];

  const dataCategories = [
    { id: 1, name: "Healthcare", count: 42, icon: <FiDatabase /> },
    { id: 2, name: "Finance", count: 35, icon: <FiDatabase /> },
    { id: 3, name: "Climate Science", count: 28, icon: <FiDatabase /> },
    { id: 4, name: "Education", count: 90, icon: <FiDatabase /> },
    { id: 5, name: "Transport", count: 100, icon: <FiDatabase /> },
    { id: 6, name: "Agriculture", count: 28, icon: <FiDatabase /> },
  ];

  return (
    <>
      <TopNavigationBar className="top-navigation-bar" />
      <div className="homepage-container">
        <main className="homepage-content">

          {/* Hero / Welcome Section */}
          <section className="hero-section">
            <h1>Welcome to <span className="highlight">DataRepo</span></h1>
            <p className="subtitle">
              A secure platform for storing, sharing, and analyzing datasets to accelerate your research and innovation.
            </p>
          </section>

          {/* Recent Activity Section */}
          <section className="activity-section">
            <h2><FiClock /> Recent Activity</h2>
            <div className="activity-list">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="activity-item">
                    <span className="action">{item.action}</span>
                    <span className="file-name">{item.name}</span>
                    <span className="time">{item.time}</span>
                  </div>
                ))
              ) : (
                <p>No recent activity available.</p>
              )}
            </div>
          </section>

          {/* Data Categories Section */}
          <section className="categories-section">
            <h2><FiBook /> Browse by Industry</h2>
            <div className="category-grid">
              {dataCategories.map((category) => (
                <div key={category.id} className="category-card">
                  <div className="category-icon">{category.icon}</div>
                  <h3>{category.name}</h3>
                  <p>{category.count} datasets</p>
                </div>
              ))}
            </div>
          </section>

          {/* About Sections */}
          <div className="about-grid">
            <section className="about-card">
              <h2><FiDatabase /> What is DataRepo?</h2>
              <p>
                DataRepo is a centralized hub for structured and unstructured datasets. It supports version control,
                secure access, and team collaboration — all tailored for data-driven organizations.
              </p>
            </section>

            <section className="about-card">
              <h2><FiUsers /> About the Team</h2>
              <p>
                Developed by <strong>Bob's Analytics</strong>, a leading provider of open data infrastructure.
                Trusted globally since 2025 by universities, government agencies, and enterprises.
              </p>
            </section>

            <section className="about-card">
              <h2><FiTarget /> Our Mission</h2>
              <p>
                To democratize access to reliable data while ensuring security and privacy. Designed for researchers,
                analysts, students, and innovators who seek fast and trusted data solutions.
              </p>
            </section>
          </div>

        </main>
      </div>
    </>
  );
}
