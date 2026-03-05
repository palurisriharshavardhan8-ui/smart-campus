import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus } from 'lucide-react';
import {
    addDoc, collection, query, where, onSnapshot, serverTimestamp,
    Timestamp, getDocs, updateDoc, doc, arrayUnion,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import ComplaintProgressTracker from '../../components/ComplaintProgressTracker';
import toast from 'react-hot-toast';

const CATEGORIES = ['infrastructure', 'hostel', 'transport', 'academic'];

const STATUS_BADGE = {
    submitted: 'badge-pending',
    pending: 'badge-pending',
    under_review: 'badge-inprogress',
    'in-progress': 'badge-inprogress',
    forwarded: 'bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400',
    resolved: 'badge-resolved',
};

const DEPT_LABEL = {
    infrastructure: 'Infrastructure',
    hostel: 'Hostel',
    transport: 'Transport',
    academic: 'Academic',
};

export default function StudentComplaints() {
    const { currentUser, userProfile } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: 'infrastructure' });

    /* ── Real-time listener (single-field query — no composite index needed) ── */
    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'complaints'),
            where('studentId', '==', currentUser.uid),
        );
        return onSnapshot(q, snap => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Sort newest first client-side — avoids needing a Firestore composite index
            docs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
            setComplaints(docs);
        }, err => console.error('Complaints query error:', err));
    }, [currentUser]);

    /* ── Student confirms resolution ── */
    async function confirmResolved(c) {
        const entry = {
            stage: 'Resolved',
            actor: userProfile?.name || 'Student',
            message: 'Student confirmed complaint is resolved',
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', c.id), {
                status: 'resolved', assignedTo: 'resolved',
                resolvedAt: serverTimestamp(),
                trackingHistory: arrayUnion(entry),
            });
            toast.success('✅ Complaint confirmed as resolved!');
        } catch { toast.error('Failed to confirm'); }
    }

    /* ── Student raises complaint again ── */
    async function raiseAgain(c) {
        const entry = {
            stage: 'Reopened',
            actor: userProfile?.name || 'Student',
            message: 'Student rejected resolution — complaint reopened',
            timestamp: Timestamp.now(),
        };
        try {
            await updateDoc(doc(db, 'complaints', c.id), {
                status: 'forwarded', assignedTo: 'deptAdmin',
                trackingHistory: arrayUnion(entry),
            });
            toast.success('Complaint forwarded back to dept admin');
        } catch { toast.error('Failed to reopen complaint'); }
    }

    /* ── New complaint submit ── */
    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) return toast.error('Fill all fields');
        setLoading(true);
        try {
            // Look up class teacher from classes collection
            let classTeacherId = null;
            let classTeacherName = null;
            if (userProfile?.className) {
                const classSnap = await getDocs(
                    query(collection(db, 'classes'), where('className', '==', userProfile.className)),
                );
                if (!classSnap.empty) {
                    const cls = classSnap.docs[0].data();
                    classTeacherId = cls.teacherId || null;
                    classTeacherName = cls.teacherName || null;
                }
            }

            const initialEntry = {
                stage: 'Submitted',
                actor: userProfile?.name || 'Student',
                message: 'Complaint submitted by student',
                timestamp: Timestamp.now(),
            };

            await addDoc(collection(db, 'complaints'), {
                // Core fields
                title: form.title.trim(),
                description: form.description.trim(),
                category: form.category,
                status: 'submitted',
                // Student info
                studentId: currentUser.uid,
                studentName: userProfile?.name || 'Student',
                registerNumber: userProfile?.registerNumber || '',
                branch: userProfile?.branch || '',
                section: userProfile?.section || '',
                studentClass: userProfile?.className || '',
                // Routing
                assignedTo: classTeacherId ? 'classTeacher' : 'admin',
                classTeacherId,
                classTeacherName,
                adminDepartment: form.category,
                department: form.category,
                // Tracking
                trackingHistory: [initialEntry],
                createdAt: serverTimestamp(),
            });
            toast.success('Complaint submitted! 🎉');
            setForm({ title: '', description: '', category: 'infrastructure' });
            setShowForm(false);
        } catch {
            toast.error('Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    }

    const filtered = filter === 'all'
        ? complaints
        : complaints.filter(c =>
            filter === 'under_review'
                ? (c.status === 'under_review' || c.status === 'in-progress')
                : c.status === filter
        );

    return (
        <DashboardLayout title="My Complaints">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="page-title">My Complaints</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{complaints.length} total complaints</p>
                    </div>
                    <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        {showForm ? 'Cancel' : 'New Complaint'}
                    </button>
                </div>

                {/* Complaint Form */}
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="card mb-6 border-2 border-primary-200 dark:border-primary-800"
                    >
                        <h3 className="section-title mb-4">Submit New Complaint</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                                <input type="text" value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Brief title of your complaint"
                                    className="input-field" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Department Category</label>
                                <select value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="select-field capitalize">
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c} className="capitalize">{DEPT_LABEL[c]}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">
                                    Will be routed: You → Class Teacher → {DEPT_LABEL[form.category]} Admin
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                <textarea value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Describe your complaint in detail..."
                                    rows={4} className="input-field resize-none" required />
                            </div>

                            {/* Student info summary */}
                            {(userProfile?.registerNumber || userProfile?.branch) && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 text-xs text-gray-500 space-y-0.5">
                                    {userProfile.registerNumber && <p>Register No: <span className="font-medium">{userProfile.registerNumber}</span></p>}
                                    {userProfile.branch && <p>Branch / Section: <span className="font-medium">{userProfile.branch} – {userProfile.section}</span></p>}
                                    {userProfile.className && <p>Class: <span className="font-medium">{userProfile.className}</span></p>}
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button type="submit" disabled={loading} className="btn-primary flex-1">
                                    {loading ? 'Submitting...' : 'Submit Complaint'}
                                </button>
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Filter tabs */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {['all', 'submitted', 'under_review', 'forwarded', 'pending_confirmation', 'resolved'].map(s => (
                        <button key={s} onClick={() => setFilter(s)}
                            className={`px - 4 py - 1.5 rounded - full text - sm font - medium transition - all capitalize ${filter === s
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                } `}>
                            {s === 'all' ? `All(${complaints.length})` : s.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>

                {/* Complaints List */}
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="card text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-400">No complaints found</p>
                            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Submit your first complaint
                            </button>
                        </div>
                    ) : (
                        filtered.map((c, i) => (
                            <motion.div key={c.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`card hover: shadow - md transition - shadow ${c.status === 'pending_confirmation' ? 'border-2 border-orange-300 dark:border-orange-700' : ''} `}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.title}</h4>
                                            <span className={`badge ${STATUS_BADGE[c.status] || 'badge-pending'} capitalize`}>
                                                {c.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                                            <span className="capitalize">{DEPT_LABEL[c.category] || c.category} Dept</span>
                                            {c.registerNumber && <span>• {c.registerNumber}</span>}
                                            {c.branch && <span>• {c.branch}-{c.section}</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{c.description}</p>
                                    </div>
                                </div>

                                {/* Student Confirmation Banner */}
                                {c.status === 'pending_confirmation' && (
                                    <div className="mt-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                                        <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-1">🔔 Action Required</p>
                                        <p className="text-xs text-orange-600 dark:text-orange-300 mb-3">
                                            The department admin has marked this complaint as resolved.
                                            Please confirm if your issue is truly resolved, or raise it again if not.
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => confirmResolved(c)}
                                                className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors">
                                                ✅ Yes, Resolved!
                                            </button>
                                            <button onClick={() => raiseAgain(c)}
                                                className="flex-1 py-2 px-3 rounded-lg bg-red-100 dark:bg-red-900/20 hover:bg-red-200 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors">
                                                ❌ Not Resolved — Raise Again
                                            </button>
                                        </div>
                                    </div>
                                )}

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
            </div>
        </DashboardLayout>
    );
}
