"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Bell, X, MessageSquare, ThumbsUp, BookOpen, UserPlus, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: string;
  actor_id: string;
  type: "reply" | "upvote" | "citation" | "follow";
  target_id: string;
  target_type: string | null;
  is_read: boolean;
  created_at: string;
  metadata: any;
  actor_name: string | null;
  actor_username: string | null;
  actor_avatar: string | null;
}

interface GroupedNotification {
  type: string;
  count: number;
  latest: Notification;
  items: Notification[];
}

export default function NotificationCenter() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is loaded and logged in
    if (isLoaded && user) {
      fetchNotifications();

      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        if (user) {
          fetchNotifications();
        }
      }, 30000);
      return () => clearInterval(interval);
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [isLoaded, user]);

  const fetchNotifications = async () => {
    // Double-check user is logged in before fetching
    if (!isLoaded || !user) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/notifications');

      if (!response.ok) {
        console.error("Error fetching notifications:", response.statusText);
        setLoading(false);
        return;
      }

      const data = await response.json();

      const formattedNotifications = (data.notifications || []).map((n: any) => ({
        id: n.id,
        actor_id: n.actor_id,
        type: n.type,
        target_id: n.target_id,
        target_type: n.target_type,
        is_read: n.is_read,
        created_at: n.created_at,
        metadata: n.metadata || {},
        actor_name: n.actor_name || null,
        actor_username: n.actor_username || null,
        actor_avatar: n.actor_avatar || null,
      }));

      setNotifications(formattedNotifications);
      setUnreadCount(formattedNotifications.filter((n) => !n.is_read).length);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationUrl = (notification: Notification): string => {
    switch (notification.type) {
      case "reply":
        // Use discussion_id from metadata if available
        const discussionId = notification.metadata?.discussion_id || notification.target_id;
        // For now, we'll need to fetch the slug client-side or store it in metadata
        // This is a simplified version - can be enhanced to fetch slug
        return `/discussions/${discussionId}#comment-${notification.target_id}`;
      case "upvote":
        if (notification.target_type === "discussion") {
          return `/discussions/${notification.target_id}`;
        }
        return "#";
      case "citation":
        return "/resources";
      case "follow":
        if (notification.actor_username) {
          return `/u/${notification.actor_username}`;
        }
        return "#";
      default:
        return "#";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reply":
        return <MessageSquare size={14} className="text-third-eye-indigo" />;
      case "upvote":
        return <ThumbsUp size={14} className="text-heart-green" />;
      case "citation":
        return <BookOpen size={14} className="text-bone-white/70" />;
      case "follow":
        return <UserPlus size={14} className="text-sme-gold" />;
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification): string => {
    const actor = notification.actor_name || "Someone";

    switch (notification.type) {
      case "reply":
        return `${actor} replied to your comment`;
      case "upvote":
        const count = notification.metadata?.count || 1;
        if (count > 1) {
          return `${count} people upvoted your ${notification.target_type}`;
        }
        return `${actor} upvoted your ${notification.target_type}`;
      case "citation":
        return `${actor} cited your evidence`;
      case "follow":
        return `${actor} started tracking your intelligence`;
      default:
        return "New notification";
    }
  };

  // Group upvotes together
  const groupNotifications = (notifications: Notification[]): (Notification | GroupedNotification)[] => {
    const grouped: Map<string, Notification[]> = new Map();
    const result: (Notification | GroupedNotification)[] = [];

    notifications.forEach((notification) => {
      if (notification.type === "upvote" && notification.target_type) {
        const key = `${notification.target_type}-${notification.target_id}`;
        if (!grouped.has(key)) {
          grouped.set(key, []);
        }
        grouped.get(key)!.push(notification);
      } else {
        result.push(notification);
      }
    });

    // Add grouped upvotes
    grouped.forEach((items, key) => {
      if (items.length > 1) {
        result.push({
          type: "upvote",
          count: items.length,
          latest: items[0],
          items: items,
        });
      } else {
        result.push(items[0]);
      }
    });

    // Sort by created_at
    return result.sort((a, b) => {
      const aTime = "latest" in a ? a.latest.created_at : a.created_at;
      const bTime = "latest" in b ? b.latest.created_at : b.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  };

  const groupedNotifications = groupNotifications(notifications);

  if (!isLoaded || !user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-bone-white/70 hover:text-bone-white transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <>
            {/* Signal Glow - SME Gold */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-sme-gold opacity-20 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sme-gold" />
            </span>
            {/* Badge Count */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-sme-gold text-[10px] font-bold text-forest-obsidian font-mono">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </>
        )}
      </button>

      {/* Side Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-forest-obsidian/80"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed right-0 top-0 z-50 h-full w-96 border-l border-translucent-emerald bg-muted-moss shadow-xl">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-translucent-emerald p-4">
                <h2 className="font-serif text-lg font-semibold text-bone-white">Notifications</h2>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-bone-white/70 hover:text-bone-white font-mono uppercase tracking-wider"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-bone-white/70 hover:text-bone-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-xs text-bone-white/70 font-mono">Loading...</div>
                  </div>
                ) : groupedNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Bell size={32} className="mb-4 text-bone-white/30" />
                    <p className="text-xs text-bone-white/70 font-mono">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-translucent-emerald">
                    {groupedNotifications.map((item) => {
                      const notification = "latest" in item ? item.latest : item;
                      const isGrouped = "count" in item;
                      const isUnread = !notification.is_read;

                      return (
                        <Link
                          key={notification.id}
                          href={getNotificationUrl(notification)}
                          onClick={() => {
                            if (isUnread) {
                              if (isGrouped) {
                                // Mark all grouped notifications as read
                                item.items.forEach((n) => markAsRead(n.id));
                              } else {
                                markAsRead(notification.id);
                              }
                            }
                            setIsOpen(false);
                          }}
                          className={`block border-l-2 p-3 transition-colors ${isUnread
                            ? "border-sme-gold bg-forest-obsidian/50"
                            : "border-transparent bg-muted-moss"
                            } hover:bg-forest-obsidian`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="mb-1 flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-bone-white/50">
                                  [{notification.type.toUpperCase()}]
                                </span>
                                {isGrouped && (
                                  <span className="text-[10px] font-mono text-bone-white/50">
                                    {item.count} total
                                  </span>
                                )}
                              </div>
                              <p className="mb-1 text-sm text-bone-white font-mono">
                                {getNotificationText(notification)}
                              </p>
                              <div className="flex items-center gap-2">
                                {notification.actor_avatar && (
                                  <img
                                    src={notification.actor_avatar}
                                    alt={notification.actor_name || ""}
                                    className="h-4 w-4 rounded-full"
                                  />
                                )}
                                <span className="text-[10px] text-bone-white/50 font-mono">
                                  {formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-bone-white/30 flex-shrink-0 mt-1" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}



