import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { getUser } from '../redux/slices/authSlice';

const ProtectedAdminRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!user && !isAuthenticated && !loading) {
      const storedUser = localStorage.getItem('user');
      const userRole = localStorage.getItem('userRole');
      
      if (storedUser && userRole === 'admin') {
        dispatch(getUser());
      } else {
        setIsChecking(false);
      }
    } else {
      setIsChecking(false);
    }
  }, [user, isAuthenticated, loading, dispatch]);

  if (loading || isChecking) return null;

  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute; 