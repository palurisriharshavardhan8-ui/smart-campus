import React, { useState, useEffect, useRef } from 'react';
import { Bell, Sun, Moon, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export default function TopBar({ title }) {
    const { theme, toggleTheme } = useTheme();
    const { userProfile, userRole } = useAuth();
    const [showNotifications, setShowNotifications] = useState(false);
    const [announcements, setAnnouncements] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [search, setSearch] = useState('');
    const notifRef = useRef(null);

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(5));
        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAnnouncements(items);
            setUnreadCount(items.length);
        }, () => { });
        return unsub;
    }, []);

    // Close on outside click
    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleBellClick() {
        setShowNotifications(p => !p);
        if (!showNotifications) setUnreadCount(0);
    }

    return (
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
            {/* Left */}
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200 hidden sm:block">{title}</h1>
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-9 py-2 w-56 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/30 placeholder-gray-400 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle theme"
                >
                    <AnimatePresence mode="wait">
                        {theme === 'dark' ? (
                            <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                <Sun className="w-4 h-4 text-amber-400" />
                            </motion.div>
                        ) : (
                            <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                                <Moon className="w-4 h-4 text-gray-600" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={handleBellClick}
                        className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50"
                            >
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">Notifications</p>
                                    <span className="badge badge-pending">{announcements.length} new</span>
                                </div>
                                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-800">
                                    {announcements.length === 0 ? (
                                        <p className="text-center text-sm text-gray-400 py-6">No announcements</p>
                                    ) : (
                                        announcements.map(a => (
                                            <div key={a.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{a.title}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.body}</p>
                                                {a.createdAt && (
                                                    <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                                        {formatDistanceToNow(a.createdAt.toDate?.() || new Date(), { addSuffix: true })}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Avatar */}
                <div className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold">
                        {userProfile?.name?.charAt(0) || '?'}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">{userProfile?.name || 'User'}</p>
                        <p className="text-[10px] text-gray-400 capitalize">{userRole}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}
