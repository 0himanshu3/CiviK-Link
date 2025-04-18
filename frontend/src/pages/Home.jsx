import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';

export default function Home() {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === 'NGO') return <Navigate to="/ngo-dashboard/requests" />;
  if(user.role==='User')
  return <Navigate to="/dashboard" />;
}
