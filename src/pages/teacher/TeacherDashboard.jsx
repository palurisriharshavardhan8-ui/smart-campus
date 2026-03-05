import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, ClipboardList, CheckCircle, Clock, ArrowRight,
} from 'lucide-react';
import {
    collection, onSnapshot, query, where, orderBy, limit, Timestamp,
    arrayUnion, updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import StatCard from '../../components/StatCard';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_BADGE = {
    submitted: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    under_review: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    'in-progress': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    resolved: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
};

export default function TeacherDashboard() {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState([]);

    /* ── Real-time listener ── */
    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'complaints'),
            where('classTeacherId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
            limit(20),
        );
        return onSnapshot(q, snap =>
            setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        );
    }, [currentUser]);

    const submitted = complaints.filter(c => c.status === 'submitted' || c.status === 'pending').length;
    const inReview = complaints.filter(c => c.status === 'under_review').length;
    const forwarded = complaints.filter(c => c.status === 'forwarded').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    /* ── Status helpers with trackingHistory ── */
    async function markUnderReview(complaint) {
        const entry = {
            stage: 'Under Review',
            actor: userProfile?.name || 'Class Teacher',
            message: 'Complaint is being reviewed by class teacher',
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', complaint.id), {
                status: 'under_review',
                assignedTo: 'classTeacher',
                updatedAt: serverTimestamp(),
                trackingHistory: arrayUnion(entry),
            });
            toast.success('Marked as Under Review');
        } catch {
            toast.error('Failed to update status');
        }
    }

    async function forwardToAdmin(complaint) {
        const dept = complaint.adminDepartment || complaint.category || 'admin';
        const entry = {
            stage: 'Forwarded',
            actor: userProfile?.name || 'Class Teacher',
            message: `Forwarded to ${dept.charAt(0).toUpperCase() + dept.slice(1)} Department Admin`,
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', complaint.id), {
                status: 'forwarded',
                assignedTo: 'deptAdmin',
                updatedAt: serverTimestamp(),
                trackingHistory: arrayUnion(entry),
            });
            toast.success(`Forwarded to ${dept} dept admin`);
        } catch {
            toast.error('Failed to forward complaint');
        }
    }

    return (
        <DashboardLayout title="Teacher Dashboard">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome, <span className="gradient-text">{userProfile?.name?.split(' ')[0] || 'Teacher'}</span> 👋
                </h2>
                <p className="text-gray-500 mt-1">Review and forward student complaints from your class in real time.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={ClipboardList} label="New" value={submitted} color="amber" index={0} />
                <StatCard icon={Clock} label="Under Review" value={inReview} color="blue" index={1} />
                <StatCard icon={ArrowRight} label="Forwarded" value={forwarded} color="purple" index={2} />
                <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" index={3} />
            </div>

            {/* Complaint table */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden p-0">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="section-title">Class Complaints</h3>
                    <button onClick={() => navigate('/teacher/complaints')} className="btn-primary text-xs py-1.5 px-3">
                        View All
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                                {['Student', 'Reg No / Class', 'Title', 'Dept', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {complaints.slice(0, 8).map((c, i) => (
                                <motion.tr key={c.id}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30"
                                >
                                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{c.studentName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        <p>{c.registerNumber || '—'}</p>
                                        <p>{c.studentClass || ''}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-xs">
                                        <p className="truncate">{c.title}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">{c.category}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`badge capitalize ${STATUS_BADGE[c.status] || STATUS_BADGE.submitted}`}>
                                            {c.status?.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2 flex-wrap">
                                            {(c.status === 'submitted' || c.status === 'pending') && (
                                                <button onClick={() => markUnderReview(c)}
                                                    className="text-xs px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-medium">
                                                    Review
                                                </button>
                                            )}
                                            {(c.status !== 'forwarded' && c.status !== 'resolved') && (
                                                <button onClick={() => forwardToAdmin(c)}
                                                    className="text-xs px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 font-medium flex items-center gap-1">
                                                    <ArrowRight className="w-3 h-3" /> Forward
                                                </button>
                                            )}
                                            {(c.status === 'forwarded' || c.status === 'resolved') && (
                                                <span className="text-xs text-gray-400 italic capitalize">{c.status}</span>
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
        </DashboardLayout>
    );
}
