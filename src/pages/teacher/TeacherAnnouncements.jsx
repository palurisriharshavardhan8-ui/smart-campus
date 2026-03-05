import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Trash2, Loader2, Clock, User } from 'lucide-react';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, query,
    where, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import toast from 'react-hot-toast';
import { formatDistanceToNow, format } from 'date-fns';

const GRAD_COLORS = ['from-primary-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-amber-500 to-orange-500', 'from-rose-500 to-pink-600'];

export default function TeacherAnnouncements() {
    const { currentUser, userProfile } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [form, setForm] = useState({ title: '', body: '' });
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const className = userProfile?.className;

    /* ── All announcements: campus-wide (no className) + this class ── */
    useEffect(() => {
        if (!className) return;
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [className]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.body.trim()) return toast.error('Fill all fields');
        setLoading(true);
        try {
            await addDoc(collection(db, 'announcements'), {
                ...form,
                className,                                      // scoped to this class
                postedByRole: 'classTeacher',
                createdBy: userProfile?.name || 'Teacher',
                teacherId: currentUser.uid,
                createdAt: serverTimestamp(),
            });
            toast.success('Announcement posted!');
            setForm({ title: '', body: '' });
            setShowForm(false);
        } catch { toast.error('Failed to post announcement'); }
        finally { setLoading(false); }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this announcement?')) return;
        try { await deleteDoc(doc(db, 'announcements', id)); toast.success('Deleted'); }
        catch { toast.error('Delete failed'); }
    }

    return (
        <DashboardLayout title="Class Announcements">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="page-title">Announcements</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Class <span className="font-semibold text-gray-700 dark:text-gray-300">{className}</span>
                            {' '}· {announcements.length} total
                        </p>
                    </div>
                    <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        {showForm ? 'Cancel' : 'New Announcement'}
                    </button>
                </div>

                {/* ── Form ── */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="card mb-6 border-2 border-primary-200 dark:border-primary-800">
                            <h3 className="section-title mb-4">Create Announcement</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                                    <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        placeholder="Announcement title" className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                                    <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                        placeholder="Write your announcement..." rows={4} className="input-field resize-none" required />
                                </div>
                                <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {loading ? 'Posting...' : 'Post Announcement'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── List ── */}
                <div className="space-y-4">
                    {announcements.length === 0 ? (
                        <div className="card text-center py-12">
                            <Megaphone className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-400">No announcements yet</p>
                        </div>
                    ) : announcements.map((a, i) => {
                        const isOwn = a.teacherId === currentUser.uid;
                        return (
                            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="card group">
                                <div className={`h-1 -mt-5 -mx-5 mb-4 rounded-t-xl bg-gradient-to-r ${GRAD_COLORS[i % GRAD_COLORS.length]}`} />
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                                            {a.className && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">{a.className}</span>
                                            )}
                                            {!a.className && (
                                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">Campus-wide</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a.body}</p>
                                        {/* Timestamp row */}
                                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                <User className="w-3 h-3" />
                                                <span>{a.createdBy}</span>
                                                {a.postedByRole && (
                                                    <span className="capitalize text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 ml-1">{a.postedByRole.replace('classTeacher', 'Teacher')}</span>
                                                )}
                                            </div>
                                            {a.createdAt && (
                                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{format(a.createdAt.toDate?.() || new Date(a.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
                                                    <span className="text-gray-300 dark:text-gray-600 mx-1">·</span>
                                                    <span className="italic">{formatDistanceToNow(a.createdAt.toDate?.() || new Date(a.createdAt), { addSuffix: true })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isOwn && (
                                        <button onClick={() => handleDelete(a.id)}
                                            className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
