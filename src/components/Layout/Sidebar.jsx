import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, MessageSquare, Megaphone, BookOpen,
    Users, ClipboardList, LogOut, GraduationCap,
    ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const studentLinks = [
    { to: '/student', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/student/complaints', icon: MessageSquare, label: 'My Complaints' },
    { to: '/student/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/student/notes', icon: BookOpen, label: 'Notes Hub' },
];

const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/complaints', icon: ClipboardList, label: 'Complaints' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/notes', icon: BookOpen, label: 'Notes' },
    { to: '/admin/students', icon: Users, label: 'Students' },
];

const teacherLinks = [
    { to: '/teacher', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/teacher/complaints', icon: ClipboardList, label: 'Class Complaints' },
    { to: '/teacher/notes', icon: BookOpen, label: 'Class Notes' },
    { to: '/teacher/announcements', icon: Megaphone, label: 'Announcements' },
];

const superAdminLinks = [
    { to: '/superadmin', icon: ShieldCheck, label: 'Overview', end: true },
    { to: '/admin/complaints', icon: ClipboardList, label: 'All Complaints' },
    { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/admin/notes', icon: BookOpen, label: 'Notes' },
    { to: '/admin/students', icon: Users, label: 'Students' },
];

const LINKS_BY_ROLE = {
    student: studentLinks,
    admin: adminLinks,
    classTeacher: teacherLinks,
    superAdmin: superAdminLinks,
};

const ROLE_LABEL = {
    student: 'Student Portal',
    admin: 'Admin Portal',
    classTeacher: 'Teacher Portal',
    superAdmin: 'Head Admin Portal',
};

export default function Sidebar({ role }) {
    const [collapsed, setCollapsed] = useState(false);
    const { logout, userProfile } = useAuth();
    const navigate = useNavigate();

    const links = LINKS_BY_ROLE[role] || studentLinks;

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
            toast.success('Logged out successfully');
        } catch {
            toast.error('Failed to log out');
        }
    }

    return (
        <motion.aside
            animate={{ width: collapsed ? 72 : 240 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-hidden flex-shrink-0"
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800 min-h-[72px]">
                <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-primary-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">SmartCampus</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{ROLE_LABEL[role] || 'Portal'}</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {links.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to} to={to} end={end}
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                    >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="truncate">
                                    {label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </NavLink>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <button
                    onClick={handleLogout}
                    className="sidebar-link w-full text-left hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>

                {userProfile && !collapsed && (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 mt-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {userProfile.name?.charAt(0) || '?'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{userProfile.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{userProfile.email}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="absolute top-5 -right-3 z-10 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center shadow-sm hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
            >
                {collapsed
                    ? <ChevronRight className="w-3 h-3 text-gray-500" />
                    : <ChevronLeft className="w-3 h-3 text-gray-500" />}
            </button>
        </motion.aside>
    );
}
