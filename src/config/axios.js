import axios from 'axios';
import { toast } from 'react-toastify';

const apiClient = axios.create({
  baseURL: import.meta.env.DEV ? '/api/v1' : 'https://online-learning-l700.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
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

// Response interceptor: log lỗi ra console (không tự hiện toast thành công; từng màn hình tự gọi toast nếu cần)
apiClient.interceptors.response.use(
  (response) => response,
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
      // Không toast khi 404 "course chưa có module" – frontend coi là danh sách rỗng
      const isModulesByCourse404 =
        error.response?.status === 404 &&
        error.config?.url != null &&
        /\/?modules\/course\/\d+$/.test(String(error.config.url || '').replace(/^\//, ''));
      if (!isModulesByCourse404) {
        const text =
          error.response?.data?.message ||
          (error.code === 'ECONNABORTED' ? 'Kết nối quá thời gian. Vui lòng thử lại.' : null);
        if (text) toast.error(text);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
