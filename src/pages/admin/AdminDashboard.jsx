import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, ClipboardList, CheckCircle, AlertCircle, Plus, BarChart3,
} from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy, limit, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatCard from '../../components/StatCard';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#f59e0b', '#6366f1', '#8b5cf6', '#10b981'];
const BAR_COLOR = '#6366f1';
const CLASS_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

const DEPT_LABELS = { infrastructure: 'Infra', hostel: 'Hostel', transport: 'Transport', academic: 'Academic' };
const ALL_DEPTS = Object.keys(DEPT_LABELS);

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);
    const [students, setStudents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);
    useEffect(() => onSnapshot(collection(db, 'students'), snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);
    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
        return onSnapshot(q, snap => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    // Status stats (combine old & new status names)
    const submitted = complaints.filter(c => c.status === 'submitted' || c.status === 'pending').length;
    const inReview = complaints.filter(c => c.status === 'under_review' || c.status === 'in-progress').length;
    const forwarded = complaints.filter(c => c.status === 'forwarded').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    // Pie data: status breakdown
    const pieData = [
        { name: 'Submitted', value: submitted },
        { name: 'Under Review', value: inReview },
        { name: 'Forwarded', value: forwarded },
        { name: 'Resolved', value: resolved },
    ].filter(d => d.value > 0);

    // Bar data: per department
    const deptData = ALL_DEPTS.map(dept => ({
        dept: DEPT_LABELS[dept],
        total: complaints.filter(c => c.adminDepartment === dept || c.category?.toLowerCase() === dept).length,
        resolved: complaints.filter(c => (c.adminDepartment === dept || c.category?.toLowerCase() === dept) && c.status === 'resolved').length,
    }));

    // Bar data: by class
    const classMap = {};
    complaints.forEach(c => {
        if (c.studentClass) classMap[c.studentClass] = (classMap[c.studentClass] || 0) + 1;
    });
    const classData = Object.entries(classMap).map(([cls, count]) => ({ class: cls, count }));

    async function handleStatusChange(id, newStatus) {
        try {
            await updateDoc(doc(db, 'complaints', id), { status: newStatus });
            toast.success(`Status → ${newStatus.replace('_', ' ')}`);
        } catch { toast.error('Failed to update'); }
    }

    const STATUS_BADGE_CLASS = {
        submitted: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
        pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
        under_review: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
        'in-progress': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
        forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
        resolved: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
    };

    return (
        <DashboardLayout title="Admin Dashboard">
            {/* Greeting */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Admin <span className="gradient-text">Overview</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Manage campus operations and monitor complaint analytics.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="Total Students" value={students.length || 1} color="blue" trend={5} index={0} />
                <StatCard icon={ClipboardList} label="Total Complaints" value={complaints.length} color="purple" index={1} />
                <StatCard icon={AlertCircle} label="Pending/Submitted" value={submitted + inReview + forwarded} color="amber" index={2} />
                <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" trend={12} index={3} />
            </div>

            {/* Analytics Row 1 */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Status Pie */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h3 className="section-title mb-1">Complaints by Status</h3>
                    <p className="text-xs text-gray-400 mb-4">Overall status distribution</p>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} formatter={(v, n) => [v, n]} />
                                <Legend iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No complaints yet</div>
                    )}
                </motion.div>

                {/* Dept Bar Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                    <h3 className="section-title mb-1">Complaints per Department</h3>
                    <p className="text-xs text-gray-400 mb-4">Total vs Resolved by department</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                            <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }} />
                            <Legend iconType="circle" iconSize={8} />
                            <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Analytics Row 2 — Complaints by Class */}
            {classData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card mb-6">
                    <h3 className="section-title mb-1">Complaints by Class</h3>
                    <p className="text-xs text-gray-400 mb-4">Which classes raise the most complaints</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={classData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                            <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                            <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                                {classData.map((_, i) => <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* Recent Complaints + Actions */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Recent complaints */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="section-title">Recent Complaints</h3>
                        <button onClick={() => navigate('/admin/complaints')} className="btn-primary text-xs py-1.5 px-3">View all</button>
                    </div>
                    <div className="space-y-3">
                        {complaints.slice(0, 5).map(c => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.title}</p>
                                    <p className="text-xs text-gray-400">{c.studentName} • {c.category} {c.studentClass ? `• ${c.studentClass}` : ''}</p>
                                </div>
                                <select value={c.status} onChange={e => handleStatusChange(c.id, e.target.value)}
                                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${STATUS_BADGE_CLASS[c.status] || STATUS_BADGE_CLASS.submitted}`}>
                                    <option value="submitted">Submitted</option>
                                    <option value="under_review">Under Review</option>
                                    <option value="forwarded">Forwarded</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                        ))}
                        {complaints.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">No complaints yet</div>}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
                    <h3 className="section-title mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Manage Complaints', icon: ClipboardList, color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600', path: '/admin/complaints' },
                            { label: 'Post Announcement', icon: Plus, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600', path: '/admin/announcements' },
                            { label: 'Add Notes', icon: Plus, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600', path: '/admin/notes' },
                            { label: 'View Students', icon: Users, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600', path: '/admin/students' },
                        ].map(({ label, icon: Icon, color, path }) => (
                            <button key={label} onClick={() => navigate(path)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition-opacity`}>
                                <Icon className="w-6 h-6" />
                                <span className="text-xs font-medium text-center">{label}</span>
                            </button>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Announcements */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="section-title">Recent Announcements</h3>
                    <button onClick={() => navigate('/admin/announcements')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                    {announcements.map(a => (
                        <div key={a.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1">{a.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{a.body}</p>
                        </div>
                    ))}
                    {announcements.length === 0 && <p className="text-sm text-gray-400 py-4">No announcements yet</p>}
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
