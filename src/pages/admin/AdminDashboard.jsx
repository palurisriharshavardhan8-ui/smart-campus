import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, ClipboardList, CheckCircle, AlertCircle, Plus,
    Building2, ShieldCheck,
} from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy, limit,
    updateDoc, doc, serverTimestamp, arrayUnion, Timestamp, where,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatCard from '../../components/StatCard';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#f59e0b', '#6366f1', '#8b5cf6', '#10b981'];
const CLASS_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

const DEPT_LABELS = {
    infrastructure: 'Infrastructure',
    hostel: 'Hostel',
    transport: 'Transport',
    academic: 'Academic',
};
const ALL_DEPTS = Object.keys(DEPT_LABELS);

const STATUS_BADGE = {
    submitted: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    under_review: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    'in-progress': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    resolved: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
};

export default function AdminDashboard() {
    const { userProfile } = useAuth();
    const navigate = useNavigate();

    // isDeptAdmin → true when admin has a specific department assigned
    const isDeptAdmin = !!userProfile?.department;
    const deptName = userProfile?.department || null;
    const deptLabel = deptName ? DEPT_LABELS[deptName] || deptName : null;

    const [allComplaints, setAllComplaints] = useState([]);
    const [students, setStudents] = useState([]);
    const [announcements, setAnnouncements] = useState([]);

    /* ── Complaints ── */
    useEffect(() => {
        // Dept admin → only their dept; super admin → everything
        const q = isDeptAdmin
            ? query(collection(db, 'complaints'), where('adminDepartment', '==', deptName))
            : query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap =>
            setAllComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        );
    }, [isDeptAdmin, deptName]);

    useEffect(() => onSnapshot(collection(db, 'students'), snap =>
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
        return onSnapshot(q, snap =>
            setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        );
    }, []);

    // Dept admins work on forwarded → resolved; class teachers work earlier stages
    // Dept admin's "actionable" complaints = forwarded ones
    const complaints = allComplaints; // already filtered for dept admin

    const submitted = complaints.filter(c => c.status === 'submitted' || c.status === 'pending').length;
    const inReview = complaints.filter(c => c.status === 'under_review' || c.status === 'in-progress').length;
    const forwarded = complaints.filter(c => c.status === 'forwarded').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const actionable = isDeptAdmin
        ? complaints.filter(c => c.status === 'forwarded').length   // dept admin resolves forwarded
        : complaints.filter(c => c.status !== 'resolved').length;   // super admin sees all open

    /* ── Pie: status breakdown ── */
    const pieData = [
        { name: 'Submitted', value: submitted },
        { name: 'Under Review', value: inReview },
        { name: 'Forwarded', value: forwarded },
        { name: 'Resolved', value: resolved },
    ].filter(d => d.value > 0);

    /* ── Bar: per department (super admin only) ── */
    const deptData = ALL_DEPTS.map(dept => ({
        dept: DEPT_LABELS[dept],
        total: allComplaints.filter(c => c.adminDepartment === dept || c.category?.toLowerCase() === dept).length,
        resolved: allComplaints.filter(c => (c.adminDepartment === dept || c.category?.toLowerCase() === dept) && c.status === 'resolved').length,
    }));

    /* ── Bar: by class ── */
    const classMap = {};
    complaints.forEach(c => {
        if (c.studentClass) classMap[c.studentClass] = (classMap[c.studentClass] || 0) + 1;
    });
    const classData = Object.entries(classMap).map(([cls, count]) => ({ class: cls, count }));

    /* ── Status update with trackingHistory ── */
    async function handleStatusChange(complaint, newStatus) {
        const STAGE_LABELS = { submitted: 'Submitted', under_review: 'Under Review', forwarded: 'Forwarded', resolved: 'Resolved' };
        const entry = {
            stage: STAGE_LABELS[newStatus] || newStatus,
            actor: userProfile?.name || (isDeptAdmin ? `${deptLabel} Admin` : 'Admin'),
            message: newStatus === 'resolved' ? `Resolved by ${deptLabel || 'Admin'}` : `Status updated to ${newStatus.replace(/_/g, ' ')}`,
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', complaint.id), {
                status: newStatus,
                assignedTo: newStatus === 'resolved' ? 'resolved' : `${deptName || 'admin'}Admin`,
                updatedAt: serverTimestamp(),
                trackingHistory: arrayUnion(entry),
            });
            toast.success(`Status → ${newStatus.replace(/_/g, ' ')}`);
        } catch { toast.error('Failed to update'); }
    }

    /* ── Common chart tooltip style ── */
    const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 };

    return (
        <DashboardLayout title={isDeptAdmin ? `${deptLabel} Admin` : 'Admin Dashboard'}>
            {/* ── Header ── */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    {isDeptAdmin
                        ? <Building2 className="w-6 h-6 text-violet-500" />
                        : <ShieldCheck className="w-6 h-6 text-primary-500" />}
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {isDeptAdmin
                            ? <><span className="gradient-text capitalize">{deptLabel}</span> Department</>
                            : <>Admin <span className="gradient-text">Overview</span></>}
                    </h2>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                    {isDeptAdmin
                        ? `Viewing complaints for ${deptLabel} department only. Resolve forwarded complaints to close the loop.`
                        : 'Full campus overview — manage all departments, complaints, announcements and students.'}
                </p>
                {isDeptAdmin && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-xs font-semibold border border-violet-200 dark:border-violet-800">
                        <Building2 className="w-3.5 h-3.5" />
                        {deptLabel} Department Admin
                    </div>
                )}
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isDeptAdmin ? (
                    <>
                        <StatCard icon={ClipboardList} label="Dept Complaints" value={complaints.length} color="purple" index={0} />
                        <StatCard icon={AlertCircle} label="Awaiting Action" value={forwarded} color="amber" index={1} />
                        <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" trend={12} index={2} />
                        <StatCard icon={Users} label="Total Students" value={students.length || 1} color="blue" index={3} />
                    </>
                ) : (
                    <>
                        <StatCard icon={Users} label="Total Students" value={students.length || 1} color="blue" trend={5} index={0} />
                        <StatCard icon={ClipboardList} label="All Complaints" value={complaints.length} color="purple" index={1} />
                        <StatCard icon={AlertCircle} label="Open" value={actionable} color="amber" index={2} />
                        <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" trend={12} index={3} />
                    </>
                )}
            </div>

            {/* ── Analytics Row 1 ── */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">

                {/* Status Pie — both admin types see this */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h3 className="section-title mb-0.5">
                        {isDeptAdmin ? `${deptLabel} — Status Breakdown` : 'Complaints by Status'}
                    </h3>
                    <p className="text-xs text-gray-400 mb-4">
                        {isDeptAdmin ? `${complaints.length} complaints in your department` : 'Campus-wide status distribution'}
                    </p>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend iconType="circle" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                            No complaints yet
                        </div>
                    )}
                </motion.div>

                {/* Super admin → dept bar chart | Dept admin → class bar chart */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                    {isDeptAdmin ? (
                        <>
                            <h3 className="section-title mb-0.5">{deptLabel} Complaints by Class</h3>
                            <p className="text-xs text-gray-400 mb-4">Which classes submit the most {deptLabel.toLowerCase()} complaints</p>
                            {classData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={classData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                                        <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                                            {classData.map((_, i) => <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
                                    No class data yet
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 className="section-title mb-0.5">Complaints per Department</h3>
                            <p className="text-xs text-gray-400 mb-4">Total vs Resolved by department</p>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={deptData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                                    <XAxis dataKey="dept" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                    <Tooltip contentStyle={tooltipStyle} />
                                    <Legend iconType="circle" iconSize={8} />
                                    <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </motion.div>
            </div>

            {/* ── Analytics Row 2 ── */}
            {/* Super admin: class bar chart | Dept admin: resolved vs pending timeline bar */}
            {!isDeptAdmin && classData.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card mb-6">
                    <h3 className="section-title mb-0.5">Complaints by Class</h3>
                    <p className="text-xs text-gray-400 mb-4">Which classes raise the most complaints campus-wide</p>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={classData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                            <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Bar dataKey="count" name="Complaints" radius={[4, 4, 0, 0]}>
                                {classData.map((_, i) => <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}

            {/* ── Recent Complaints + Quick Actions ── */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Recent complaints */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="section-title">
                                {isDeptAdmin ? `Forwarded to ${deptLabel}` : 'Recent Complaints'}
                            </h3>
                            {isDeptAdmin && (
                                <p className="text-xs text-gray-400 mt-0.5">Complaints awaiting your resolution</p>
                            )}
                        </div>
                        <button onClick={() => navigate('/admin/complaints')} className="btn-primary text-xs py-1.5 px-3">
                            {isDeptAdmin ? 'Resolve All' : 'View all'}
                        </button>
                    </div>
                    <div className="space-y-2">
                        {/* Dept admin prioritizes forwarded, super admin shows all recent */}
                        {(isDeptAdmin
                            ? [...complaints].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
                            : [...complaints].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
                        ).slice(0, 6).map(c => (
                            <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{c.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                                        <span>{c.studentName}</span>
                                        {c.studentClass && <span>• {c.studentClass}</span>}
                                        {!isDeptAdmin && c.category && <span>• {c.category}</span>}
                                    </div>
                                </div>
                                <select value={c.status} onChange={e => handleStatusChange(c, e.target.value)}
                                    className={`text-xs font-semibold px-2 py-1 rounded-lg border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/30 flex-shrink-0 ${STATUS_BADGE[c.status] || STATUS_BADGE.submitted}`}>
                                    {isDeptAdmin ? (
                                        // Dept admin can only move forwarded → resolved (their scope)
                                        <>
                                            <option value="forwarded">Forwarded</option>
                                            <option value="resolved">✓ Resolved</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="submitted">Submitted</option>
                                            <option value="under_review">Under Review</option>
                                            <option value="forwarded">Forwarded</option>
                                            <option value="resolved">✓ Resolved</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        ))}
                        {complaints.length === 0 && (
                            <p className="text-center py-8 text-sm text-gray-400">
                                {isDeptAdmin ? `No complaints in ${deptLabel} department yet` : 'No complaints yet'}
                            </p>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
                    <h3 className="section-title mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: isDeptAdmin ? 'My Complaints' : 'All Complaints', icon: ClipboardList, color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400', path: '/admin/complaints' },
                            { label: 'Announcement', icon: Plus, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', path: '/admin/announcements' },
                            { label: 'Add Notes', icon: Plus, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400', path: '/admin/notes' },
                            { label: 'Students', icon: Users, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400', path: '/admin/students' },
                        ].map(({ label, icon: Icon, color, path }) => (
                            <button key={label} onClick={() => navigate(path)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl ${color} hover:opacity-80 transition-opacity`}>
                                <Icon className="w-5 h-5" />
                                <span className="text-xs font-medium text-center leading-tight">{label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Dept admin: resolution progress ring */}
                    {isDeptAdmin && complaints.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resolution Rate</p>
                            <div className="flex items-center gap-3">
                                <div className="relative w-16 h-16 flex-shrink-0">
                                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                        <circle cx="32" cy="32" r="26" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                                        <circle cx="32" cy="32" r="26" fill="none" stroke="#10b981" strokeWidth="6"
                                            strokeDasharray={`${Math.round((resolved / complaints.length) * 163.4)} 163.4`}
                                            strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                            {Math.round((resolved / complaints.length) * 100)}%
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{resolved} / {complaints.length}</p>
                                    <p className="text-xs text-gray-400">complaints resolved</p>
                                    {forwarded > 0 && (
                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">{forwarded} awaiting action</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* ── Announcements ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="section-title">Recent Announcements</h3>
                    <button onClick={() => navigate('/admin/announcements')} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                    {announcements.map(a => (
                        <div key={a.id} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border-l-4 border-primary-400">
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
