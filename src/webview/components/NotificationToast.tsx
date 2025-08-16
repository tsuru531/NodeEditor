import React, { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationToastProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onRemove }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {notifications.map(notification => (
        <ToastItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

interface ToastItemProps {
  notification: Notification;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // アニメーション開始
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 自動削除
    const duration = notification.duration || 5000;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(notification.id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [notification.id, notification.duration, onRemove]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success': return '#4CAF50';
      case 'error': return '#f44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
    }
  };

  return (
    <div
      style={{
        background: getBackgroundColor(),
        color: 'white',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        minWidth: '300px',
        maxWidth: '400px',
        transform: `translateX(${isVisible ? '0' : '100%'})`,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px'
      }}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onRemove(notification.id), 300);
      }}
    >
      <span style={{ fontSize: '16px', flexShrink: 0 }}>
        {getIcon()}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
          {notification.title}
        </div>
        {notification.message && (
          <div style={{ fontSize: '12px', opacity: 0.9 }}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};