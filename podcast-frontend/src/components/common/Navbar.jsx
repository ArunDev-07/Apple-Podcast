import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Sun, Moon, Menu, X, 
  Home, ListMusic, BarChart3, Heart, 
  Bookmark, Clock, Headphones, Users, 
  Settings, FileText, Activity, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const Navbar = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      
      setIsScrolled(scrollTop > 20);
      setScrollProgress(Math.min(scrollPercent, 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Handle section navigation
  const handleNavigation = (path) => {
    navigate(path);
    
    // If we're already on the user dashboard, dispatch a custom event to change the view
    if (location.pathname === '/user') {
      const view = path.replace('/', '');
      window.dispatchEvent(new CustomEvent('changeView', { 
        detail: { view: view || 'browse' } 
      }));
    }
  };

  // Regular user navigation items
  const userNavItems = [
    { path: '/user', label: 'Listen Now', icon: Home, view: 'listen' },
    
  ];

  // Admin navigation items - only admin pages
  const adminNavItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: Shield, view: 'dashboard' },
    { path: '/user', label: 'User Management', icon: Users, view: 'users' },
   
  ];

  // Choose navigation items based on user role
  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  // Dynamic blur and opacity based on scroll progress with colorful effects
  const getBackgroundStyle = () => {
    // Increase base opacity to ensure navbar always has a background
    const baseOpacity = isScrolled ? 0.9 : 0.85;
    const scrollOpacity = Math.min(scrollProgress * 0.3, 0.2);
    const totalOpacity = Math.min(baseOpacity + scrollOpacity, 0.98);
    
    const blurAmount = isScrolled ? 16 : 12;
    
    // Enhanced colorful background with gradients
    const colorfulBackground = darkMode 
      ? `linear-gradient(135deg, 
          rgba(17, 24, 39, ${totalOpacity}) 0%, 
          rgba(30, 27, 75, ${totalOpacity * 0.9}) 25%, 
          rgba(17, 24, 39, ${totalOpacity}) 50%, 
          rgba(45, 35, 75, ${totalOpacity * 0.8}) 75%, 
          rgba(17, 24, 39, ${totalOpacity}) 100%)`
      : `linear-gradient(135deg, 
          rgba(255, 255, 255, ${totalOpacity}) 0%, 
          rgba(248, 250, 252, ${totalOpacity * 0.95}) 25%, 
          rgba(255, 255, 255, ${totalOpacity}) 50%, 
          rgba(250, 245, 255, ${totalOpacity * 0.9}) 75%, 
          rgba(255, 255, 255, ${totalOpacity}) 100%)`;
    
    return {
      backdropFilter: `blur(${blurAmount}px) saturate(180%) brightness(110%)`,
      WebkitBackdropFilter: `blur(${blurAmount}px) saturate(180%) brightness(110%)`,
      background: colorfulBackground,
      boxShadow: isScrolled 
        ? `0 8px 32px ${darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}, 
           0 1px 0 ${darkMode ? 'rgba(147, 51, 234, 0.1)' : 'rgba(147, 51, 234, 0.05)'} inset,
           0 0 20px ${darkMode ? 'rgba(147, 51, 234, 0.05)' : 'rgba(147, 51, 234, 0.03)'}`
        : `0 4px 20px ${darkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)'}`,
    };
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-300 ${
        isScrolled
          ? 'border-b border-purple-200/30 dark:border-purple-700/30'
          : 'border-b border-transparent'
      }`}
      style={getBackgroundStyle()}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full transition-all duration-1000 ${
          isScrolled 
            ? 'bg-gradient-to-br from-purple-400/10 to-indigo-400/10 blur-3xl' 
            : 'bg-gradient-to-br from-purple-400/5 to-indigo-400/5 blur-3xl'
        }`}></div>
        <div className={`absolute -top-40 -left-40 w-80 h-80 rounded-full transition-all duration-1000 ${
          isScrolled 
            ? 'bg-gradient-to-br from-pink-400/10 to-purple-400/10 blur-3xl' 
            : 'bg-gradient-to-br from-pink-400/5 to-purple-400/5 blur-3xl'
        }`}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex justify-between h-16 items-center">
          {/* Logo - Streamify style */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/25 border border-white/20 dark:border-gray-700/30">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight drop-shadow-sm">
                Streamify
              </span>
            </Link>
          </motion.div>

          {/* Right Section */}
          <div className="flex items-center space-x-5">
            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDarkMode(!darkMode)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 dark:bg-gray-800/50 dark:hover:bg-gray-700/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <AnimatePresence mode="wait">
                {darkMode ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Sun className="h-4 w-4 text-yellow-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 180, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -180, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Moon className="h-4 w-4 text-gray-600" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* User Menu */}
            {user ? (
              <div className="hidden md:flex items-center space-x-8">
                <div className="flex items-center">
                  <div className={`w-9 h-9 ${
                    user.role === 'admin' 
                      ? 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-600 dark:text-red-400'
                      : 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-600 dark:text-purple-400'
                  } rounded-full flex items-center justify-center mr-3 shadow-sm backdrop-blur-sm border border-white/30 dark:border-gray-700/30`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(user.role === 'admin' ? '/admin' : '/user')}
                      className="text-sm font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-left drop-shadow-sm"
                    >
                      {user.name || 'User'}
                    </motion.button>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {user.role === 'admin' ? 'Administrator' : 'Listener'}
                    </span>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="text-sm font-medium px-4 py-2 bg-white/20 hover:bg-white/30 dark:bg-gray-800/50 dark:hover:bg-gray-700/60 rounded-full text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 shadow-sm hover:shadow-md"
                >
                  Sign Out
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 shadow-lg shadow-purple-500/25 backdrop-blur-sm border border-white/30 hover:shadow-xl"
              >
                Sign In
              </motion.button>
            )}

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 dark:bg-gray-800/50 dark:hover:bg-gray-700/60 backdrop-blur-sm border border-white/30 dark:border-gray-700/50 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isMobileMenuOpen ? (
                <X className={`h-4 w-4 ${darkMode ? 'text-white' : ''}`} />
              ) : (
                <Menu className={`h-4 w-4 ${darkMode ? 'text-white' : ''}`} />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-t border-white/20 dark:border-gray-700/30 shadow-xl"
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <div className="px-4 py-4 space-y-3">
              {/* Nav Items - Show different items based on user role */}
              {user && navItems.map((item) => (
                <motion.div
                  key={item.path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <button
                    onClick={() => {
                      handleNavigation(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full text-left py-3 px-4 text-sm font-medium rounded-xl backdrop-blur-sm border transition-all duration-200 ${
                      (location.pathname === item.path || 
                       (location.pathname === '/user' && 
                        ((item.path === '/user' && !location.search) || 
                         (location.search === `?view=${item.view}`))) ||
                       (location.pathname === '/admin' && 
                        ((item.path === '/admin' && !location.search) || 
                         (location.search === `?view=${item.view}`))))
                        ? user?.role === 'admin' 
                          ? 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-800/50'
                          : 'text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-900/20 border-purple-200/50 dark:border-purple-800/50'
                        : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-700/50 border-white/30 dark:border-gray-700/30'
                    }`}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                </motion.div>
              ))}
              
              {user ? (
                <>
                  <div className="pt-2 mt-2 border-t border-white/20 dark:border-gray-700/30">
                    <div className="flex items-center mb-4 px-4 py-3 rounded-xl bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm border border-white/30 dark:border-gray-700/30">
                      <div className={`w-10 h-10 ${
                        user.role === 'admin' 
                          ? 'bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 text-red-600 dark:text-red-400'
                          : 'bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-600 dark:text-purple-400'
                      } rounded-full flex items-center justify-center mr-3 shadow-sm backdrop-blur-sm border border-white/20 dark:border-gray-700/30`}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name || 'User'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {user.role === 'admin' ? 'Administrator' : 'Listener'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full text-left py-3 px-4 mt-1 text-sm font-medium rounded-xl text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20 hover:bg-red-100/80 dark:hover:bg-red-900/30 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 transition-all duration-200"
                    >
                      <X className="h-5 w-5 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-3 text-sm font-medium shadow-lg shadow-purple-500/25 backdrop-blur-sm border border-white/20 transition-all duration-200"
                >
                  Sign In
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;