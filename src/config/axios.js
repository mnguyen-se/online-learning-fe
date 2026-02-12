import axios from 'axios';
import { toast } from 'react-toastify';

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

// Chỉ hiển thị toast thành công cho method thay đổi dữ liệu (tránh spam khi GET)
const MUTATING_METHODS = ['post', 'put', 'patch', 'delete'];

// Response interceptor: thông báo thành công tiếng Việt, log lỗi ra console
apiClient.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || '').toLowerCase();
    const skipSuccessToast = response.config?.skipSuccessToast === true;
    if (
      !skipSuccessToast &&
      MUTATING_METHODS.includes(method)
    ) {
      toast.success('Thao tác thành công.');
    }
    return response;
  },
  (error) => {
    // Log lỗi ra console (tiếng Việt + chi tiết)
    const url = error.config?.url ?? '(không rõ URL)';
    const method = (error.config?.method ?? 'GET').toUpperCase();
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message;

    console.error('[API Lỗi]', {
      message: 'Gọi API thất bại.',
      url: `${method} ${url}`,
      status,
      chiTiet: message,
      responseData: error.response?.data,
      error,
    });

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
    } else if (error.config?.skipErrorToast !== true) {
      // Thông báo lỗi tiếng Việt (trừ khi component tự xử lý)
      const text =
        error.response?.data?.message ||
        (error.code === 'ECONNABORTED' ? 'Kết nối quá thời gian. Vui lòng thử lại.' : 'Đã xảy ra lỗi. Vui lòng thử lại.');
      toast.error(text);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
