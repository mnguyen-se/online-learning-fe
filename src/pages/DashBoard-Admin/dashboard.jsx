import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllUsers, updateUser, createUser } from '../../api/userApi';
import { getCourses } from '../../api/coursesApi';
import { getEnrolledCoursesByUsername, getEnrolledStudentsByCourse } from '../../api/enrollmentApi';
import DashboardLayout from '../../components/DashboardLayout';
import './dashboard.css';

const USERS_PER_PAGE = 10;

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', address: '', dateOfBirth: '' });
  const [editFormErrors, setEditFormErrors] = useState({ dateOfBirth: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserFormData, setAddUserFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    address: '',
    dateOfBirth: '',
    role: 'STUDENT'
  });
  const [addUserFormErrors, setAddUserFormErrors] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    dateOfBirth: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showViewDetailModal, setShowViewDetailModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [lookupMode, setLookupMode] = useState('student'); // 'student' | 'course'
  const [lookupUsername, setLookupUsername] = useState('');
  const [lookupCourseId, setLookupCourseId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (activeFilter !== 'Tất cả') {
      const roleMap = {
        'Học viên': 'STUDENT',
        'Giáo viên': 'TEACHER',
        'Quản trị': 'ADMIN',
        'Quản lý': 'COURSE_MANAGER',
      };
      filtered = filtered.filter(user => user.role === roleMap[activeFilter]);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [users, activeFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedUsers = useMemo(() => {
    const start = (safePage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, safePage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (safePage <= 3) {
      pages.push(1, 2, 3, '...', totalPages);
    } else if (safePage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
    }
    return pages;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      STUDENT: 'Học viên',
      TEACHER: 'Giáo viên',
      ADMIN: 'Quản trị viên',
      COURSE_MANAGER: 'Quản lý',
      MANAGER: 'Quản lý',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const roleMap = {
      STUDENT: 'badge-student',
      TEACHER: 'badge-teacher',
      ADMIN: 'badge-admin',
      COURSE_MANAGER: 'badge-manager',
      MANAGER: 'badge-manager',
    };
    return roleMap[role] || '';
  };

  const getStatusLabel = (status) => {
    if (status == null || status === '') return '—';
    const s = String(status).toUpperCase();
    const map = { ACTIVE: 'Đang hoạt động', INACTIVE: 'Ngừng hoạt động', BANNED: 'Bị khóa' };
    return map[s] || status;
  };

  const getStatusBadgeClass = (status) => {
    if (status == null || status === '') return '';
    const s = String(status).toUpperCase();
    const map = { ACTIVE: 'status-active', INACTIVE: 'status-inactive', BANNED: 'status-banned' };
    return map[s] || 'status-inactive';
  };

  const handleToggleClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleConfirmToggle = async () => {
    if (!selectedUser) return;
    const newStatus = !selectedUser.active;
    try {
      setIsDeleting(true);
      await updateUser(selectedUser.id, { ...selectedUser, active: newStatus });
      setUsers(users.map(user =>
        user.id === selectedUser.id ? { ...user, active: newStatus } : user
      ));
      toast.success(newStatus ? 'Đã kích hoạt tài khoản.' : 'Đã khóa tài khoản người dùng.');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const maxDateOfBirth = new Date().toISOString().slice(0, 10);

  const isDateOfBirthInFuture = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const d = new Date(dateStr.trim());
    if (Number.isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d > today;
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    });
    setEditFormErrors({ dateOfBirth: '' });
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditFormData({ name: '', address: '', dateOfBirth: '' });
    setEditFormErrors({ dateOfBirth: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editFormData.dateOfBirth && isDateOfBirthInFuture(editFormData.dateOfBirth)) {
      setEditFormErrors({ dateOfBirth: 'Ngày sinh không hợp lệ (không được lớn hơn ngày hiện tại).' });
      return;
    }
    setEditFormErrors({ dateOfBirth: '' });

    try {
      setIsSaving(true);
      await updateUser(editingUser.id, {
        name: editFormData.name,
        address: editFormData.address,
        dateOfBirth: editFormData.dateOfBirth,
        active: editingUser.active !== false,
      });

      setUsers(users.map(user =>
        user.id === editingUser.id
          ? { ...user, name: editFormData.name, address: editFormData.address, dateOfBirth: editFormData.dateOfBirth }
          : user
      ));

      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({ name: '', address: '', dateOfBirth: '' });
      setEditFormErrors({ dateOfBirth: '' });

      toast.success('Cập nhật thông tin người dùng thành công.', { position: 'top-right', autoClose: 3500 });
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const validateAddUserForm = () => {
    const { username, name, email, password, dateOfBirth } = addUserFormData;
    const errors = { username: '', name: '', email: '', password: '', dateOfBirth: '' };

    if (!username.trim()) {
      errors.username = 'Tên người dùng không được để trống.';
    } else if (username.trim().length < 4) {
      errors.username = 'Tên người dùng phải có ít nhất 4 ký tự.';
    }

    if (!name.trim()) {
      errors.name = 'Họ và tên không được để trống.';
    } else if (name.trim().length < 4) {
      errors.name = 'Họ và tên phải có ít nhất 4 ký tự.';
    }

    if (!email.trim()) {
      errors.email = 'Email không được để trống.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Email không đúng định dạng.';
    }

    if (!password.trim()) {
      errors.password = 'Mật khẩu không được để trống.';
    } else if (password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
    }

    if (dateOfBirth && isDateOfBirthInFuture(dateOfBirth)) {
      errors.dateOfBirth = 'Ngày sinh không hợp lệ (không được lớn hơn ngày hiện tại).';
    }

    setAddUserFormErrors(errors);
    return !Object.values(errors).some(Boolean);
  };

  const handleAddUserClick = () => {
    setAddUserFormData({
      username: '',
      password: '',
      email: '',
      name: '',
      address: '',
      dateOfBirth: '',
      role: 'STUDENT'
    });
    setAddUserFormErrors({ username: '', name: '', email: '', password: '', dateOfBirth: '' });
    setShowAddUserModal(true);
  };

  const handleCancelAddUser = () => {
    setShowAddUserModal(false);
    setAddUserFormData({
      username: '',
      password: '',
      email: '',
      name: '',
      address: '',
      dateOfBirth: '',
      role: 'STUDENT'
    });
    setAddUserFormErrors({ username: '', name: '', email: '', password: '', dateOfBirth: '' });
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!validateAddUserForm()) return;

    try {
      setIsCreating(true);
      await createUser(addUserFormData);

      // Refresh user list
      await fetchUsers();

      toast.success('Thêm người dùng thành công!');
      setShowAddUserModal(false);
      setAddUserFormData({
        username: '',
        password: '',
        email: '',
        name: '',
        address: '',
        dateOfBirth: '',
        role: 'STUDENT'
      });
      setAddUserFormErrors({ username: '', name: '', email: '', password: '', dateOfBirth: '' });
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi tạo người dùng. Vui lòng thử lại.');
    } finally {
      setIsCreating(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Chua dang nhap, hien thi dashboard o che do demo.');
      setUsers([]);
      setFilteredUsers([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        navigate('/login');
      } else if (error.response?.status === 403) {
        const message = error.response?.data?.message || error.response?.data;
        const isInactive = typeof message === 'string' && message.toLowerCase().includes('inactive');
        toast.error(isInactive
          ? 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
          : 'Bạn không có quyền truy cập trang này.');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
      } else {
        toast.error('Không thể tải danh sách người dùng. Vui lòng thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    getCourses()
      .then((data) => {
        const raw = Array.isArray(data) ? data : data?.data ?? [];
        setCourses(raw);
      })
      .catch(() => setCourses([]));
  }, []);

  const handleLookup = useCallback(async () => {
    setLookupResult(null);
    if (lookupMode === 'student') {
      const username = lookupUsername.trim();
      if (!username) {
        toast.warning('Vui lòng nhập username học viên.');
        return;
      }
      setLookupLoading(true);
      try {
        const data = await getEnrolledCoursesByUsername(username);
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setLookupResult({ type: 'courses', username, data: list });
      } catch {
        toast.error('Không tìm thấy học viên hoặc không có quyền truy cập.');
        setLookupResult({ type: 'courses', username, data: [] });
      } finally {
        setLookupLoading(false);
      }
    } else {
      const courseId = lookupCourseId;
      if (!courseId) {
        toast.warning('Vui lòng chọn khóa học.');
        return;
      }
      setLookupLoading(true);
      try {
        const data = await getEnrolledStudentsByCourse(courseId);
        const list = Array.isArray(data) ? data : data?.data ?? [];
        const course = courses.find((c) => String(c.id ?? c.courseId ?? c.course_id) === String(courseId));
        setLookupResult({ type: 'students', courseId, courseTitle: course?.title || courseId, data: list });
      } catch {
        toast.error('Không thể tải danh sách học viên.');
        setLookupResult({ type: 'students', courseId, courseTitle: lookupCourseId, data: [] });
      } finally {
        setLookupLoading(false);
      }
    }
  }, [lookupMode, lookupUsername, lookupCourseId, courses]);

  return (
    <DashboardLayout
      pageTitle="Quản Lý Người Dùng"
      pageSubtitle="Quản lý và theo dõi tất cả người dùng trong hệ thống"
    >
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="success-notification">
          <div className="success-notification-content">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{successMessage}</span>
            <button className="success-notification-close" onClick={() => setSuccessMessage('')}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-title" />
        <button className="btn-add-user" onClick={handleAddUserClick}>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>+ Thêm người dùng</span>
        </button>
      </div>

      {/* Tra cứu phân bổ Học viên - Khóa học */}
      <div className="dashboard-lookup-card">
        <h3 className="dashboard-lookup-title">Tra cứu phân bổ Học viên — Khóa học</h3>
        <p className="dashboard-lookup-desc">Tra cứu nhanh học viên đang ở khóa học nào hoặc khóa học có những học viên nào.</p>
        <div className="dashboard-lookup-tabs">
          <button
            type="button"
            className={`dashboard-lookup-tab ${lookupMode === 'student' ? 'active' : ''}`}
            onClick={() => { setLookupMode('student'); setLookupResult(null); }}
          >
            Theo học viên (username)
          </button>
          <button
            type="button"
            className={`dashboard-lookup-tab ${lookupMode === 'course' ? 'active' : ''}`}
            onClick={() => { setLookupMode('course'); setLookupResult(null); }}
          >
            Theo khóa học
          </button>
        </div>
        <div className="dashboard-lookup-form">
          {lookupMode === 'student' ? (
            <div className="dashboard-lookup-row">
              <input
                type="text"
                placeholder="Nhập username học viên (VD: student01)"
                value={lookupUsername}
                onChange={(e) => setLookupUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                className="dashboard-lookup-input"
              />
              <button type="button" className="dashboard-lookup-btn" onClick={handleLookup} disabled={lookupLoading}>
                {lookupLoading ? 'Đang tra cứu...' : 'Tra cứu'}
              </button>
            </div>
          ) : (
            <div className="dashboard-lookup-row">
              <select
                value={lookupCourseId}
                onChange={(e) => setLookupCourseId(e.target.value)}
                className="dashboard-lookup-select"
              >
                <option value="">— Chọn khóa học —</option>
                {courses.map((c) => (
                  <option key={c.id ?? c.courseId ?? c.course_id} value={c.id ?? c.courseId ?? c.course_id}>
                    {c.title || `Khóa #${c.id ?? c.courseId}`}
                  </option>
                ))}
              </select>
              <button type="button" className="dashboard-lookup-btn" onClick={handleLookup} disabled={lookupLoading}>
                {lookupLoading ? 'Đang tra cứu...' : 'Tra cứu'}
              </button>
            </div>
          )}
        </div>
        {lookupResult && (
          <div className="dashboard-lookup-result">
            {lookupResult.type === 'courses' ? (
              <>
                <h4>Khóa học của học viên &quot;{lookupResult.username}&quot;</h4>
                {lookupResult.data.length === 0 ? (
                  <p className="dashboard-lookup-empty">Học viên chưa ghi danh khóa học nào.</p>
                ) : (
                  <ul className="dashboard-lookup-list">
                    {lookupResult.data.map((item, idx) => (
                      <li key={item.enrollmentId ?? item.courseId ?? idx}>
                        <strong>{item.courseTitle ?? item.title ?? item.course?.title ?? '—'}</strong>
                        {item.enrollmentStatus && (
                          <span className={`dashboard-lookup-badge status-badge ${getStatusBadgeClass(item.enrollmentStatus)}`}>
                            {getStatusLabel(item.enrollmentStatus)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>
                <h4>Học viên trong khóa &quot;{lookupResult.courseTitle}&quot;</h4>
                {lookupResult.data.length === 0 ? (
                  <p className="dashboard-lookup-empty">Khóa học chưa có học viên nào.</p>
                ) : (
                  <div className="dashboard-lookup-table-wrap">
                    <table className="dashboard-lookup-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Tên</th>
                          <th>Email</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lookupResult.data.map((s, idx) => (
                          <tr key={s.enrollmentId ?? s.studentId ?? idx}>
                            <td>{idx + 1}</td>
                            <td>{s.name || s.username || '—'}</td>
                            <td>{s.email || '—'}</td>
                            <td>
                              {s.status ? (
                                <span className={`status-badge ${getStatusBadgeClass(s.status)}`}>
                                  {getStatusLabel(s.status)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="dashboard-controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${activeFilter === 'Tất cả' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Tất cả')}
            >
              Tất cả
            </button>
            <button
              className={`filter-btn ${activeFilter === 'Học viên' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Học viên')}
            >
              Học viên
            </button>
            <button
              className={`filter-btn ${activeFilter === 'Giáo viên' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Giáo viên')}
            >
              Giáo viên
            </button>
            <button
              className={`filter-btn ${activeFilter === 'Quản trị' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Quản trị')}
            >
              Quản trị
            </button>
            <button
              className={`filter-btn ${activeFilter === 'Quản lý' ? 'active' : ''}`}
              onClick={() => setActiveFilter('Quản lý')}
            >
              Quản lý
            </button>
          </div>

          <div className="action-buttons" />
        </div>
      </div>

      {/* Users Table */}
      <div className="dashboard-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>NGƯỜI DÙNG</th>
              <th>LIÊN HỆ</th>
              <th>VAI TRÒ</th>
                <th>TRẠNG THÁI</th>
                <th>NGÀY THAM GIA</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="table-loading">
                  <div className="loading-spinner-small"></div>
                  <span>Đang tải dữ liệu...</span>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="6" className="table-empty">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name || user.username}</div>
                        <div className="user-id">ID: #{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div className="contact-item">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{user.email || 'Chưa có'}</span>
                      </div>
                      <div className="contact-item">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>{user.phone || 'Chưa có'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                      {user.active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                    <td>
                    <div className="join-date">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>{formatDate(user.dateOfBirth)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="action-icon-btn"
                        title="Xem chi tiết"
                        onClick={() => {
                          setViewingUser(user);
                          setShowViewDetailModal(true);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className="action-icon-btn"
                        title="Chỉnh sửa"
                        onClick={() => handleEditClick(user)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <label className="user-status-switch" title={user.active ? "Khóa tài khoản" : "Kích hoạt tài khoản"}>
                        <input
                          type="checkbox"
                          checked={user.active}
                          onChange={() => handleToggleClick(user)}
                        />
                        <span className="user-status-slider round"></span>
                      </label>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!isLoading && filteredUsers.length > 0 && totalPages > 0 && (
          <div className="dashboard-pagination">
            <button
              type="button"
              className="pagination-btn pagination-prev"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              aria-label="Trang trước"
            >
              &lt;
            </button>
            <div className="pagination-numbers">
              {getPageNumbers().map((item, idx) =>
                item === '...' ? (
                  <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={`pagination-num ${safePage === item ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                    aria-label={`Trang ${item}`}
                    aria-current={safePage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                )
              )}
            </div>
            <button
              type="button"
              className="pagination-btn pagination-next"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              aria-label="Trang sau"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Modal xác nhận khóa tài khoản (soft delete) */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận {selectedUser.active ? 'khóa' : 'kích hoạt'} tài khoản</h2>
              <button className="modal-close" onClick={handleCancelDelete} aria-label="Đóng">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn {selectedUser.active ? 'khóa' : 'kích hoạt'} tài khoản người dùng này không?
                <br />
                {selectedUser.active ? 'Người dùng sẽ không thể đăng nhập cho đến khi được kích hoạt lại.' : 'Người dùng sẽ có thể đăng nhập và sử dụng hệ thống.'}
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCancelDelete} disabled={isDeleting}>
                Hủy
              </button>
              <button type="button" className="modal-btn modal-btn-confirm" onClick={handleConfirmToggle} disabled={isDeleting}>
                {isDeleting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Detail Modal */}
      {showViewDetailModal && viewingUser && (
        <div className="modal-overlay" onClick={() => { setShowViewDetailModal(false); setViewingUser(null); }}>
          <div className="modal-container modal-view-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thông tin chi tiết người dùng</h2>
              <button className="modal-close" onClick={() => { setShowViewDetailModal(false); setViewingUser(null); }}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="modal-body modal-view-detail-body">
              <div className="view-detail-avatar">
                <span>{viewingUser.name?.[0]?.toUpperCase() || viewingUser.username?.[0]?.toUpperCase() || 'U'}</span>
              </div>
              <div className="view-detail-grid">
                <div className="view-detail-row">
                  <span className="view-detail-label">ID</span>
                  <span className="view-detail-value">#{viewingUser.id}</span>
                </div>
                <div className="view-detail-row">
                  <span className="view-detail-label">Tên đăng nhập</span>
                  <span className="view-detail-value">{viewingUser.username || '—'}</span>
                </div>
                <div className="view-detail-row">
                  <span className="view-detail-label">Họ và tên</span>
                  <span className="view-detail-value">{viewingUser.name || '—'}</span>
                </div>
                <div className="view-detail-row">
                  <span className="view-detail-label">Email</span>
                  <span className="view-detail-value">{viewingUser.email || 'Chưa có'}</span>
                </div>
                <div className="view-detail-row">
                  <span className="view-detail-label">Vai trò</span>
                  <span className={`role-badge ${getRoleBadgeClass(viewingUser.role)}`}>{getRoleLabel(viewingUser.role)}</span>
                </div>
                <div className="view-detail-row">
                  <span className="view-detail-label">Trạng thái</span>
                  <span className={`status-badge ${viewingUser.active ? 'status-active' : 'status-inactive'}`}>
                    {viewingUser.active ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </div>
                <div className="view-detail-row">
                  <span className="view-detail-label">Địa chỉ</span>
                  <span className="view-detail-value">{viewingUser.address || 'Chưa có'}</span>
                </div>
                <div className="view-detail-row">
                  <span className="view-detail-label">Ngày sinh</span>
                  <span className="view-detail-value">{formatDate(viewingUser.dateOfBirth)}</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => { setShowViewDetailModal(false); setViewingUser(null); }}
              >
                Đóng
              </button>
              <button
                className="modal-btn modal-btn-confirm"
                onClick={() => {
                  setShowViewDetailModal(false);
                  setViewingUser(null);
                  handleEditClick(viewingUser);
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-container modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chỉnh sửa thông tin người dùng</h2>
              <button className="modal-close" onClick={handleCancelEdit}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body modal-form">
                <div className="form-group">
                  <label htmlFor="edit-name">Họ và tên *</label>
                  <input
                    type="text"
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-address">Địa chỉ</label>
                  <input
                    type="text"
                    id="edit-address"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-dateOfBirth">Ngày sinh</label>
                  <input
                    type="date"
                    id="edit-dateOfBirth"
                    max={maxDateOfBirth}
                    value={editFormData.dateOfBirth}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, dateOfBirth: e.target.value });
                      setEditFormErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                    }}
                    className={editFormErrors.dateOfBirth ? 'input-error' : ''}
                  />
                  {editFormErrors.dateOfBirth && (
                    <span className="form-error">{editFormErrors.dateOfBirth}</span>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCancelEdit} disabled={isSaving}>
                  Hủy
                </button>
                <button type="submit" className="modal-btn modal-btn-confirm-edit" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={handleCancelAddUser}>
          <div className="modal-container modal-edit" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thêm người dùng mới</h2>
              <button className="modal-close" onClick={handleCancelAddUser}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddUserSubmit}>
              <div className="modal-body modal-form">
                <div className="form-row">
                  <div className="form-column">
                    <div className="form-group">
                      <label htmlFor="add-username">Tên người dùng *</label>
                      <input
                        type="text"
                        id="add-username"
                        value={addUserFormData.username}
                        onChange={(e) => {
                          setAddUserFormData({ ...addUserFormData, username: e.target.value });
                          setAddUserFormErrors((prev) => ({ ...prev, username: '' }));
                        }}
                        placeholder="Nhập tên người dùng"
                        className={addUserFormErrors.username ? 'input-error' : ''}
                      />
                      {addUserFormErrors.username && (
                        <span className="form-error">{addUserFormErrors.username}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-password">Mật khẩu *</label>
                      <input
                        type="password"
                        id="add-password"
                        value={addUserFormData.password}
                        onChange={(e) => {
                          setAddUserFormData({ ...addUserFormData, password: e.target.value });
                          setAddUserFormErrors((prev) => ({ ...prev, password: '' }));
                        }}
                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                        className={addUserFormErrors.password ? 'input-error' : ''}
                      />
                      {addUserFormErrors.password && (
                        <span className="form-error">{addUserFormErrors.password}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-email">Email *</label>
                      <input
                        type="email"
                        id="add-email"
                        value={addUserFormData.email}
                        onChange={(e) => {
                          setAddUserFormData({ ...addUserFormData, email: e.target.value });
                          setAddUserFormErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        placeholder="Nhập email"
                        className={addUserFormErrors.email ? 'input-error' : ''}
                      />
                      {addUserFormErrors.email && (
                        <span className="form-error">{addUserFormErrors.email}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-dateOfBirth">Ngày sinh</label>
                      <input
                        type="date"
                        id="add-dateOfBirth"
                        max={maxDateOfBirth}
                        value={addUserFormData.dateOfBirth}
                        onChange={(e) => {
                          setAddUserFormData({ ...addUserFormData, dateOfBirth: e.target.value });
                          setAddUserFormErrors((prev) => ({ ...prev, dateOfBirth: '' }));
                        }}
                        className={addUserFormErrors.dateOfBirth ? 'input-error' : ''}
                      />
                      {addUserFormErrors.dateOfBirth && (
                        <span className="form-error">{addUserFormErrors.dateOfBirth}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-column">
                    <div className="form-group">
                      <label htmlFor="add-name">Họ và tên *</label>
                      <input
                        type="text"
                        id="add-name"
                        value={addUserFormData.name}
                        onChange={(e) => {
                          setAddUserFormData({ ...addUserFormData, name: e.target.value });
                          setAddUserFormErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        placeholder="Nhập họ và tên"
                        className={addUserFormErrors.name ? 'input-error' : ''}
                      />
                      {addUserFormErrors.name && (
                        <span className="form-error">{addUserFormErrors.name}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-address">Địa chỉ</label>
                      <input
                        type="text"
                        id="add-address"
                        value={addUserFormData.address}
                        onChange={(e) => setAddUserFormData({ ...addUserFormData, address: e.target.value })}
                        placeholder="Nhập địa chỉ"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-role">Vai trò *</label>
                      <select
                        id="add-role"
                        value={addUserFormData.role}
                        onChange={(e) => setAddUserFormData({ ...addUserFormData, role: e.target.value })}
                        required
                      >
                        <option value="STUDENT">Học viên</option>
                        <option value="TEACHER">Giáo viên</option>
                        <option value="ADMIN">Quản trị viên</option>
                        <option value="COURSE_MANAGER">Quản lý</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="modal-btn modal-btn-cancel" onClick={handleCancelAddUser} disabled={isCreating}>
                  Hủy
                </button>
                <button type="submit" className="modal-btn modal-btn-confirm-edit" disabled={isCreating}>
                  {isCreating ? 'Đang tạo...' : 'Tạo người dùng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
