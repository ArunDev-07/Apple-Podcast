import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import LoadingSpinner from './components/animations/LoadingSpinner';
import PodcastDetailUser from './components/user/PodcastDetailUser';
import Trending from './pages/Trending';
import Explore from './pages/Explore';
import Categories from './pages/Categories';

// Page transition wrapper
const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {children}
    </motion.div>
  );
};

// User Dashboard Wrapper Component to handle internal navigation
const UserDashboardWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract the view from the URL path
  useEffect(() => {
    const path = location.pathname;
    // If we're at /user route, we'll let the dashboard show its default view
  }, [location, navigate]);
  
  return (
    <PageTransition>
      <UserDashboard />
    </PageTransition>
  );
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={<PageTransition><Home /></PageTransition>}
        />
        <Route
          path="/login"
          element={<PageTransition><Login /></PageTransition>}
        />
        <Route
          path="/register"
          element={<PageTransition><Register /></PageTransition>}
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <PageTransition><AdminDashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        
        {/* User Dashboard Routes */}
        <Route path="/user/*" element={
          <ProtectedRoute requiredRole="user">
            <UserDashboardWrapper />
          </ProtectedRoute>
        } />
        
        {/* Special route for Listen Now view */}
        <Route path="/browse" element={
          <ProtectedRoute requiredRole="user">
            <Navigate to="/user" replace />
          </ProtectedRoute>
        } />
        
        {/* Routes that should redirect to UserDashboard */}
        <Route path="/most-played" element={
          <ProtectedRoute requiredRole="user">
            <Navigate to="/user" replace />
          </ProtectedRoute>
        } />
        <Route path="/liked" element={
          <ProtectedRoute requiredRole="user">
            <Navigate to="/user" replace />
          </ProtectedRoute>
        } />
        <Route path="/bookmarked" element={
          <ProtectedRoute requiredRole="user">
            <Navigate to="/user" replace />
          </ProtectedRoute>
        } />
        <Route path="/recently-played" element={
          <ProtectedRoute requiredRole="user">
            <Navigate to="/user" replace />
          </ProtectedRoute>
        } />
        
        {/* Podcast Detail Route */}
        <Route
          path="/podcasts/:id"
          element={<PageTransition><PodcastDetailUser /></PageTransition>}
        />
        
        {/* Additional routes */}
        <Route
          path="/trending"
          element={<PageTransition><Trending /></PageTransition>}
        />
        <Route
          path="/categories"
          element={<PageTransition><Categories /></PageTransition>}
        />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Better initialization to avoid hydration issues
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial loading
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer); // Cleanup timer
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', darkMode.toString());
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <LoadingSpinner />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-4 text-gray-600 dark:text-gray-400"
          >
            Loading amazing content...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
          <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-grow pt-20">
            <AnimatedRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;