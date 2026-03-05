import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ClipboardList, CheckCircle, Clock, ArrowRight,
    Users, Building2, Search,
} from 'lucide-react';
import {
    collection, onSnapshot, query, where, orderBy, limit,
    Timestamp, arrayUnion, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

/* ── Constants ──────────────────────────────────────────────── */
const PIE_COLORS = ['#f59e0b', '#6366f1', '#8b5cf6', '#10b981'];
const DEPT_COLORS = { infrastructure: '#6366f1', hostel: '#f59e0b', transport: '#06b6d4', academic: '#10b981' };
const DEPT_LABELS = { infrastructure: 'Infrastructure', hostel: 'Hostel', transport: 'Transport', academic: 'Academic' };
const ALL_DEPTS = Object.keys(DEPT_LABELS);

const STATUS_BADGE = {
    submitted: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    under_review: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    'in-progress': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    resolved: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
};

const tooltipStyle = {
    borderRadius: 12, border: 'none',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12,
};

export default function TeacherDashboard() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);   // all class complaints
    const [students, setStudents] = useState([]);   // students of teacher's class
    const [search, setSearch] = useState('');

    /* ── Real-time: All class complaints (all departments) ── */
    useEffect(() => {
        if (!currentUser) return;
        // single-field query – no composite index needed; sort client-side
        const q = query(
            collection(db, 'complaints'),
            where('classTeacherId', '==', currentUser.uid),
        );
        return onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
            setComplaints(docs);
        }, err => console.error('complaints:', err));
    }, [currentUser]);

    /* ── Real-time: Students in this teacher's class ── */
    useEffect(() => {
        if (!userProfile?.className) return;
        const q = query(
            collection(db, 'students'),
            where('className', '==', userProfile.className),
        );
        return onSnapshot(q, snap =>
            setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            err => console.error('students:', err));
    }, [userProfile?.className]);

    /* ── Computed stats ── */
    const submitted = complaints.filter(c => c.status === 'submitted' || c.status === 'pending').length;
    const inReview = complaints.filter(c => c.status === 'under_review').length;
    const forwarded = complaints.filter(c => c.status === 'forwarded').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    /* ── Chart data ── */
    const pieData = [
        { name: 'Submitted', value: submitted },
        { name: 'Under Review', value: inReview },
        { name: 'Forwarded', value: forwarded },
        { name: 'Resolved', value: resolved },
    ].filter(d => d.value > 0);

    const deptData = ALL_DEPTS.map(dept => ({
        dept: DEPT_LABELS[dept],
        total: complaints.filter(c => (c.adminDepartment || c.category)?.toLowerCase() === dept).length,
        resolved: complaints.filter(c => (c.adminDepartment || c.category)?.toLowerCase() === dept && c.status === 'resolved').length,
        color: DEPT_COLORS[dept],
    }));

    /* ── Status actions with trackingHistory ── */
    async function markUnderReview(c) {
        const entry = {
            stage: 'Under Review', actor: userProfile?.name || 'Class Teacher',
            message: 'Complaint is being reviewed by class teacher', timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', c.id), {
                status: 'under_review', assignedTo: 'classTeacher',
                updatedAt: serverTimestamp(), trackingHistory: arrayUnion(entry),
            });
            toast.success('Marked Under Review');
        } catch { toast.error('Update failed'); }
    }

    async function forwardToAdmin(c) {
        const dept = (c.adminDepartment || c.category || 'admin').toLowerCase();
        const entry = {
            stage: 'Forwarded', actor: userProfile?.name || 'Class Teacher',
            message: `Forwarded to ${DEPT_LABELS[dept] || dept} Department Admin`,
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', c.id), {
                status: 'forwarded', assignedTo: 'deptAdmin',
                adminDepartment: dept,          // ensure dept field is set
                updatedAt: serverTimestamp(), trackingHistory: arrayUnion(entry),
            });
            toast.success(`Forwarded to ${DEPT_LABELS[dept] || dept} Admin`);
        } catch { toast.error('Forward failed'); }
    }

    /* ── Student filter ── */
    const filteredStudents = students.filter(s =>
        !search ||
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.registerNumber?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <DashboardLayout title="Teacher Dashboard">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome, <span className="gradient-text">{userProfile?.name?.split(' ')[0] || 'Teacher'}</span> 👋
                </h2>
                <p className="text-gray-500 mt-1 text-sm">
                    Class <span className="font-semibold text-gray-700 dark:text-gray-300">{userProfile?.className || '—'}</span>
                    {' '}· {students.length} students · {complaints.length} total complaints
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={ClipboardList} label="New Complaints" value={submitted} color="amber" index={0} />
                <StatCard icon={Clock} label="Under Review" value={inReview} color="blue" index={1} />
                <StatCard icon={ArrowRight} label="Forwarded" value={forwarded} color="purple" index={2} />
                <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" index={3} />
            </div>

            {/* ── Analytics: Two charts side by side ── */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">

                {/* Status Pie */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h3 className="section-title mb-0.5">Complaint Status</h3>
                    <p className="text-xs text-gray-400 mb-4">Breakdown across all departments</p>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">No complaints yet</div>
                    )}
                </motion.div>

                {/* Department Bar Chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                    <h3 className="section-title mb-0.5">Complaints by Department</h3>
                    <p className="text-xs text-gray-400 mb-4">Total vs Resolved per department • class {userProfile?.className}</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                            <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend iconType="circle" iconSize={8} />
                            <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* ── Dept breakdown chips ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {deptData.map(d => (
                    <motion.div key={d.dept} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="card p-4 flex items-center gap-3">
                        <Building2 className="w-5 h-5 flex-shrink-0" style={{ color: d.color }} />
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-500 truncate">{d.dept}</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{d.total}</p>
                            <p className="text-[10px] text-gray-400">{d.resolved} resolved</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ── Complaints Table ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card overflow-hidden p-0 mb-8">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="section-title">All Class Complaints — Every Department</h3>
                    <button onClick={() => navigate('/teacher/complaints')} className="btn-primary text-xs py-1.5 px-3">
                        Full View
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                {['Student', 'Reg No', 'Title', 'Department', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {complaints.slice(0, 8).map((c, i) => (
                                <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{c.studentName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{c.registerNumber || '—'}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[160px]">
                                        <p className="truncate">{c.title}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="badge capitalize text-xs"
                                            style={{
                                                background: (DEPT_COLORS[(c.adminDepartment || c.category)?.toLowerCase()] || '#6366f1') + '20',
                                                color: DEPT_COLORS[(c.adminDepartment || c.category)?.toLowerCase()] || '#6366f1',
                                            }}>
                                            {DEPT_LABELS[(c.adminDepartment || c.category)?.toLowerCase()] || c.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge capitalize ${STATUS_BADGE[c.status] || STATUS_BADGE.submitted}`}>
                                            {c.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1.5 flex-wrap">
                                            {(c.status === 'submitted' || c.status === 'pending') && (
                                                <button onClick={() => markUnderReview(c)}
                                                    className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-medium">
                                                    Review
                                                </button>
                                            )}
                                            {c.status !== 'forwarded' && c.status !== 'resolved' && (
                                                <button onClick={() => forwardToAdmin(c)}
                                                    className="text-xs px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 font-medium flex items-center gap-1">
                                                    <ArrowRight className="w-3 h-3" />
                                                    {DEPT_LABELS[(c.adminDepartment || c.category)?.toLowerCase()]?.slice(0, 6) || 'Fwd'}
                                                </button>
                                            )}
                                            {(c.status === 'forwarded' || c.status === 'resolved') && (
                                                <span className={`text-xs font-medium capitalize ${c.status === 'resolved' ? 'text-emerald-500' : 'text-violet-500'}`}>
                                                    {c.status}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {complaints.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400">
                                    <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    No complaints from your class yet
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* ── Student List ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card overflow-hidden p-0">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="section-title">Students — {userProfile?.className}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{students.length} registered students</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search name or reg no..."
                            className="input-field pl-8 py-1.5 text-xs w-52" />
                    </div>
                </div>

                {filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">
                            {students.length === 0
                                ? `No students registered for class ${userProfile?.className || ''} yet`
                                : 'No students match your search'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                    {['#', 'Name', 'Register No', 'Branch / Section', 'Email', 'Complaints'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {filteredStudents.map((s, i) => {
                                    const studentComplaints = complaints.filter(c => c.studentId === s.uid).length;
                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                            <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800 dark:text-gray-200">{s.name}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.registerNumber || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500">{s.branch} – {s.section}</td>
                                            <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-[140px]">{s.email}</td>
                                            <td className="px-4 py-3">
                                                <span className={`badge text-xs ${studentComplaints > 0 ? 'badge-pending' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                                                    {studentComplaints} complaint{studentComplaints !== 1 ? 's' : ''}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </motion.div>
        </DashboardLayout>
    );
}
