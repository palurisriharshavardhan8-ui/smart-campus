import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BookOpen, Percent, MessageSquare, Megaphone,
    AlertCircle, CheckCircle, Clock, TrendingUp, Plus, ChevronRight,
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatCard from '../../components/StatCard';
import AttendanceChart from '../../components/AttendanceChart';
import ComplaintProgressTracker from '../../components/ComplaintProgressTracker';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// Covers both old and new status names
const STATUS_BADGE = {
    pending: 'badge-pending',
    submitted: 'badge-pending',
    'in-progress': 'badge-inprogress',
    under_review: 'badge-inprogress',
    forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    resolved: 'badge-resolved',
};

function isPending(s) { return s === 'pending' || s === 'submitted'; }
function isActive(s) { return s === 'in-progress' || s === 'under_review' || s === 'forwarded'; }
function isResolved(s) { return s === 'resolved'; }

export default function StudentDashboard() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    /* ── Complaints: filter by studentId client-side to avoid composite index ── */
    useEffect(() => {
        if (!currentUser) return;
        // Simple query on single field — no composite index needed
        const q = query(
            collection(db, 'complaints'),
            where('studentId', '==', currentUser.uid),
        );
        return onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort newest first client-side
            docs.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() ?? 0;
                const tb = b.createdAt?.toMillis?.() ?? 0;
                return tb - ta;
            });
            setComplaints(docs);
        }, err => {
            console.error('Complaints fetch error:', err);
        });
    }, [currentUser]);

    /* ── Announcements ── */
    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(4));
        return onSnapshot(q, snap =>
            setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        );
    }, []);

    const pending = complaints.filter(c => isPending(c.status)).length;
    const resolved = complaints.filter(c => isResolved(c.status)).length;
    const inProgress = complaints.filter(c => isActive(c.status)).length;
    const attendance = userProfile?.attendancePercent || 84;

    const todaySchedule = userProfile?.classSchedule?.filter(
        c => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'][new Date().getDay() - 1] === c.day,
    ) || [];

    return (
        <DashboardLayout title="Student Dashboard">
            {/* Greeting */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},{' '}
                    <span className="gradient-text">{userProfile?.name?.split(' ')[0] || 'Student'}</span> 👋
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Here's what's happening at your campus today.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Percent} label="Attendance" value={attendance} suffix="%" color="indigo" trend={3} index={0} />
                <StatCard icon={MessageSquare} label="Total Complaints" value={complaints.length} color="blue" index={1} />
                <StatCard icon={AlertCircle} label="Pending" value={pending + inProgress} color="amber" index={2} />
                <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" index={3} />
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Attendance Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="section-title">Weekly Attendance</h3>
                            <p className="text-xs text-gray-400 mt-0.5">This week's attendance percentage</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-full">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {attendance}% Overall
                        </div>
                    </div>
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span>Attendance Progress</span>
                            <span className={attendance >= 75 ? 'text-emerald-500' : 'text-rose-500'}>
                                {attendance >= 75 ? '✓ Eligible' : '⚠ Below 75%'}
                            </span>
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${attendance}%` }} />
                        </div>
                    </div>
                    <AttendanceChart data={userProfile?.attendanceData} type="area" />
                </motion.div>

                {/* Today's Schedule */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="card"
                >
                    <h3 className="section-title mb-4">Today's Classes</h3>
                    {todaySchedule.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-4xl mb-2">🎉</div>
                            <p className="text-sm text-gray-500">No classes today!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {todaySchedule.map((cls, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{cls.subject}</p>
                                        <p className="text-xs text-gray-400">{cls.time} • {cls.room}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Full Schedule</h4>
                        <div className="space-y-2">
                            {(userProfile?.classSchedule || []).slice(0, 4).map((cls, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="text-primary-500 font-bold">{cls.day}</span>
                                        <span className="text-gray-600 dark:text-gray-400">{cls.subject}</span>
                                    </div>
                                    <span className="text-gray-400">{cls.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row: Complaints + Announcements */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Complaints with tracking */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title">My Complaints</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => navigate('/student/complaints')}
                                className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline flex items-center gap-0.5">
                                View all <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => navigate('/student/complaints')}
                                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> New
                            </button>
                        </div>
                    </div>

                    {complaints.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageSquare className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No complaints submitted yet</p>
                            <button onClick={() => navigate('/student/complaints')}
                                className="btn-primary mt-3 text-xs py-1.5 px-4 inline-flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> Submit first complaint
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {complaints.slice(0, 3).map(c => (
                                <div key={c.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/40">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate flex-1">{c.title}</p>
                                        <span className={`badge flex-shrink-0 capitalize ${STATUS_BADGE[c.status] || 'badge-pending'}`}>
                                            {c.status?.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-0.5 capitalize">{c.category} Dept</p>
                                    {/* Mini progress tracker */}
                                    <ComplaintProgressTracker
                                        status={c.status}
                                        trackingHistory={c.trackingHistory}
                                        assignedTo={c.assignedTo}
                                    />
                                </div>
                            ))}
                            {complaints.length > 3 && (
                                <button onClick={() => navigate('/student/complaints')}
                                    className="w-full text-xs text-center text-primary-600 dark:text-primary-400 font-medium hover:underline py-1">
                                    +{complaints.length - 3} more complaints →
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Latest Announcements */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title">Latest Announcements</h3>
                        <button onClick={() => navigate('/student/announcements')}
                            className="text-xs text-primary-600 dark:text-primary-400 font-medium hover:underline">
                            View all
                        </button>
                    </div>
                    {announcements.length === 0 ? (
                        <div className="text-center py-8">
                            <Megaphone className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No announcements yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {announcements.slice(0, 3).map(a => (
                                <div key={a.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-l-4 border-primary-400">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{a.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.body}</p>
                                    {a.createdAt && (
                                        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
                                            {formatDistanceToNow(a.createdAt.toDate?.() || new Date(), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
