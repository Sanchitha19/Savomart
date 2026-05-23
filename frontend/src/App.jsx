import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Offers from "./pages/Offers";
import Stores from "./pages/Stores";
import Support from "./pages/Support";
import LoadingSpinner from "./components/LoadingSpinner";
import { useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

// Page transition wrapper
const AnimatedPage = ({ children }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter page-enter-active">
      {children}
    </div>
  );
};

// Route wrapper to restrict access to authenticated members only
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#782B90]">
        <div className="flex items-center space-x-2 group mb-6">
          <div className="bg-savomart-yellow text-[#782B90] p-2 rounded-xl font-extrabold text-2xl shadow-md">
            S
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            SAVO<span className="text-savomart-yellow">mart</span>
          </span>
        </div>
        <div className="w-12 h-12 border-4 border-white/20 border-t-savomart-yellow rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#F8F4FA]">
          {/* Notifications provider */}
          <Toaster 
            position="top-right" 
            toastOptions={{
              duration: 4000,
              style: {
                background: "#4A1A5C",
                color: "#FFFFFF",
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: "bold",
              },
              success: {
                style: { background: "#10B981", color: "#FFFFFF" },
                iconTheme: { primary: "#FFFFFF", secondary: "#10B981" },
              },
              error: {
                style: { background: "#EF4444", color: "#FFFFFF" },
                iconTheme: { primary: "#FFFFFF", secondary: "#EF4444" },
              }
            }} 
          />
          
          {/* Persistent Navbar for tablet/desktop */}
          <Navbar />
          
          {/* Main content body container */}
          <main className="flex-grow pb-16 md:pb-0">
            <Routes>
              {/* Public Authenticate route */}
              <Route path="/login" element={<Login />} />
              
              {/* Authenticated member routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AnimatedPage><Home /></AnimatedPage>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AnimatedPage><Profile /></AnimatedPage>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/offers" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AnimatedPage><Offers /></AnimatedPage>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/stores" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AnimatedPage><Stores /></AnimatedPage>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/support" 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary>
                      <AnimatedPage><Support /></AnimatedPage>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          
          {/* Persistent Tab bar for mobile viewports */}
          <BottomNav />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
