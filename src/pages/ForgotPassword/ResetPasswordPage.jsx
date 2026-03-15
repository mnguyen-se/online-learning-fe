import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Form, Input, Button } from 'antd';
import { Lock, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../../api/userApi';
import './ResetPasswordPage.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { email, code } = location.state ?? {};

  useEffect(() => {
    const hasEmail = email && typeof email === 'string' && email.trim();
    const hasCode = code != null && String(code).trim().length === 6;
    if (!hasEmail || !hasCode) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, code, navigate]);

  const onFinish = async (values) => {
    setIsSubmitting(true);
    try {
      await resetPassword({
        email: email?.trim?.() ?? email,
        code: String(code ?? '').trim(),
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      toast.success('Đặt lại mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới.');
      navigate('/login', { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasValidState = email?.trim?.() && String(code ?? '').trim().length === 6;
  if (!hasValidState) {
    return null;
  }

  return (
    <div className="sakura-auth-page reset-password-page">
      <div className="reset-password-shell">
        <div className="reset-password-card">
          <Link to="/forgot-password/verify-otp" className="reset-password-back" state={{ email }}>
            <ArrowLeft size={18} />
            <span>Quay lại nhập mã</span>
          </Link>
          <h1 className="reset-password-title">Đặt lại mật khẩu mới</h1>
          <p className="reset-password-subtitle">
            Nhập mật khẩu mới và xác nhận để hoàn tất.
          </p>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            validateTrigger={['onSubmit', 'onChange', 'onBlur']}
            className="reset-password-form"
          >
            <Form.Item
              name="newPassword"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới.' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự.' },
              ]}
            >
              <Input.Password
                prefix={<Lock size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder="Mật khẩu mới"
                autoComplete="new-password"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu mới"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới.' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<Lock size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder="Xác nhận mật khẩu mới"
                autoComplete="new-password"
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
                className="reset-password-submit"
              >
                Đặt lại mật khẩu
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
