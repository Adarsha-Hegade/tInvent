import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AdminDashboard from './components/admin/Dashboard';
import UserDashboard from './components/user/Dashboard';
import Login from './components/auth/Login';

function App() {
  const { user, isAdmin, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/"
          element={
            !user ? (
              <Navigate to="/login" />
            ) : isAdmin ? (
              <AdminDashboard />
            ) : (
              <UserDashboard />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;