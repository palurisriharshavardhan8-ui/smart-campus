import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Search, CheckCircle } from 'lucide-react';
import {
    collection, onSnapshot, query, orderBy,
    updateDoc, doc, serverTimestamp, arrayUnion, Timestamp, where,
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
    pending_confirmation: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    student_confirmed: 'bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400',
    resolved: 'badge-resolved',
};

export default function ManageComplaints() {
    const { userProfile } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('all');

    /* ── Real-time listener (dept-filtered for dept admins, client-side sort) ── */
    useEffect(() => {
        if (!userProfile) return;
        // Use single-field query only — composite index not needed
        const q = userProfile?.department
            ? query(collection(db, 'complaints'), where('adminDepartment', '==', userProfile.department))
            : query(collection(db, 'complaints'));
        return onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
            setComplaints(docs);
        }, err => console.error('complaints listener:', err));
    }, [userProfile]);

    /* ── Status update with tracking entry ── */
    async function handleStatus(complaint, newStatus) {
        const STAGE_MAP = {
            submitted: 'Submitted',
            under_review: 'Under Review',
            forwarded: 'Forwarded',
            pending_confirmation: 'Pending Confirmation',
            resolved: 'Resolved',
        };
        const MSG_MAP = {
            submitted: 'Status reset to submitted',
            under_review: 'Admin marked as under review',
            forwarded: 'Forwarded to department admin',
            pending_confirmation: `Marked resolved by ${userProfile?.name || 'Admin'} — Awaiting student confirmation`,
            resolved: `Confirmed resolved by ${userProfile?.name || 'Admin'}`,
        };

        const entry = {
            stage: STAGE_MAP[newStatus] || newStatus,
            actor: userProfile?.name || 'Admin',
            message: MSG_MAP[newStatus] || `Status updated to ${newStatus}`,
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', complaint.id), {
                status: newStatus,
                assignedTo: newStatus === 'pending_confirmation' ? 'student'
                    : newStatus === 'resolved' ? 'resolved'
                        : userProfile?.department ? `${userProfile.department}Admin` : 'admin',
                updatedAt: serverTimestamp(),
                trackingHistory: arrayUnion(entry),
            });
            toast.success(`Status → ${newStatus.replace(/_/g, ' ')}`);
        } catch { toast.error('Update failed'); }
    }

    const CATEGORIES = ['All', 'infrastructure', 'hostel', 'transport', 'academic'];

    const filtered = complaints
        .filter(c => catFilter === 'All' || c.category === catFilter)
        .filter(c => statusFilter === 'all' || c.status === statusFilter || (statusFilter === 'under_review' && c.status === 'in-progress') || (statusFilter === 'submitted' && c.status === 'pending'))
        .filter(c =>
            !search ||
            c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.studentName?.toLowerCase().includes(search.toLowerCase()) ||
            c.registerNumber?.toLowerCase().includes(search.toLowerCase()),
        );

    return (
        <DashboardLayout title="Manage Complaints">
            <div className="mb-6">
                <h2 className="page-title">Complaints Management</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                    {complaints.length} complaints{userProfile?.department ? ` — ${userProfile.department} dept` : ''} • real-time
                </p>
            </div>

            {/* Filters */}
            <div className="card mb-6 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search complaints..." className="input-field pl-9" />
                </div>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="select-field w-auto capitalize">
                    {CATEGORIES.map(c => <option key={c} className="capitalize">{c}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-field w-auto capitalize">
                    {['all', 'submitted', 'under_review', 'forwarded', 'resolved'].map(s => (
                        <option key={s} value={s} className="capitalize">
                            {s === 'all' ? 'All Status' : s.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </div>

            {/* Complaint cards */}
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
                            {/* Header row */}
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
                                        {c.branch && <span>• {c.branch}-{c.section}</span>}
                                        {c.studentClass && <span>• {c.studentClass}</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{c.description}</p>
                                </div>

                                {/* Status dropdown */}
                                <div className="flex-shrink-0">
                                    <select value={c.status} onChange={e => handleStatus(c, e.target.value)}
                                        className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500/30 cursor-pointer">
                                        <option value="submitted">Submitted</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="forwarded">Forwarded</option>
                                        <option value="pending_confirmation">⏳ Await Confirmation</option>
                                        <option value="resolved" disabled={c.status !== 'pending_confirmation'}>✓ Resolved (by student)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Progress tracker + timeline */}
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
