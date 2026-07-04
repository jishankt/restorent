import React, { useState, useEffect, useContext } from 'react';
import { Bell, Info, CheckCircle, AlertTriangle, Clock, ArrowLeft, User, MapPin } from 'lucide-react';
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../../Context/UserContext';
import './NotificationPage.css';

const NotificationPage = () => {
    const navigate = useNavigate();
    const { user, baseUrl } = useContext(UserContext);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissions, setPermissions] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleting, setDeleting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const safeBaseUrl = baseUrl || '';
            const notifUrl = `${safeBaseUrl}/api/notifications`;
            const notifRes = await axios.get(notifUrl);
            const allNotifs = notifRes.data || [];

            const userObj = user || JSON.parse(localStorage.getItem('user'));
            const currentUserId = String(userObj?.id || userObj?._id);

            if (userObj && userObj.role) {
                const permUrl = `${safeBaseUrl}/api/role-permissions?role=${encodeURIComponent(userObj.role)}`;
                const permRes = await axios.get(permUrl);
                const perms = permRes.data.permissions || [];

                const isAdmin = userObj.role?.toLowerCase().includes('admin') || userObj.is_test;
                const userEmpId = String(userObj.employeeId || userObj.employeeIdCode || userObj.id);

                const notifPerm = perms.find(p => p.pageId === 'notifications') || { canRead: true, canDelete: isAdmin };
                // Admin always gets full access
                if (isAdmin) {
                    notifPerm.canRead = true;
                    notifPerm.canDelete = true;
                }

                const leaveNotifPerm = perms.find(p => p.pageId === 'leave_apply_notif');
                const scheduleNotifPerm = perms.find(p => p.pageId === 'schedule_assign_notif');

                setPermissions(notifPerm);

                const filtered = allNotifs.filter(n => {
                    // Hide if deleted by this user
                    if (n.deleted_by && n.deleted_by.includes(currentUserId)) return false;

                    if (isAdmin) return true;

                    // Always show notifications explicitly assigned to this user
                    if (String(n.employeeId) === userEmpId || String(n.userId) === String(userObj.id)) {
                        return true;
                    }

                    const category = n.category || 'general';
                    if (category === 'leave') {
                        if (!leaveNotifPerm || !leaveNotifPerm.canRead) return false;
                        if (leaveNotifPerm.dataAccess === 'OWN') return false;
                        return true;
                    }
                    if (category === 'schedule') {
                        if (!scheduleNotifPerm || !scheduleNotifPerm.canRead) return false;
                        if (scheduleNotifPerm.dataAccess === 'OWN') return false;
                        return true;
                    }
                    return true;
                });

                setNotifications(filtered);

                // Mark visible as read
                const unreadIds = filtered.filter(n => !n.read_by || !n.read_by.includes(currentUserId)).map(n => n._id);
                if (unreadIds.length > 0) {
                    try {
                        await axios.put(`${safeBaseUrl}/api/notifications/read`, {
                            ids: unreadIds,
                            userId: currentUserId
                        });
                        window.dispatchEvent(new Event('notificationUpdate'));
                    } catch (readErr) {
                        console.error("Failed to mark as read:", readErr);
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user, baseUrl]);

    const handleToggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === notifications.length && notifications.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(notifications.map(n => n._id));
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`Delete ${selectedIds.length} notification(s)?`)) return;

        try {
            setDeleting(true);
            const userObj = user || JSON.parse(localStorage.getItem('user'));
            const currentUserId = String(userObj?.id || userObj?._id);
            const safeBaseUrl = baseUrl || '';

            await Promise.all(selectedIds.map(id =>
                axios.delete(`${safeBaseUrl}/api/notifications?id=${id}&userId=${currentUserId}`)
            ));

            setSelectedIds([]);
            await fetchData();
            window.dispatchEvent(new Event('notificationUpdate'));
        } catch (err) {
            console.error("Error deleting notifications:", err);
            alert("Failed to delete notifications");
        } finally {
            setDeleting(false);
        }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        if (!window.confirm("Clear all your notifications?")) return;

        try {
            setDeleting(true);
            const userObj = user || JSON.parse(localStorage.getItem('user'));
            const currentUserId = String(userObj?.id || userObj?._id);
            const safeBaseUrl = baseUrl || '';

            await axios.delete(`${safeBaseUrl}/api/notifications?all=true&userId=${currentUserId}`);

            setSelectedIds([]);
            await fetchData();
            window.dispatchEvent(new Event('notificationUpdate'));
        } catch (err) {
            console.error("Error clearing notifications:", err);
            alert("Failed to clear notifications");
        } finally {
            setDeleting(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'warning': return <AlertTriangle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="notification-page-container">
                <div className="empty-notifications">
                    <Clock className="empty-icon animate-pulse" />
                    <p>Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="notification-page-wrapper">
            {/* Fixed Back Button - Styled like CustomerListPage */}
            <button
                className="fixed-back-btn"
                onClick={() => navigate(-1)}
            >
                <FaArrowLeft /> <span>Back</span>
            </button>

            <div className="notification-page-container">
                <div className="notification-card">
                    <div className="notification-top-bar">
                        {permissions?.canDelete && notifications.length > 0 && (
                            <div className="action-buttons">
                                {selectedIds.length > 0 && (
                                    <button className="delete-selected-btn" onClick={handleDeleteSelected} disabled={deleting}>
                                        <Bell size={16} /> Delete Selected ({selectedIds.length})
                                    </button>
                                )}
                                <button className="clear-all-btn" onClick={handleClearAll} disabled={deleting}>
                                    <Bell size={16} /> Clear All
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="notification-header">
                        <div className="title-section">
                            <h1>Notifications</h1>
                            <p className="subtitle">Stay updated with your latest alerts and activities</p>
                        </div>
                        {permissions?.canDelete && notifications.length > 0 && (
                            <div className="selection-control">
                                <label className="select-all-label">
                                    <input
                                        type="checkbox"
                                        checked={notifications.length > 0 && selectedIds.length === notifications.length}
                                        onChange={handleSelectAll}
                                    />
                                    <span>Select All</span>
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="notification-list">
                        {notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${notification.type} ${selectedIds.includes(notification._id) ? 'selected' : ''}`}
                                    onClick={() => permissions?.canDelete && handleToggleSelect(notification._id)}
                                    style={{ cursor: permissions?.canDelete ? 'pointer' : 'default' }}
                                >
                                    {permissions?.canDelete && (
                                        <div className="item-checkbox" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(notification._id)}
                                                onChange={() => handleToggleSelect(notification._id)}
                                            />
                                        </div>
                                    )}
                                    <div className="notif-icon-wrapper">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="notif-content">
                                        <div className="notif-title-row">
                                            <h3>{notification.title}</h3>
                                            <span className="notif-category">{notification.category?.toUpperCase()}</span>
                                        </div>
                                        <p>{notification.message}</p>

                                        {notification.category === 'schedule' && notification.data && (
                                            <div className="notif-details-sub">
                                                {notification.data.timing && (
                                                    <div className="detail-row"><Clock size={12} /> <span>{notification.data.timing}</span></div>
                                                )}
                                                {notification.data.department && notification.data.department !== 'N/A' && (
                                                    <div className="detail-row"><MapPin size={12} /> <span>{notification.data.department}</span></div>
                                                )}
                                                {notification.data.original_employee && (
                                                    <div className="detail-row"><User size={12} /> <span>From: {notification.data.original_employee}</span></div>
                                                )}
                                            </div>
                                        )}

                                        <div className="notif-meta">
                                            <span className="notif-time">
                                                <Clock size={14} /> {formatTime(notification.created_at)}
                                            </span>
                                            {notification.employeeId && (
                                                <span className="notif-emp">
                                                    <User size={14} /> ID: {notification.employeeId}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-notifications">
                                <Bell className="empty-icon" />
                                <p>No new notifications at the moment.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationPage;
