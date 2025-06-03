import React, { useState } from 'react';
import {
  FiBook,
  FiVideo,
  FiCode,
  FiAward,
  FiChevronDown,
  FiChevronRight,
  FiSearch
} from 'react-icons/fi';
import { FaPython, FaRProject } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Make sure this is added
import '../styling/learn.css';
import TopNavigationBar from '../components/topnav';

function LearnPage() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Add `source` field for each resource
const learningPaths = [
  {
    id: 1,
    title: 'Data Science Fundamentals',
    description: 'Master the basics of data analysis and visualization',
    resources: [
      {
        type: 'course',
        title: 'Introduction to Pandas',
        duration: '2h 15m',
        level: 'Beginner',
        source: 'YouTube - Alex the Analyst',
        link: 'https://www.youtube.com/watch?v=vmEHCJofslg'
      },
      {
        type: 'tutorial',
        title: 'Data Cleaning Techniques',
        duration: '45m',
        level: 'Intermediate',
        source: 'Real Python',
        link: 'https://realpython.com/python-data-cleaning-numpy-pandas/'
      },
      {
        type: 'article',
        title: 'Choosing the Right Visualization',
        duration: '20m',
        level: 'Beginner',
        source: 'Towards Data Science',
        link: 'https://towardsdatascience.com/the-art-of-effective-data-visualization-29c265c58872'
      }
    ]
  },
  {
    id: 2,
    title: 'Machine Learning',
    description: 'From linear regression to deep learning',
    resources: [
      {
        type: 'course',
        title: 'Scikit-Learn Crash Course',
        duration: '3h',
        level: 'Intermediate',
        source: 'YouTube - freeCodeCamp.org',
        link: 'https://www.youtube.com/watch?v=pqNCD_5r0IU'
      },
      {
        type: 'tutorial',
        title: 'Building Your First Neural Network',
        duration: '1h 30m',
        level: 'Advanced',
        source: 'TensorFlow.org',
        link: 'https://www.tensorflow.org/tutorials/keras/classification'
      }
    ]
  },
  {
    id: 3,
    title: 'Big Data Technologies',
    description: 'Working with large datasets efficiently',
    resources: [
      {
        type: 'course',
        title: 'Apache Spark Fundamentals',
        duration: '4h',
        level: 'Intermediate',
        source: 'Udacity',
        link: 'https://www.udacity.com/course/intro-to-spark--ud2002'
      },
      {
        type: 'article',
        title: 'Optimizing PySpark Queries',
        duration: '30m',
        level: 'Advanced',
        source: 'Towards Data Science',
        link: 'https://towardsdatascience.com/10-tips-for-pyspark-performance-improvements-6d0c5adf6a0c'
      }
    ]
  }
];

  const quickGuides = [
    { icon: <FaPython />, title: 'Python Data Analysis', link: '/guides/python' },
    { icon: <FaRProject />, title: 'R for Statistics', link: '/guides/r' },
    { icon: <FiCode />, title: 'SQL for Database', link: '/guides/sql' }
  ];

  const toggleSection = (id) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const filteredPaths = learningPaths.filter(path =>
    path.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    path.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    path.resources.some(resource =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <>
      <TopNavigationBar />
      <div className="learn-container">
        <header className="learn-header">
          <h1><FiBook /> Learning Center</h1>
          <p>Develop your data skills with curated tutorials, courses, and guides</p>
        </header>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search learning resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Guides */}
        <section className="quick-guides">
          <h2>Quick Start Guides</h2>
          <div className="guides-grid">
            {quickGuides.map((guide, index) => (
              <Link key={index} to={guide.link} className="guide-card">
                <div className="guide-icon">{guide.icon}</div>
                <h3>{guide.title}</h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Learning Paths */}
        <section className="learning-paths">
          <h2>Structured Learning Paths</h2>
          {filteredPaths.length > 0 ? (
            filteredPaths.map((path) => (
              <div key={path.id} className="path-card">
                <div className="path-header" onClick={() => toggleSection(path.id)}>
                  <h3>{path.title}</h3>
                  <span className="toggle-icon">
                    {expandedSection === path.id ? <FiChevronDown /> : <FiChevronRight />}
                  </span>
                  <p>{path.description}</p>
                </div>

                {expandedSection === path.id && (
                  <div className="path-resources">
                    {path.resources.map((resource, index) => (
                      <div key={index} className="resource-item">
                        <div className="resource-type">
                          {resource.type === 'course' && <FiVideo className="type-icon" />}
                          {resource.type === 'tutorial' && <FiCode className="type-icon" />}
                          {resource.type === 'article' && <FiBook className="type-icon" />}
                          <span>{resource.type}</span>
                        </div>
                        <div className="resource-info">
  <h4>{resource.title}</h4>
  <p className="resource-source">By: {resource.source}</p> {/* 👈 this is new */}
  <div className="resource-meta">
    <span>{resource.duration}</span>
    <span className="level-badge">{resource.level}</span>
  </div>
</div>
    <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="start-button"
                        >
                          Start {resource.type}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <p>No learning paths match your search</p>
            </div>
          )}
        </section>

        {/* Certification CTA */}
        <section className="certification-cta">
          <div className="cta-content">
            <FiAward className="cta-icon" />
            <div>
              <h2>Earn Certifications</h2>
              <p>Validate your skills with our accredited certification programs</p>
              <button className="cta-button">Explore Certifications</button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default LearnPage;
