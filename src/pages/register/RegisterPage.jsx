import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register } from '../../api/userApi';
import { getAllProvinces, getWardsByProvince } from '../../api/addressApi';
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
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);
  const navigate = useNavigate();

  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const data = await getAllProvinces();
        console.log('Provinces data received:', data);
        console.log('Number of provinces:', data?.length);
        console.log('Type of data:', typeof data);
        console.log('Is array?', Array.isArray(data));
        
        if (data && Array.isArray(data) && data.length > 0) {
          console.log('Setting provinces:', data);
          setProvinces(data);
          console.log('Provinces state should be updated');
        } else {
          console.warn('No provinces data received or invalid format');
          console.warn('Data:', data);
          setProvinces([]);
          toast.error('Không có dữ liệu tỉnh/thành phố');
        }
      } catch (error) {
        console.error('Error loading provinces:', error);
        setProvinces([]);
        let errorMessage = 'Không thể tải danh sách tỉnh/thành phố';
        
        if (error.message?.includes('timeout') || error.code === 'ECONNABORTED') {
          errorMessage = 'API timeout: Server không phản hồi. Vui lòng thử lại sau.';
        } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          errorMessage = 'Không thể kết nối đến API. Vui lòng kiểm tra kết nối internet.';
        } else if (error.response) {
          errorMessage = `Lỗi API: ${error.response.status} - ${error.response.statusText}`;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  // Fetch wards when province is selected
  useEffect(() => {
    if (selectedProvinceId) {
      const fetchWards = async () => {
        setIsLoadingWards(true);
        setWards([]);
        setSelectedWard('');
        try {
          const data = await getWardsByProvince(selectedProvinceId);
          setWards(data);
        } catch (error) {
          console.error('Error loading wards:', error);
          toast.error('Không thể tải danh sách xã/phường');
        } finally {
          setIsLoadingWards(false);
        }
      };
      fetchWards();
    } else {
      setWards([]);
      setSelectedWard('');
    }
  }, [selectedProvinceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProvinceChange = (e) => {
    const provinceName = e.target.value;
    setSelectedProvince(provinceName);
    
    // Find province ID from provinces list
    const selectedProv = provinces.find(p => 
      (p.name || p.provinceName || p.province) === provinceName
    );
    if (selectedProv) {
      setSelectedProvinceId(selectedProv.id || selectedProv.provinceCode || selectedProv.code || '');
    } else {
      setSelectedProvinceId('');
    }
  };

  const handleWardChange = (e) => {
    setSelectedWard(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      // Combine address: số nhà, đường + xã/phường + tỉnh/thành phố
      let fullAddress = '';
      if (addressDetail) {
        fullAddress = addressDetail;
      }
      if (selectedWard) {
        fullAddress = fullAddress ? `${fullAddress}, ${selectedWard}` : selectedWard;
      }
      if (selectedProvince) {
        fullAddress = fullAddress ? `${fullAddress}, ${selectedProvince}` : selectedProvince;
      }

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

  // Debug: Log provinces state whenever it changes
  useEffect(() => {
    console.log('Provinces state updated:', provinces);
    console.log('Provinces length:', provinces?.length);
  }, [provinces]);

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

          {/* Register Form */}
          <form className="register-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="username">Tên người dùng *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Nhập tên người dùng"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Nhập email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group password-group">
                  <label htmlFor="password">Mật khẩu *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      placeholder="Nhập mật khẩu"
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

                <div className="form-group">
                  <label htmlFor="province">Tỉnh/Thành phố</label>
                  <select
                    id="province"
                    name="province"
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    disabled={isLoadingProvinces}
                    style={{ minHeight: '44px' }}
                  >
                    <option value="">-- Chọn tỉnh/thành phố --</option>
                    {provinces && provinces.length > 0 ? (
                      provinces.map((province, index) => {
                        // Handle different API response formats
                        const provinceName = province.name || province.provinceName || province.province || province;
                        const provinceId = province.id || province.provinceCode || province.code || index;
                        console.log(`Rendering option ${index}:`, provinceName, provinceId);
                        return (
                          <option key={provinceId} value={provinceName}>
                            {provinceName}
                          </option>
                        );
                      })
                    ) : (
                      !isLoadingProvinces && <option value="" disabled>Không có dữ liệu</option>
                    )}
                  </select>
                  {isLoadingProvinces && <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '8px' }}>Đang tải...</span>}
                  {!isLoadingProvinces && provinces.length === 0 && (
                    <span style={{ fontSize: '12px', color: '#EF4444', marginLeft: '8px' }}>Không có dữ liệu ({provinces.length} tỉnh)</span>
                  )}
                  {!isLoadingProvinces && provinces.length > 0 && (
                    <span style={{ fontSize: '12px', color: '#10B981', marginLeft: '8px' }}>({provinces.length} tỉnh có sẵn)</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="ward">Xã/Phường</label>
                  <select
                    id="ward"
                    value={selectedWard}
                    onChange={handleWardChange}
                    disabled={!selectedProvince || isLoadingWards}
                  >
                    <option value="">-- Chọn xã/phường --</option>
                    {wards.map((ward, index) => (
                      <option key={index} value={ward.name}>
                        {ward.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="name">Họ và tên *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Nhập họ và tên"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group password-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      placeholder="Nhập lại mật khẩu"
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

                <div className="form-group">
                  <label htmlFor="addressDetail">Số nhà, đường, ...</label>
                  <input
                    type="text"
                    id="addressDetail"
                    placeholder="Nhập số nhà, tên đường, ..."
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
