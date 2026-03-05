import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Clock, User } from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { formatDistanceToNow, format } from 'date-fns';

const GRAD_COLORS = [
    'from-primary-500 to-violet-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-600',
];

export default function AnnouncementsPage() {
    const { userProfile } = useAuth();
    const [announcements, setAnnouncements] = useState([]);

    const className = userProfile?.className;

    useEffect(() => {
        // Get all announcements — filter client-side for: campus-wide (no className) OR matching student's class
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => {
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Show campus-wide announcements + announcements for this student's class
            const filtered = all.filter(a => !a.className || a.className === className);
            setAnnouncements(filtered);
        });
    }, [className]);

    function fmtDate(ts) {
        if (!ts) return '';
        try {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            return format(d, 'dd MMM yyyy, hh:mm a');
        } catch { return ''; }
    }
    function fmtRel(ts) {
        if (!ts) return '';
        try {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            return formatDistanceToNow(d, { addSuffix: true });
        } catch { return ''; }
    }

    return (
        <DashboardLayout title="Announcements">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <h2 className="page-title">Campus Announcements</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Showing campus-wide + class <span className="font-semibold text-gray-700 dark:text-gray-300">{className || '—'}</span> announcements
                    </p>
                </div>

                {announcements.length === 0 ? (
                    <div className="card text-center py-16">
                        <Megaphone className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-400">No announcements yet</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((a, i) => (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                                className="card border-0 overflow-hidden"
                            >
                                <div className={`h-1.5 w-full bg-gradient-to-r ${GRAD_COLORS[i % GRAD_COLORS.length]} -mt-6 -mx-6 mb-4 rounded-t-2xl`} />
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${GRAD_COLORS[i % GRAD_COLORS.length]} flex items-center justify-center flex-shrink-0`}>
                                        <Megaphone className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                                            {a.className ? (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                                                    {a.className}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                                                    Campus-wide
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{a.body}</p>

                                        {/* Full timestamp row */}
                                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <User className="w-3 h-3" />
                                                <span className="font-medium text-gray-600 dark:text-gray-400">{a.createdBy}</span>
                                                {a.postedByRole && (
                                                    <span className="capitalize text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 ml-1">
                                                        {a.postedByRole === 'classTeacher' ? 'Teacher' : a.postedByRole}
                                                    </span>
                                                )}
                                            </div>
                                            {a.createdAt && (
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span className="font-medium">{fmtDate(a.createdAt)}</span>
                                                    <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                                                    <span className="italic">{fmtRel(a.createdAt)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
