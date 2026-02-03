import { useSelector } from 'react-redux';

/** Role -> path khi nhấn "Vào Dashboard" từ Home */
export const ROLE_PATH_MAP = {
  ADMIN: '/admin',
  COURSE_MANAGER: '/manager',
  TEACHER: '/teacher',
  STUDENT: '/',
};

/** Các role quản trị (hiển thị DashboardHeader, vào được dashboard) */
export const STAFF_ROLES = ['ADMIN', 'COURSE_MANAGER', 'TEACHER'];

/**
 * Custom hook: lấy thông tin auth từ Redux + localStorage (fallback khi chưa có trong Redux).
 * Dùng cho Conditional Header, Private Route, và nút "Vào Dashboard".
 */
export function useAuth() {
  const user = useSelector((state) => state.user);
  const role = user?.role || (typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null) || '';
  const username = user?.username || (typeof localStorage !== 'undefined' ? localStorage.getItem('username') : null) || '';
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;

  const isLoggedIn = !!token;
  const isStaff = STAFF_ROLES.includes(role);
  const isAdminGroup = isStaff; // alias theo tên trong mẫu

  /** Đường dẫn dashboard tương ứng role (dùng cho handleDashboardRedirect). */
  const getDashboardPath = () => ROLE_PATH_MAP[role] || '/login';

  return {
    user,
    role,
    username,
    token,
    isLoggedIn,
    isStaff,
    isAdminGroup,
    getDashboardPath,
  };
}
