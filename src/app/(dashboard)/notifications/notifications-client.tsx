'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  MessageSquare,
  DollarSign,
  Tag,
  Calendar,
  AlertCircle,
  Check,
  CheckCheck,
  Loader2,
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

type FilterTab = 'all' | 'unread';

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
      return 'text-blue-400 bg-blue-400/10';
    case 'OFFER_RECEIVED':
      return 'text-green-400 bg-green-400/10';
    case 'OFFER_ACCEPTED':
      return 'text-emerald-400 bg-emerald-400/10';
    case 'OFFER_REJECTED':
      return 'text-red-400 bg-red-400/10';
    case 'LISTING_APPROVED':
      return 'text-green-400 bg-green-400/10';
    case 'LISTING_REJECTED':
      return 'text-red-400 bg-red-400/10';
    case 'EVENT_REMINDER':
      return 'text-purple-400 bg-purple-400/10';
    case 'MEMBERSHIP_EXPIRING':
      return 'text-yellow-400 bg-yellow-400/10';
    case 'ADMIN_ANNOUNCEMENT':
      return 'text-indigo-400 bg-indigo-400/10';
    case 'SYSTEM':
      return 'text-gray-400 bg-gray-400/10';
    default:
      return 'text-gray-400 bg-gray-400/10';
  }
};

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const router = useRouter();

  const limit = 20;
  const hasMore = notifications.length < total;

  // Fetch notifications
  const fetchNotifications = async (pageNum: number, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString(),
      });

      if (activeTab === 'unread') {
        params.append('unread', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data: NotificationsResponse = await response.json();

        if (append) {
          setNotifications((prev) => [...prev, ...data.notifications]);
        } else {
          setNotifications(data.notifications);
        }

        setTotal(data.total);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string, link: string | null) => {
    try {
      const notification = notifications.find((n) => n.id === id);
      if (!notification || notification.isRead) {
        // If already read, just navigate
        if (link) {
          router.push(link);
        }
        return;
      }

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
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark single notification as read (button)
  const handleMarkAsRead = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    setMarkingAllRead(true);
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
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Load more notifications
  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage, true);
  };

  // Fetch notifications on mount and when tab changes
  useEffect(() => {
    setPage(1);
    fetchNotifications(1, false);
  }, [activeTab]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Notifications</h1>
        <p className="text-muted-foreground">
          Stay updated with your SPAC activity and announcements
        </p>
      </div>

      {/* Filter Tabs and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-800/50 text-muted-foreground hover:text-foreground hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'bg-slate-800/50 text-muted-foreground hover:text-foreground hover:bg-slate-800'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs font-semibold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAllRead}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800/50 text-primary hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center sm:justify-start"
          >
            {markingAllRead ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Marking all as read...
              </>
            ) : (
              <>
                <CheckCheck className="h-4 w-4" />
                Mark all as read
              </>
            )}
          </button>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-12 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-12 text-center">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-muted-foreground">
            {activeTab === 'unread'
              ? 'You\'re all caught up! Check back later for new updates.'
              : 'When you receive notifications, they\'ll appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColorClasses = getNotificationIconColor(notification.type);

            return (
              <div
                key={notification.id}
                className={`bg-slate-800/50 border border-white/10 rounded-xl p-5 hover:bg-slate-800/70 transition-all cursor-pointer ${
                  !notification.isRead ? 'border-l-4 border-l-indigo-500' : ''
                }`}
                onClick={() => markAsRead(notification.id, notification.link)}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${iconColorClasses}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3
                        className={`text-base ${
                          !notification.isRead
                            ? 'font-bold text-foreground'
                            : 'font-semibold text-muted-foreground'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification.id, e)}
                          className="flex-shrink-0 p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {notification.body}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/70">
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="capitalize">{notification.type.toLowerCase().replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 rounded-lg bg-slate-800/50 border border-white/10 text-foreground hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  <>Load more notifications</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
