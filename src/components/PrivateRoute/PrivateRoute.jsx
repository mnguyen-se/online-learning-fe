import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks';

/**
 * Bảo vệ route theo RBAC:
 * - Chưa đăng nhập -> redirect về redirectTo (mặc định /login).
 * - Đã đăng nhập nhưng role không nằm trong allowedRoles -> redirect về redirectWhenForbidden (mặc định /).
 */
function PrivateRoute({
  children,
  element,
  allowedRoles = [],
  redirectTo = '/login',
  redirectWhenForbidden = '/',
}) {
  const { isLoggedIn, role } = useAuth();
  const location = useLocation();

  const content = element || children;

  if (!isLoggedIn) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const hasRole = allowedRoles.length === 0 || allowedRoles.includes(role);
  if (!hasRole) {
    return <Navigate to={redirectWhenForbidden} replace />;
  }

  return content;
}

export default PrivateRoute;
