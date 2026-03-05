import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, ArrowRight } from 'lucide-react';
import {
    collection, onSnapshot, query, where, orderBy,
    updateDoc, doc, serverTimestamp, arrayUnion, Timestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import ComplaintProgressTracker from '../../components/ComplaintProgressTracker';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
    submitted: 'badge-pending',
    pending: 'badge-pending',
    under_review: 'badge-inprogress',
    'in-progress': 'badge-inprogress',
    forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    resolved: 'badge-resolved',
};

export default function TeacherComplaints() {
    const { currentUser, userProfile } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expanded, setExpanded] = useState(null); // expanded complaint id

    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'complaints'),
            where('classTeacherId', '==', currentUser.uid),
            orderBy('createdAt', 'desc'),
        );
        return onSnapshot(q, snap =>
            setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
        );
    }, [currentUser]);

    async function changeStatus(complaint, newStatus) {
        const STAGE_MAP = { under_review: 'Under Review', forwarded: 'Forwarded', resolved: 'Resolved' };
        const MSG_MAP = {
            under_review: 'Complaint is being reviewed by class teacher',
            forwarded: `Forwarded to ${(complaint.adminDepartment || complaint.category || 'Department').charAt(0).toUpperCase() + (complaint.adminDepartment || complaint.category || '').slice(1)} Admin`,
            resolved: 'Complaint has been resolved',
        };
        const ASSIGN_MAP = { under_review: 'classTeacher', forwarded: 'deptAdmin', resolved: 'resolved' };

        const entry = {
            stage: STAGE_MAP[newStatus] || newStatus,
            actor: userProfile?.name || 'Class Teacher',
            message: MSG_MAP[newStatus] || `Status updated to ${newStatus}`,
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', complaint.id), {
                status: newStatus,
                assignedTo: ASSIGN_MAP[newStatus] || 'classTeacher',
                updatedAt: serverTimestamp(),
                trackingHistory: arrayUnion(entry),
            });
            toast.success(`Status → ${newStatus.replace(/_/g, ' ')}`);
        } catch {
            toast.error('Update failed');
        }
    }

    const filtered = complaints
        .filter(c => statusFilter === 'all' || c.status === statusFilter)
        .filter(c => !search ||
            c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            c.registerNumber?.toLowerCase().includes(search.toLowerCase()),
        );

    return (
        <DashboardLayout title="Class Complaints">
            <div className="mb-6">
                <h2 className="page-title">My Class Complaints</h2>
                <p className="text-sm text-gray-500 mt-0.5">{complaints.length} total • real-time updates</p>
            </div>

            {/* Filters */}
            <div className="card mb-6 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by student, title, reg no..." className="input-field pl-9" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-auto capitalize">
                    {['all', 'submitted', 'under_review', 'forwarded', 'resolved'].map(s => (
                        <option key={s} value={s} className="capitalize">{s === 'all' ? 'All Status' : s.replace(/_/g, ' ')}</option>
                    ))}
                </select>
            </div>

            {/* Card list */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="card text-center py-12 text-gray-400">
                        <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No complaints found</p>
                    </div>
                ) : (
                    filtered.map((c, i) => (
                        <motion.div key={c.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="card hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.title}</h4>
                                        <span className={`badge capitalize ${STATUS_BADGE[c.status] || 'badge-pending'}`}>
                                            {c.status?.replace(/_/g, ' ')}
                                        </span>
                                        <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">{c.category}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                        <span className="font-medium text-gray-600 dark:text-gray-400">{c.studentName}</span>
                                        {c.registerNumber && <span>• {c.registerNumber}</span>}
                                        {c.studentClass && <span>• {c.studentClass}</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{c.description}</p>
                                </div>

                                {/* Action buttons */}
                                <div className="flex flex-col gap-2 flex-shrink-0">
                                    {(c.status === 'submitted' || c.status === 'pending') && (
                                        <button onClick={() => changeStatus(c, 'under_review')}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-medium">
                                            Mark Review
                                        </button>
                                    )}
                                    {c.status !== 'forwarded' && c.status !== 'resolved' && (
                                        <button onClick={() => changeStatus(c, 'forwarded')}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 font-medium flex items-center gap-1">
                                            <ArrowRight className="w-3 h-3" /> Forward
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Progress tracker inline */}
                            <ComplaintProgressTracker
                                status={c.status}
                                trackingHistory={c.trackingHistory}
                                assignedTo={c.assignedTo}
                            />
                        </motion.div>
                    ))
                )}
            </div>
        </DashboardLayout>
    );
}
