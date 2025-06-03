import { FiFilter, FiBarChart2, FiCode, FiDownload, FiLink } from 'react-icons/fi';
import { useState } from 'react';
import '../styling/datatools.css';
import TopNavigationBar from '../components/topnav';

export default function DataToolsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample tools data
  const tools = [
    {
      id: 1,
      name: 'Exploratory Analysis',
      category: 'Visualization',
      description: 'Interactive charts and summary statistics',
      isIntegrated: true,
      link: '/tools/exploratory'
    },
    {
      id: 2,
      name: 'Python Notebooks',
      category: 'Programming',
      description: 'Jupyter-like environment with pre-loaded datasets',
      isIntegrated: false,
      link: 'https://colab.research.google.com'
    },
    {
      id: 3,
      name: 'SQL Query Builder',
      category: 'Database',
      description: 'Visual interface for querying your datasets',
      isIntegrated: true,
      link: '/tools/sql'
    }
  ];

  // Filter logic
  const filteredTools = tools.filter(tool => {
    const matchesCategory = activeFilter === 'All' || tool.category === activeFilter;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Visualization', 'Programming', 'Database'];

  return (<>
    <TopNavigationBar/>
    <div className="tools-container">
      {/* Header */}
      <div className="tools-header">
        <h1><FiBarChart2 /> Data Analysis Tools</h1>
        <p>Transform your datasets into insights with our integrated tools</p>
      </div>

      {/* Controls */}
      <div className="tools-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={activeFilter === category ? 'active' : ''}
              onClick={() => setActiveFilter(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="tools-grid">
        {filteredTools.length > 0 ? (
          filteredTools.map(tool => (
            <div key={tool.id} className="tool-card">
              <div className="tool-header">
                <h3>{tool.name}</h3>
                <span className={`tool-badge ${tool.isIntegrated ? 'integrated' : 'external'}`}>
                  {tool.isIntegrated ? 'Built-in' : 'External'}
                </span>
              </div>
              <p className="tool-description">{tool.description}</p>
              <div className="tool-footer">
                <span className="tool-category">{tool.category}</span>
                <a 
                  href={tool.link} 
                  target={!tool.link.startsWith('/') ? '_blank' : '_self'}
                  rel="noopener noreferrer"
                  className="tool-link"
                >
                  {tool.isIntegrated ? 'Open Tool' : 'Visit Site'} <FiLink />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No tools match your search criteria</p>
          </div>
        )}
      </div>

      {/* Integration Section */}
      <div className="integration-cta">
        <h2>Want to integrate your own tools?</h2>
        <p>Connect external services via our API or request new integrations</p>
        <div className="cta-buttons">
          <button className="btn-api">
            <FiCode /> API Documentation
          </button>
          <button className="btn-request">
            Request Integration
          </button>
        </div>
      </div>
    </div>
    </>
  );
}