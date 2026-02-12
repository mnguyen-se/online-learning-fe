import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/api/v1' : 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor để thêm token vào header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Không redirect khi 401 từ chính request đăng nhập (sai user/pass) – để form hiển thị lỗi
      const isLoginRequest = error.config?.url?.includes('auth/login');
      if (!isLoginRequest) {
        // Token hết hạn hoặc không hợp lệ khi gọi API khác → đăng xuất và về trang login
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403) {
      // Tài khoản bị vô hiệu hóa hoặc không có quyền truy cập
      const isAuthRequest = error.config?.url?.includes('auth/');
      if (!isAuthRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
