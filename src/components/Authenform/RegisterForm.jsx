import React, { useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { User, Mail, Lock, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Form, Input, Button } from 'antd';
import { register as registerApi } from '../../api/userApi';

const REQUIRED_MSG = 'Không được để trống';

// Họ và tên: chỉ chữ cái và dấu cách (có dấu tiếng Việt)
const FULLNAME_REGEX = /^[a-zA-ZÀ-ỹĂ-ơƯ-ư\s]+$/;
// Username: chữ, số, gạch dưới, từ 6 ký tự
const USERNAME_REGEX = /^[a-zA-Z0-9_]{6,}$/;

export const RegisterForm = ({ isActive, onRegisterSuccess }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values) => {
    setIsLoading(true);

    try {
      const payload = {
        username: values.username.trim(),
        password: values.password,
        email: values.email.trim(),
        name: values.fullName.trim(),
      };

      await registerApi(payload);
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      if (typeof onRegisterSuccess === 'function') {
        onRegisterSuccess();
      } else {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      console.error('Register error:', error);
      let errorMessage = 'Đăng ký thất bại. Vui lòng thử lại.';

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage =
          'Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối hoặc đảm bảo backend đang chạy.';
      } else if (error.response) {
        const status = error.response.status;
        const dataError = (error.response.data?.error || error.response.data?.message || '').toLowerCase();
        if (status === 400 || dataError.includes('invalid') || dataError.includes('validation')) {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            'Dữ liệu không hợp lệ. Kiểm tra lại thông tin (email hoặc tên đăng nhập có thể đã được sử dụng).';
        } else if (status === 409 || dataError.includes('exist') || dataError.includes('already') || dataError.includes('duplicate')) {
          errorMessage = 'Email hoặc tên đăng nhập đã tồn tại. Vui lòng dùng thông tin khác.';
        } else if (status >= 500) {
          errorMessage = 'Lỗi hệ thống. Vui lòng thử lại sau.';
        } else {
          errorMessage =
            error.response.data?.message ||
            error.response.data?.error ||
            'Đăng ký thất bại. Vui lòng thử lại.';
        }
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
    <Motion.div
      className="auth-form-container auth-form-container--register"
      initial={false}
      animate={{
        x: isActive ? 0 : 50,
        opacity: isActive ? 1 : 0,
        zIndex: isActive ? 10 : 0,
      }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      <div className="auth-form-container__content">
        <div className="auth-header-icon" aria-hidden>
          <BookOpen size={32} strokeWidth={1.5} />
        </div>
        <Motion.h2
          className="auth-title"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: isActive ? 0 : 20, opacity: isActive ? 1 : 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          Tạo tài khoản
        </Motion.h2>
        <p className="auth-subtitle" style={{ margin: '5px 0 10px 0' }}>
          Hãy đăng ký để đến với website học tiếng Nhật
        </p>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          className="auth-form-antd"
          size="large"
        >
          <Form.Item
            name="fullName"
            label={null}
            rules={[
              { required: true, message: REQUIRED_MSG },
              {
                pattern: FULLNAME_REGEX,
                message: 'Họ và tên không được chứa ký tự đặc biệt hoặc số.',
              },
            ]}
          >
            <Input
              placeholder="Họ và tên"
              prefix={<User size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="username"
            label={null}
            rules={[
              { required: true, message: REQUIRED_MSG },
              {
                min: 6,
                message: 'Tên đăng nhập phải từ 6 ký tự trở lên.',
              },
              {
                pattern: USERNAME_REGEX,
                message: 'Tên đăng nhập chỉ được dùng chữ cái, số và dấu gạch dưới, tối thiểu 6 ký tự.',
              },
            ]}
          >
            <Input
              placeholder="Tên đăng nhập"
              prefix={<User size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={null}
            rules={[
              { required: true, message: REQUIRED_MSG },
              { type: 'email', message: 'Email không hợp lệ.' },
            ]}
          >
            <Input
              type="email"
              placeholder="you@gmail.com"
              prefix={<Mail size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
              allowClear
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={null}
            rules={[
              { required: true, message: REQUIRED_MSG },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' },
            ]}
          >
            <Input.Password
              placeholder="Mật khẩu"
              prefix={<Lock size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={null}
            dependencies={['password']}
            rules={[
              { required: true, message: REQUIRED_MSG },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp.'));
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Xác nhận mật khẩu"
              prefix={<Lock size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate>
            {() => (
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="auth-btn auth-btn--register"
                block
              >
                {isLoading ? 'Đang đăng ký...' : 'Đăng Ký'}
              </Button>
            )}
          </Form.Item>
        </Form>
      </div>
    </Motion.div>
  );
};
