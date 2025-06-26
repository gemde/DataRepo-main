import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import TopNavigationBar from "./components/topnav";
import 'bootstrap/dist/css/bootstrap.min.css';

import Home from "./pages/home";
import Login from "./pages/login";
import SignupForm from "./pages/signup";
import Dashboard from "./components/dashboard";
import Datasets from "./pages/datasets";
import Contests from "./pages/contests";
import Learn from "./pages/learn";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./components/AdminDashboard";
import CreateDataset from "./pages/CreateDataset";
import Profile from "./pages/profile.jsx";

// Contest-related pages
import ContestDetail from "./pages/ContestDetail";
import Leaderboard from "./pages/Leaderboard";
import CreateContest from "./pages/CreateContest";
import ContestResults from "./pages/ContestResults";
import EnterContest from "./pages/EnterContest";

// Admin pages
import AdminDatasetReview from "./pages/AdminDatasetReview";

// NEW: Edit Dataset Page
import EditDataset from "./pages/EditDataset";


function App() {
  return (
    <AuthProvider>
      <TopNavigationBar />
      <div style={{ paddingTop: '70px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/datasets"
            element={
              <RequireAuth>
                <Datasets />
              </RequireAuth>
            }
          />
          <Route
            path="/contests"
            element={
              <RequireAuth>
                <Contests />
              </RequireAuth>
            }
          />
          <Route
            path="/contests/:id"
            element={
              <RequireAuth>
                <ContestDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/contests/:id/leaderboard"
            element={
              <RequireAuth>
                <Leaderboard />
              </RequireAuth>
            }
          />
          <Route
            path="/contests/:id/results"
            element={
              <RequireAuth>
                <ContestResults />
              </RequireAuth>
            }
          />
          <Route
            path="/contests/create"
            element={
              <RequireAuth>
                <CreateContest />
              </RequireAuth>
            }
          />
          <Route
            path="/contests/:id/enter"
            element={
              <RequireAuth>
                <EnterContest />
              </RequireAuth>
            }
          />
          <Route
            path="/learn"
            element={
              <RequireAuth>
                <Learn />
              </RequireAuth>
            }
          />

          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />

          <Route
            path="/CreateDataset"
            element={
              <RequireAuth>
                <CreateDataset />
              </RequireAuth>
            }
          />
          {/* Dataset Detail Page (can be accessed by ID) */}
          <Route path="/datasets/:id" element={<RequireAuth><p>Dataset Detail Page Placeholder</p></RequireAuth>} />

          {/* NEW: Edit Dataset Route */}
          <Route
            path="/edit-dataset/:id"
            element={
              <RequireAuth>
                <EditDataset />
              </RequireAuth>
            }
          />


          {/* Admin Routes */}
          <Route
            path="/AdminDashboard"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/datasets-review"
            element={
              <RequireAdmin>
                <AdminDatasetReview />
              </RequireAdmin>
            }
          />

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
