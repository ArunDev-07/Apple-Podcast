import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);

  // Enhanced token validation - check if token exists and not expired
  const isValidToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined') return false;
    
    // If we have expiry time, check if token is still valid
    if (tokenExpiry) {
      return new Date().getTime() < tokenExpiry;
    }
    
    return true; // If no expiry time set, assume token is valid
  }, [tokenExpiry]);

  // Load user from localStorage on initial mount
  useEffect(() => {
    // Safely check for stored user session
    try {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      const storedExpiry = localStorage.getItem('tokenExpiry');
      
      // Only parse if both exist and are not "undefined" string
      if (storedUser && storedUser !== 'undefined' && token && token !== 'undefined') {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Set token expiry if available
        if (storedExpiry && storedExpiry !== 'undefined') {
          setTokenExpiry(parseInt(storedExpiry, 10));
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
      // Clear invalid data
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh token before expiry (if token refresh endpoint is available)
  // This is useful for long video uploads to prevent authentication issues
  /*
  useEffect(() => {
    if (user && tokenExpiry) {
      // Calculate time until token needs refresh (e.g., 5 minutes before expiry)
      const currentTime = new Date().getTime();
      const timeUntilRefresh = tokenExpiry - currentTime - (5 * 60 * 1000); // 5 minutes before expiry
      
      if (timeUntilRefresh > 0) {
        // Set up interval to refresh token
        const interval = setTimeout(refreshToken, timeUntilRefresh);
        setTokenRefreshInterval(interval);
      } else {
        // Token is already expired or close to expiry, refresh immediately
        refreshToken();
      }
    }
    
    return () => {
      if (tokenRefreshInterval) {
        clearTimeout(tokenRefreshInterval);
      }
    };
  }, [user, tokenExpiry]);
  
  // Token refresh function - implement if your API supports token refresh
  const refreshToken = async () => {
    try {
      // Replace with your token refresh API call
      // const response = await apiRefreshToken();
      // const { token, expiresAt } = response.data;
      
      // localStorage.setItem('token', token);
      // localStorage.setItem('tokenExpiry', expiresAt);
      // setTokenExpiry(expiresAt);
      
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, log user out for security
      logout();
    }
  };
  */

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const response = await apiLogin(email, password);
      const { user, token, expiresAt } = response.data;
      
      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
      
      // Store token expiry if available
      if (expiresAt) {
        localStorage.setItem('tokenExpiry', expiresAt.toString());
        setTokenExpiry(expiresAt);
      }
      
      setUser(user);
      
      console.log('Login successful:', user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false,
        error: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, role = 'user') => {
    try {
      const response = await apiRegister(name, email, password, role);
      return { success: true };
    } catch (error) {
      return { 
        success: false,
        error: error.response?.data?.message || error.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      setUser(null);
      setTokenExpiry(null);
      
      // Clear token refresh interval if exists
      if (tokenRefreshInterval) {
        clearTimeout(tokenRefreshInterval);
        setTokenRefreshInterval(null);
      }
    }
  };

  // Add a function to check if the user has admin privileges
  const isAdmin = useCallback(() => {
    return user && user.role === 'admin';
  }, [user]);

  // Add a function to check upload permissions
  const canUploadVideo = useCallback(() => {
    // Example: Allow video uploads for admins only
    // Modify this based on your app's permission model
    return isAdmin();
  }, [isAdmin]);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAdmin,
    canUploadVideo,
    isValidToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};