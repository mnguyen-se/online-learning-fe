import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Form, Input, Button } from 'antd';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../api/userApi';
import './ForgotPasswordPage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      await forgotPassword(values.email);
      navigate('/forgot-password/verify-otp', { state: { email: values.email }, replace: true });
    } catch (err) {
      const status = err.response?.status;
      const rawMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        '';

      // Lỗi máy chủ (5xx) hoặc message kỹ thuật gây hiểu nhầm (vd: "Authentication failed" từ SMTP)
      // → Hiển thị thông báo thân thiện, đúng ngữ cảnh "quên mật khẩu"
      const isServerError = status >= 500;
      const isMisleadingAuthMessage =
        typeof rawMsg === 'string' &&
        rawMsg.toLowerCase().includes('authentication');

      const msg =
        isServerError || isMisleadingAuthMessage
          ? 'Không thể gửi email lúc này. Vui lòng thử lại sau.'
          : rawMsg || 'Không thể gửi link khôi phục. Vui lòng thử lại.';

      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sakura-auth-page forgot-password-page">
      <div className="forgot-password-shell">
        <div className="forgot-password-card">
          <Link to="/login" className="forgot-password-back">
            <ArrowLeft size={18} />
            <span>Quay lại đăng nhập</span>
          </Link>
          <h1 className="forgot-password-title">Quên mật khẩu</h1>
          <p className="forgot-password-subtitle">
            Nhập địa chỉ email đã đăng ký, chúng tôi sẽ gửi link khôi phục mật khẩu.
          </p>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            validateTrigger={['onSubmit', 'onChange', 'onBlur']}
            className="forgot-password-form"
          >
            <Form.Item
              name="email"
              label="Địa chỉ Email"
              rules={[
                { required: true, message: 'Email must be at least 5 characters.' },
                { min: 5, message: 'Email must be at least 5 characters.' },
                { type: 'email', message: 'Invalid email format.' },
              ]}
            >
              <Input
                prefix={<Mail size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isSubmitting}
                block
                size="large"
                className="forgot-password-submit"
              >
                Send reset link
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
