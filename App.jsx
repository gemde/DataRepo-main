import { Route, BrowserRouter, Routes, useLocation } from 'react-router-dom';
import './App.css';
import Homepage from './pages/homepage';
import Dashboard from './components/dashboard';
import DatasetsPage from './pages/datasets';
import DataToolsPage from './pages/datatools';
import LearnPage from './pages/learn';
import ContestsPage from './pages/contests';
import LoginForm from './pages/login';
import SignupForm from './pages/signup';
import TopNavigationBar from './components/TopNavigationBar';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function Layout({ children }) {
  const location = useLocation();
  const hideNav =
    location.pathname === '/login' ||
    location.pathname === '/signup' ||
    location.pathname === '/forgot-password' ||
    location.pathname.startsWith('/reset-password');

  return (
    <>
      {!hideNav && <TopNavigationBar />}
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/datasets" element={<DatasetsPage />} />
          <Route path="/datatools" element={<DataToolsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/contests" element={<ContestsPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/not-found" element={<div>Page Not Found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
