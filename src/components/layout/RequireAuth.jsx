import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/data/navigation';

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;
  }
  return children;
}

export default RequireAuth;
