import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Form, Input, Button } from 'antd';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../api/userApi';
import './VerifyOtpPage.css';

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [isResending, setIsResending] = useState(false);
  const email = location.state?.email ?? '';

  useEffect(() => {
    if (!email || typeof email !== 'string' || !email.trim()) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const onFinish = (values) => {
    const code = String(values.code ?? '').trim();
    if (code.length !== 6) return;
    navigate('/forgot-password/reset', { state: { email: email.trim(), code } });
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await forgotPassword(email);
      toast.success('Mã mới đã được gửi đến email của bạn.');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Không thể gửi lại mã. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setIsResending(false);
    }
  };

  if (!email || !email.trim()) {
    return null;
  }

  return (
    <div className="sakura-auth-page verify-otp-page">
      <div className="verify-otp-shell">
        <div className="verify-otp-card">
          <Link to="/forgot-password" className="verify-otp-back">
            <ArrowLeft size={18} />
            <span>Quay lại</span>
          </Link>
          <h1 className="verify-otp-title">Nhập mã xác thực</h1>
          <p className="verify-otp-subtitle">
            Mã 6 chữ số đã được gửi đến <strong>{email}</strong>. Mã có hiệu lực 10 phút.
          </p>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            validateTrigger={['onSubmit', 'onChange', 'onBlur']}
            className="verify-otp-form"
          >
            <Form.Item
              name="code"
              label="Mã khôi phục"
              rules={[
                { required: true, message: 'Vui lòng nhập mã 6 chữ số.' },
                { len: 6, message: 'Mã phải đúng 6 chữ số.' },
                { pattern: /^[0-9]+$/, message: 'Mã chỉ gồm 6 chữ số.' },
              ]}
            >
              <Input
                prefix={<KeyRound size={18} style={{ color: 'rgba(0,0,0,0.25)' }} />}
                placeholder="000000"
                maxLength={6}
                autoComplete="one-time-code"
                size="large"
                className="verify-otp-input"
              />
            </Form.Item>
            <Form.Item className="verify-otp-actions">
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                className="verify-otp-submit"
              >
                Xác nhận
              </Button>
              <Button
                type="default"
                block
                size="large"
                onClick={handleResend}
                loading={isResending}
                className="verify-otp-resend"
              >
                Gửi lại mã
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
