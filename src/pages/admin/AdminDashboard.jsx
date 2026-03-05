import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, ClipboardList, CheckCircle, AlertCircle, Clock,
    TrendingUp, Plus, BarChart3,
} from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy, limit, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatCard from '../../components/StatCard';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_COLORS_MAP = {
    pending: '#f59e0b',
    'in-progress': '#3b82f6',
    resolved: '#10b981',
};

const STATUS_BADGE = {
    pending: 'badge-pending',
    'in-progress': 'badge-inprogress',
    resolved: 'badge-resolved',
};

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [students, setStudents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    useEffect(() => {
        return onSnapshot(collection(db, 'students'), snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
        return onSnapshot(q, snap => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    const pieData = [
        { name: 'Pending', value: pending },
        { name: 'In Progress', value: inProgress },
        { name: 'Resolved', value: resolved },
    ].filter(d => d.value > 0);

    const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

    async function handleStatusChange(id, newStatus) {
        try {
            await updateDoc(doc(db, 'complaints', id), { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
        } catch {
            toast.error('Failed to update status');
        }
    }

    return (
        <DashboardLayout title="Admin Dashboard">
            {/* Greeting */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Admin <span className="gradient-text">Overview</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your campus operations from one place.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="Total Students" value={students.length || 1} color="blue" trend={5} index={0} />
                <StatCard icon={ClipboardList} label="Total Complaints" value={complaints.length} color="purple" index={1} />
                <StatCard icon={AlertCircle} label="Pending" value={pending} color="amber" index={2} />
                <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" trend={12} index={3} />
            </div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Complaints chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="card"
                >
                    <h3 className="section-title mb-1">Complaints Status</h3>
                    <p className="text-xs text-gray-400 mb-4">Distribution by status</p>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {pieData.map((entry, index) => (
                                        <Cell key={index} fill={PIE_COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                                <Legend iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No complaints yet</div>
                    )}
                </motion.div>

                {/* Recent complaints */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="lg:col-span-2 card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title">Recent Complaints</h3>
                        <button onClick={() => navigate('/admin/complaints')} className="btn-primary text-xs py-1.5 px-3">
                            View all
                        </button>
                    </div>
                    <div className="space-y-3">
                        {complaints.slice(0, 4).map(c => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.title}</p>
                                    <p className="text-xs text-gray-400">{c.studentName} • {c.category}</p>
                                </div>
                                <select
                                    value={c.status}
                                    onChange={e => handleStatusChange(c.id, e.target.value)}
                                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${c.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                            c.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        }`}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        ))}
                        {complaints.length === 0 && (
                            <div className="text-center py-6 text-gray-400 text-sm">No complaints yet</div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Announcements */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="card"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title">Announcements</h3>
                        <button onClick={() => navigate('/admin/announcements')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                    </div>
                    <div className="space-y-3">
                        {announcements.map(a => (
                            <div key={a.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{a.title}</p>
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.body}</p>
                            </div>
                        ))}
                        {announcements.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No announcements yet</p>}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                    className="card"
                >
                    <h3 className="section-title mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Manage Complaints', icon: ClipboardList, color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', path: '/admin/complaints' },
                            { label: 'Post Announcement', icon: Plus, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', path: '/admin/announcements' },
                            { label: 'Add Notes', icon: Plus, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', path: '/admin/notes' },
                            { label: 'View Students', icon: Users, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', path: '/admin/students' },
                        ].map(({ label, icon: Icon, color, path }) => (
                            <button
                                key={label}
                                onClick={() => navigate(path)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition-opacity border border-transparent hover:border-current/10`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-xs font-medium text-center">{label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </DashboardLayout>
    );
}
