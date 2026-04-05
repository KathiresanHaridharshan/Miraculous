// Protected route – redirects to /login if not authenticated
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingPage } from '../common/Loading';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage message="Loading Miraculous..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
