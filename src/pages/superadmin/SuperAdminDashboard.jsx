import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    ShieldCheck, Users, ClipboardList, CheckCircle,
    ChevronRight, Search, Building2, School,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatCard from '../../components/StatCard';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const PIE_COLORS = ['#f59e0b', '#6366f1', '#8b5cf6', '#f97316', '#10b981'];
const DEPT_COLORS = { infrastructure: '#6366f1', hostel: '#f59e0b', transport: '#06b6d4', academic: '#10b981' };
const DEPT_LABELS = { infrastructure: 'Infrastructure', hostel: 'Hostel', transport: 'Transport', academic: 'Academic' };
const ALL_DEPTS = Object.keys(DEPT_LABELS);
const tooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', fontSize: 12 };

const STATUS_BADGE = {
    submitted: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    under_review: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    pending_confirmation: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    resolved: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
};

export default function SuperAdminDashboard() {
    const { userProfile } = useAuth();
    const navigate = useNavigate();

    const [complaints, setComplaints] = useState([]);
    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedSection, setSelectedSection] = useState(null); // { className, teacher, students }
    const [search, setSearch] = useState('');
    const [sectionSearch, setSectionSearch] = useState('');

    /* ── Live listeners ── */
    useEffect(() => {
        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);
    useEffect(() => onSnapshot(collection(db, 'students'), snap => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);
    useEffect(() => onSnapshot(collection(db, 'classTeachers'), snap => setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);
    useEffect(() => onSnapshot(collection(db, 'classes'), snap => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() })))), []);

    /* ── Computed stats ── */
    const open = complaints.filter(c => c.status !== 'resolved').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const pending = complaints.filter(c => c.status === 'pending_confirmation').length;

    /* ── Chart data ── */
    const pieData = [
        { name: 'Submitted', value: complaints.filter(c => c.status === 'submitted' || c.status === 'pending').length },
        { name: 'Under Review', value: complaints.filter(c => c.status === 'under_review').length },
        { name: 'Forwarded', value: complaints.filter(c => c.status === 'forwarded').length },
        { name: 'Awaiting Confirm', value: pending },
        { name: 'Resolved', value: resolved },
    ].filter(d => d.value > 0);

    const deptBar = ALL_DEPTS.map(dept => ({
        dept: DEPT_LABELS[dept],
        total: complaints.filter(c => (c.adminDepartment || c.category)?.toLowerCase() === dept).length,
        resolved: complaints.filter(c => (c.adminDepartment || c.category)?.toLowerCase() === dept && c.status === 'resolved').length,
    }));

    /* ── Build section list (merge classes + teachers + student counts) ── */
    const sectionList = classes.map(cls => {
        const teacher = teachers.find(t => t.uid === cls.teacherId);
        const studentCount = students.filter(s => s.className === cls.className).length;
        const complaintCount = complaints.filter(c => c.studentClass === cls.className || c.className === cls.className).length;
        return { ...cls, teacher, studentCount, complaintCount };
    });

    // Also include teachers who are in classTeachers but not in classes collection yet
    const knownClasses = new Set(sectionList.map(s => s.className));
    teachers.forEach(t => {
        if (t.className && !knownClasses.has(t.className)) {
            sectionList.push({
                className: t.className, branch: t.branch, section: t.section,
                teacherId: t.uid, teacher: t,
                studentCount: students.filter(s => s.className === t.className).length,
                complaintCount: complaints.filter(c => c.studentClass === t.className).length,
            });
        }
    });

    const filteredSections = sectionList.filter(s =>
        !sectionSearch || s.className?.toLowerCase().includes(sectionSearch.toLowerCase()),
    );

    /* ── Open section detail ── */
    function openSection(sec) {
        const sStudents = students.filter(s => s.className === sec.className);
        setSelectedSection({ ...sec, students: sStudents });
    }

    /* ── Recent complaints filtered by search ── */
    const filteredComplaints = complaints.filter(c =>
        !search ||
        c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.category?.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <DashboardLayout title="Head Admin">
            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-6 h-6 text-rose-500" />
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Head Admin <span className="gradient-text">Overview</span>
                        </h2>
                    </div>
                    <p className="text-gray-500 text-sm">Full campus visibility — all departments, all class sections.</p>
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-800">
                        <ShieldCheck className="w-3.5 h-3.5" /> Super Administrator
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="Total Students" value={students.length} color="blue" trend={5} index={0} />
                <StatCard icon={ClipboardList} label="All Complaints" value={complaints.length} color="purple" index={1} />
                <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" trend={12} index={2} />
                <StatCard icon={School} label="Class Sections" value={sectionList.length} color="indigo" index={3} />
            </div>

            {/* Analytics */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
                {/* Status pie */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
                    <h3 className="section-title mb-0.5">Campus Complaint Status</h3>
                    <p className="text-xs text-gray-400 mb-4">All complaints across all departments</p>
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
                        <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">No complaints yet</div>
                    )}
                </motion.div>

                {/* Dept bar */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card">
                    <h3 className="section-title mb-0.5">Complaints per Department</h3>
                    <p className="text-xs text-gray-400 mb-4">Total vs Resolved — campus-wide</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={deptBar} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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

            {/* Dept chip row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {deptBar.map(d => (
                    <div key={d.dept} className="card p-4 flex items-center gap-3">
                        <Building2 className="w-5 h-5 flex-shrink-0 text-primary-500" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500">{d.dept}</p>
                            <p className="text-xl font-bold text-gray-800 dark:text-white">{d.total}</p>
                            <p className="text-[10px] text-gray-400">{d.resolved} resolved</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Class Sections List ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card overflow-hidden p-0 mb-8">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h3 className="section-title">All Class Sections</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Click a section to see teacher + students</p>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input value={sectionSearch} onChange={e => setSectionSearch(e.target.value)}
                            placeholder="Filter sections..." className="input-field pl-8 py-1.5 text-xs w-44" />
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
                    {filteredSections.length === 0 ? (
                        <p className="col-span-3 text-center py-8 text-sm text-gray-400">No sections registered yet</p>
                    ) : filteredSections.map(sec => (
                        <button key={sec.className} onClick={() => openSection(sec)}
                            className="text-left p-4 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-gray-800 dark:text-white text-lg">{sec.className}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
                            </div>
                            <div className="text-xs text-gray-500 space-y-0.5">
                                <p>👩‍🏫 {sec.teacher?.name || 'No teacher assigned'}</p>
                                <p>👥 {sec.studentCount} students</p>
                                <p>📋 {sec.complaintCount} complaints</p>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* ── Recent Complaints ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card overflow-hidden p-0">
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="section-title">All Campus Complaints</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search complaints..." className="input-field pl-8 py-1.5 text-xs w-52" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                {['Student', 'Class', 'Title', 'Dept', 'Status', 'Handler'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {filteredComplaints.slice(0, 15).map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{c.studentName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{c.studentClass || c.className || '—'}</td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[150px]">
                                        <p className="truncate">{c.title}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs capitalize font-medium" style={{ color: DEPT_COLORS[(c.adminDepartment || c.category)?.toLowerCase()] || '#6366f1' }}>
                                            {DEPT_LABELS[(c.adminDepartment || c.category)?.toLowerCase()] || c.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge capitalize ${STATUS_BADGE[c.status] || STATUS_BADGE.submitted}`}>
                                            {c.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400 capitalize">{c.assignedTo?.replace(/_/g, ' ') || '—'}</td>
                                </tr>
                            ))}
                            {filteredComplaints.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No complaints found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* ── Section Detail Modal ── */}
            {selectedSection && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedSection(null)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Class {selectedSection.className}</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{selectedSection.branch} — Section {selectedSection.section}</p>
                            </div>
                            <button onClick={() => setSelectedSection(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                        </div>

                        {/* Teacher info */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                {selectedSection.teacher?.name?.[0] || '?'}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{selectedSection.teacher?.name || 'No teacher assigned'}</p>
                                <p className="text-xs text-gray-500">{selectedSection.teacher?.email}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Employee ID: {selectedSection.teacher?.employeeId || '—'}</p>
                            </div>
                        </div>

                        {/* Student list */}
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Students ({selectedSection.students.length})
                        </h4>
                        {selectedSection.students.length === 0 ? (
                            <p className="text-sm text-gray-400 py-4 text-center">No students registered for this class yet</p>
                        ) : (
                            <div className="space-y-2">
                                {selectedSection.students.map((s, i) => (
                                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                        <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{i + 1}</span>
                                        <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-semibold text-sm flex-shrink-0">
                                            {s.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
                                            <p className="text-xs text-gray-400">{s.registerNumber || '—'} · {s.email}</p>
                                        </div>
                                        <span className="text-xs text-primary-600 dark:text-primary-400 font-medium flex-shrink-0">
                                            {complaints.filter(c => c.studentId === s.uid).length} complaints
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </DashboardLayout>
    );
}
