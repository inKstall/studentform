import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      setIsAuthenticated(!!user);
      
      // Check if the user is the admin
      if (user && user.email === 'admin@questo.com') {
        setIsAdmin(true);
      } else if (user) {
        // If user is logged in but not admin, log them out
        auth.signOut().then(() => {
          setIsAdmin(false);
          console.log('Non-admin user logged out');
        });
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && isAdmin ? (
        <AdminDashboard />
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md">
            <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
