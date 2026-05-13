// src/Components/Hooks/useAuth.js  (or src/Hooks/useAuth.js based on your project)
import { useContext } from 'react';
import { AuthContext } from '../Context/AuthProvider';

const useAuth = () => {
  const ctx = useContext(AuthContext);

  // ✅ Helps catch mistakes like forgetting to wrap app with <AuthProvider>
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>. Check AuthProvider wrapping in index.js/App.js');
  }

  return ctx;
};

export default useAuth;
