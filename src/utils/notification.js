import React from 'react';
import { notification } from 'antd';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

const showNotification = (type, message, description = null, duration = 4.5) => {
  const config = {
    message,
    description,
    duration,
    placement: 'topRight',
    style: {
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  };

  switch (type) {
    case 'success':
      notification.success({
        ...config,
        icon: React.createElement(CheckCircle2, { size: 20, style: { color: '#10b981' } }),
        style: {
          ...config.style,
          borderLeft: '4px solid #10b981',
        },
      });
      break;
    case 'error':
      notification.error({
        ...config,
        icon: React.createElement(XCircle, { size: 20, style: { color: '#ef4444' } }),
        style: {
          ...config.style,
          borderLeft: '4px solid #ef4444',
        },
      });
      break;
    case 'warning':
      notification.warning({
        ...config,
        icon: React.createElement(AlertCircle, { size: 20, style: { color: '#f59e0b' } }),
        style: {
          ...config.style,
          borderLeft: '4px solid #f59e0b',
        },
      });
      break;
    case 'info':
      notification.info({
        ...config,
        icon: React.createElement(Info, { size: 20, style: { color: '#3b82f6' } }),
        style: {
          ...config.style,
          borderLeft: '4px solid #3b82f6',
        },
      });
      break;
    default:
      notification.open(config);
  }
};

export const notify = {
  success: (message, description) => showNotification('success', message, description),
  error: (message, description) => showNotification('error', message, description),
  warning: (message, description) => showNotification('warning', message, description),
  info: (message, description) => showNotification('info', message, description),
};
