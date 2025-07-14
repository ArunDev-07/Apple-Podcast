// Utility to clean up localStorage
export const cleanLocalStorage = () => {
  const keysToCheck = ['user', 'token'];
  
  keysToCheck.forEach(key => {
    const value = localStorage.getItem(key);
    if (value === 'undefined' || value === 'null' || !value) {
      localStorage.removeItem(key);
    }
  });
};

// Call this on app start
cleanLocalStorage();