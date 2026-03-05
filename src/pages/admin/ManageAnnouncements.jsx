import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Plus, Trash2, Loader2 } from 'lucide-react';
import {
    collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function ManageAnnouncements() {
    const { userProfile } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [form, setForm] = useState({ title: '', body: '' });
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, snap => setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.body.trim()) return toast.error('Fill all fields');
        setLoading(true);
        try {
            await addDoc(collection(db, 'announcements'), {
                ...form,
                createdBy: userProfile?.name || 'Admin',
                createdAt: serverTimestamp(),
            });
            toast.success('Announcement posted!');
            setForm({ title: '', body: '' });
            setShowForm(false);
        } catch {
            toast.error('Failed to post announcement');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this announcement?')) return;
        try {
            await deleteDoc(doc(db, 'announcements', id));
            toast.success('Deleted');
        } catch {
            toast.error('Delete failed');
        }
    }

    return (
        <DashboardLayout title="Manage Announcements">
            <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="page-title">Announcements</h2>
                        <p className="text-sm text-gray-500 mt-0.5">{announcements.length} announcements</p>
                    </div>
                    <button onClick={() => setShowForm(s => !s)} className="btn-primary flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        {showForm ? 'Cancel' : 'New Announcement'}
                    </button>
                </div>

                {/* Form */}
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card mb-6 border-2 border-primary-200 dark:border-primary-800"
                    >
                        <h3 className="section-title mb-4">Create Announcement</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Announcement title"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                                <textarea
                                    value={form.body}
                                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                                    placeholder="Write your announcement message..."
                                    rows={5}
                                    className="input-field resize-none"
                                    required
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </form>
                    </motion.div>
                )}

                {/* List */}
                <div className="space-y-4">
                    {announcements.length === 0 ? (
                        <div className="card text-center py-12">
                            <Megaphone className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-gray-400">No announcements yet</p>
                        </div>
                    ) : (
                        announcements.map((a, i) => (
                            <motion.div
                                key={a.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="card"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{a.body}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="text-xs text-gray-400">By {a.createdBy}</span>
                                            {a.createdAt && (
                                                <>
                                                    <span className="text-gray-200 dark:text-gray-700">•</span>
                                                    <span className="text-xs text-gray-400">
                                                        {formatDistanceToNow(a.createdAt.toDate?.() || new Date(), { addSuffix: true })}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(a.id)}
                                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
