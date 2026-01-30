import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Select from 'react-select';
import { register } from '../../api/userApi';
import {
  getProvinces,
  getDistrictsByProvinceCode,
  getWardsByDistrictCode,
} from '../../api/addressApi';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    name: '',
    address: '',
    dateOfBirth: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedProvinceName, setSelectedProvinceName] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');
  const [selectedWardName, setSelectedWardName] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const navigate = useNavigate();

  // 1. Lấy danh sách Tỉnh/Thành khi component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const data = await getProvinces();
        setProvinces(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading provinces:', error);
        setProvinces([]);
        toast.error('Không thể tải danh sách tỉnh/thành phố. Vui lòng kiểm tra kết nối.');
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 2. Khi Tỉnh thay đổi -> Lấy Quận/Huyện và Reset Quận/Xã
  const handleProvinceChange = async (option) => {
    if (!option) {
      setSelectedProvinceCode('');
      setSelectedProvinceName('');
      setDistricts([]);
      setSelectedDistrictCode('');
      setSelectedDistrictName('');
      setWards([]);
      setSelectedWardCode('');
      setSelectedWardName('');
      return;
    }
    const code = option.value;
    const name = option.label;
    setSelectedProvinceCode(code);
    setSelectedProvinceName(name);
    setDistricts([]);
    setSelectedDistrictCode('');
    setSelectedDistrictName('');
    setWards([]);
    setSelectedWardCode('');
    setSelectedWardName('');
    setIsLoadingDistricts(true);
    try {
      const data = await getDistrictsByProvinceCode(code);
      setDistricts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading districts:', error);
      setDistricts([]);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  // 3. Khi Quận thay đổi -> Lấy Xã/Phường và Reset Xã
  const handleDistrictChange = async (option) => {
    if (!option) {
      setSelectedDistrictCode('');
      setSelectedDistrictName('');
      setWards([]);
      setSelectedWardCode('');
      setSelectedWardName('');
      return;
    }
    const code = option.value;
    const name = option.label;
    setSelectedDistrictCode(code);
    setSelectedDistrictName(name);
    setWards([]);
    setSelectedWardCode('');
    setSelectedWardName('');
    setIsLoadingWards(true);
    try {
      const data = await getWardsByDistrictCode(code);
      setWards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading wards:', error);
      setWards([]);
      toast.error('Không thể tải danh sách xã/phường');
    } finally {
      setIsLoadingWards(false);
    }
  };

  const handleWardChange = (option) => {
    if (!option) {
      setSelectedWardCode('');
      setSelectedWardName('');
      return;
    }
    setSelectedWardCode(option.value);
    setSelectedWardName(option.label);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    // Validation địa chỉ: bắt buộc chọn đủ Tỉnh, Quận, Xã
    if (!selectedProvinceCode || !selectedDistrictCode || !selectedWardCode) {
      toast.error('Vui lòng chọn đầy đủ Tỉnh/Thành phố, Quận/Huyện và Xã/Phường.');
      return;
    }

    setIsLoading(true);

    try {
      const parts = [
        addressDetail,
        selectedWardName,
        selectedDistrictName,
        selectedProvinceName,
      ].filter(Boolean);
      const fullAddress = parts.join(', ');

      const submitData = {
        ...formData,
        address: fullAddress || formData.address,
      };

      await register(submitData);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối hoặc đảm bảo backend đang chạy.';
      } else if (error.response) {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `Lỗi: ${error.response.status} - ${error.response.statusText}`;
      } else if (error.request) {
        errorMessage = 'Không nhận được phản hồi từ server. Vui lòng thử lại.';
      } else {
        errorMessage = error.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
          {/* Header */}
          <div className="register-header">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="4" width="16" height="16" rx="4" ry="4" fill="#8B5CF6" opacity="0.1" stroke="#8B5CF6" strokeWidth="2"/>
                <path d="M12 3L2 7L12 11L22 7L12 3Z" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M2 17L12 21L22 17" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M2 12L12 16L22 12" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <h1 className="brand-name">EduLearn AI</h1>
            <p className="tagline">Tạo tài khoản mới</p>
          </div>

          {/* Register Form – Thứ tự: thông tin cá nhân → email/ngày sinh → mật khẩu → địa chỉ (Tỉnh → Quận → Xã → Số nhà) */}
          <form className="register-form" onSubmit={handleSubmit}>
            {/* Hàng 1: Tên đăng nhập | Họ và tên */}
            <div className="form-row">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="username">Tên người dùng *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="vd: nguyenvan_a"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="name">Họ và tên *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Nguyễn Văn A"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Hàng 2: Email | Ngày sinh */}
            <div className="form-row">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="dateOfBirth">Ngày sinh</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Hàng 3: Mật khẩu | Xác nhận mật khẩu – cạnh nhau để tab order rõ ràng */}
            <div className="form-row">
              <div className="form-column">
                <div className="form-group password-group">
                  <label htmlFor="password">Mật khẩu *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="form-column">
                <div className="form-group password-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showConfirmPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Địa chỉ: Tỉnh → Quận/Huyện → Xã/Phường → Số nhà, đường (có search) */}
            <div className="form-section-label">Địa chỉ *</div>
            <div className="form-row">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="province">Tỉnh/Thành phố *</label>
                  <Select
                    inputId="province"
                    isClearable
                    isSearchable
                    placeholder="-- Chọn Tỉnh/Thành --"
                    options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                    value={
                      selectedProvinceCode
                        ? {
                            value: selectedProvinceCode,
                            label: selectedProvinceName,
                          }
                        : null
                    }
                    onChange={handleProvinceChange}
                    isLoading={isLoadingProvinces}
                    noOptionsMessage={() => 'Không có dữ liệu'}
                    classNamePrefix="register-select"
                  />
                  {!isLoadingProvinces && provinces.length > 0 && (
                    <span className="form-hint">({provinces.length} tỉnh – gõ để tìm)</span>
                  )}
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="district">Quận/Huyện *</label>
                  <Select
                    inputId="district"
                    isClearable
                    isSearchable
                    placeholder={
                      !selectedProvinceCode
                        ? 'Vui lòng chọn Tỉnh/Thành trước'
                        : '-- Chọn Quận/Huyện --'
                    }
                    options={districts.map((d) => ({ value: d.code, label: d.name }))}
                    value={
                      selectedDistrictCode
                        ? {
                            value: selectedDistrictCode,
                            label: selectedDistrictName,
                          }
                        : null
                    }
                    onChange={handleDistrictChange}
                    isDisabled={!selectedProvinceCode}
                    isLoading={isLoadingDistricts}
                    noOptionsMessage={() => 'Không có dữ liệu'}
                    classNamePrefix="register-select"
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="ward">Xã/Phường *</label>
                  <Select
                    inputId="ward"
                    isClearable
                    isSearchable
                    placeholder={
                      !selectedDistrictCode
                        ? 'Vui lòng chọn Quận/Huyện trước'
                        : '-- Chọn Xã/Phường --'
                    }
                    options={wards.map((w) => ({ value: w.code, label: w.name }))}
                    value={
                      selectedWardCode
                        ? {
                            value: selectedWardCode,
                            label: selectedWardName,
                          }
                        : null
                    }
                    onChange={handleWardChange}
                    isDisabled={!selectedDistrictCode}
                    isLoading={isLoadingWards}
                    noOptionsMessage={() => 'Không có dữ liệu'}
                    classNamePrefix="register-select"
                  />
                </div>
              </div>
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="addressDetail">Số nhà, đường, ...</label>
                  <input
                    type="text"
                    id="addressDetail"
                    placeholder="vd: 123 Đường ABC, Khu phố 1"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="register-button" disabled={isLoading}>
              {isLoading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
          </form>

        {/* Login Link */}
        <div className="login-link">
          <span>Đã có tài khoản? </span>
          <Link to="/login">Đăng nhập</Link>
        </div>
        <div className="home-link">
          <Link to="/">Quay lại trang chủ</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
