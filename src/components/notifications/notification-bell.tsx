'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  DollarSign,
  Tag,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  metadata: Record<string, any> | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'MESSAGE':
      return MessageSquare;
    case 'OFFER_RECEIVED':
    case 'OFFER_ACCEPTED':
    case 'OFFER_REJECTED':
      return DollarSign;
    case 'LISTING_APPROVED':
    case 'LISTING_REJECTED':
      return Tag;
    case 'EVENT_REMINDER':
      return Calendar;
    case 'MEMBERSHIP_EXPIRING':
    case 'ADMIN_ANNOUNCEMENT':
    case 'SYSTEM':
    default:
      return Bell;
  }
};

const getNotificationIconColor = (type: string) => {
  switch (type) {
    case 'MESSAGE':
      return 'text-blue-400';
    case 'OFFER_RECEIVED':
      return 'text-green-400';
    case 'OFFER_ACCEPTED':
      return 'text-emerald-400';
    case 'OFFER_REJECTED':
      return 'text-red-400';
    case 'LISTING_APPROVED':
      return 'text-green-400';
    case 'LISTING_REJECTED':
      return 'text-red-400';
    case 'EVENT_REMINDER':
      return 'text-purple-400';
    case 'MEMBERSHIP_EXPIRING':
      return 'text-yellow-400';
    case 'ADMIN_ANNOUNCEMENT':
      return 'text-indigo-400';
    case 'SYSTEM':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch recent notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?page=1&limit=10');
      if (response.ok) {
        const data: NotificationsResponse = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string, link: string | null) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Navigate to link if provided
      if (link) {
        router.push(link);
      }

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const iconColor = getNotificationIconColor(notification.type);

                  return (
                    <button
                      key={notification.id}
                      onClick={() => markAsRead(notification.id, notification.link)}
                      className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${
                        !notification.isRead ? 'border-l-2 border-indigo-500 bg-white/[0.02]' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex-shrink-0 ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm mb-1 ${
                              !notification.isRead
                                ? 'font-semibold text-foreground'
                                : 'font-medium text-muted-foreground'
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mb-2">
                            {truncateText(notification.body, 100)}
                          </p>
                          <p className="text-[10px] text-muted-foreground/70">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10 bg-slate-800/50">
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push('/notifications');
                }}
                className="w-full text-center text-sm text-primary hover:text-primary/80 transition-colors font-medium"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
