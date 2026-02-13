import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllUsers, updateUser, createUser } from '../../api/userApi';
import DashboardLayout from '../../components/DashboardLayout';
import './dashboard.css';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', address: '', dateOfBirth: '', active: true });
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
  const [isCreating, setIsCreating] = useState(false);
  const [showViewDetailModal, setShowViewDetailModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
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
  }, [users, activeFilter, searchTerm]);

  // Calculate statistics
  const stats = {
    total: users.length,
    active: users.filter(u => u.active).length,
    newUsers: users.filter(u => {
      // Giả sử "new" là users được tạo trong 30 ngày gần đây
      if (!u.dateOfBirth) return false;
      const userDate = new Date(u.dateOfBirth);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return userDate >= thirtyDaysAgo;
    }).length,
    locked: users.filter(u => !u.active).length,
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

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setIsDeleting(true);
      // Update user: set active to false
      await updateUser(selectedUser.id, {
        ...selectedUser,
        active: false,
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...user, active: false } : user
      ));

      toast.success('Chuyển trạng thái không hoạt động thành công!');
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng. Vui lòng thử lại.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      active: user.active !== false,
    });
    setShowEditModal(true);
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditFormData({ name: '', address: '', dateOfBirth: '', active: true });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setIsSaving(true);
      await updateUser(editingUser.id, {
        name: editFormData.name,
        address: editFormData.address,
        dateOfBirth: editFormData.dateOfBirth,
        active: editFormData.active,
      });

      // Update local state
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, name: editFormData.name, address: editFormData.address, dateOfBirth: editFormData.dateOfBirth, active: editFormData.active }
          : user
      ));

      setSuccessMessage('Chỉnh sửa thông tin người dùng thành công!');
      setShowEditModal(false);
      setEditingUser(null);
      setEditFormData({ name: '', address: '', dateOfBirth: '', active: true });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
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
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (addUserFormData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

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
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{successMessage}</span>
            <button className="success-notification-close" onClick={() => setSuccessMessage('')}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-title" />
        <button className="btn-add-user" onClick={handleAddUserClick}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>+ Thêm người dùng</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-trend stat-trend-up">+12.5%</div>
              <div className="stat-label">Tổng người dùng</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-green">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-trend stat-trend-up">+8.2%</div>
              <div className="stat-label">Người dùng hoạt động</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-orange">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="17 6 23 6 23 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.newUsers}</div>
              <div className="stat-trend stat-trend-up">+23.1%</div>
              <div className="stat-label">Người dùng mới</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon stat-icon-red">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.locked}</div>
              <div className="stat-trend stat-trend-down">-4.3%</div>
              <div className="stat-label">Tài khoản bị khóa</div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="dashboard-controls">
          <div className="search-section">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

            <div className="action-buttons">
              <button className="action-btn">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Xuất Excel</span>
              </button>
              <button className="action-btn">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Nhập dữ liệu</span>
              </button>
            </div>
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
                <th>KHÓA HỌC</th>
                <th>NGÀY THAM GIA</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="table-loading">
                    <div className="loading-spinner-small"></div>
                    <span>Đang tải dữ liệu...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="table-empty">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
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
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          <span>{user.email || 'Chưa có'}</span>
                        </div>
                        <div className="contact-item">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                      <span className="course-count">5 khóa học</span>
                    </td>
                    <td>
                      <div className="join-date">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="action-icon-btn" 
                          title="Chỉnh sửa"
                          onClick={() => handleEditClick(user)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button 
                          className="action-icon-btn action-icon-btn-danger" 
                          title="Xóa"
                          onClick={() => handleDeleteClick(user)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      {/* View User Detail Modal */}
      {showViewDetailModal && viewingUser && (
        <div className="modal-overlay" onClick={() => { setShowViewDetailModal(false); setViewingUser(null); }}>
          <div className="modal-container modal-view-detail" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Thông tin chi tiết người dùng</h2>
              <button className="modal-close" onClick={() => { setShowViewDetailModal(false); setViewingUser(null); }}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận thay đổi trạng thái</h2>
              <button className="modal-close" onClick={handleCancelDelete}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>
                Bạn có chắc chắn muốn chuyển người dùng <strong>{selectedUser?.name || selectedUser?.username}</strong> sang trạng thái <strong>không hoạt động</strong> không?
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={handleCancelDelete} disabled={isDeleting}>
                Hủy
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Đang xử lý...' : 'Xác nhận'}
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
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                    value={editFormData.dateOfBirth}
                    onChange={(e) => setEditFormData({ ...editFormData, dateOfBirth: e.target.value })}
                  />
                </div>

                <div className="form-group form-group-toggle">
                  <label htmlFor="edit-active">Trạng thái hoạt động</label>
                  <button
                    type="button"
                    id="edit-active"
                    role="switch"
                    aria-checked={editFormData.active}
                    className={`toggle-active-btn ${editFormData.active ? 'toggle-active-on' : 'toggle-active-off'}`}
                    onClick={() => setEditFormData({ ...editFormData, active: !editFormData.active })}
                  >
                    <span className="toggle-active-slider" />
                    <span className="toggle-active-label">{editFormData.active ? 'Hoạt động' : 'Không hoạt động'}</span>
                  </button>
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
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
                        onChange={(e) => setAddUserFormData({ ...addUserFormData, username: e.target.value })}
                        required
                        placeholder="Nhập tên người dùng"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-password">Mật khẩu *</label>
                      <input
                        type="password"
                        id="add-password"
                        value={addUserFormData.password}
                        onChange={(e) => setAddUserFormData({ ...addUserFormData, password: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-email">Email *</label>
                      <input
                        type="email"
                        id="add-email"
                        value={addUserFormData.email}
                        onChange={(e) => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
                        required
                        placeholder="Nhập email"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="add-dateOfBirth">Ngày sinh</label>
                      <input
                        type="date"
                        id="add-dateOfBirth"
                        value={addUserFormData.dateOfBirth}
                        onChange={(e) => setAddUserFormData({ ...addUserFormData, dateOfBirth: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-column">
                    <div className="form-group">
                      <label htmlFor="add-name">Họ và tên *</label>
                      <input
                        type="text"
                        id="add-name"
                        value={addUserFormData.name}
                        onChange={(e) => setAddUserFormData({ ...addUserFormData, name: e.target.value })}
                        required
                        placeholder="Nhập họ và tên"
                      />
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
