import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Filter, Search } from 'lucide-react';
import {
    collection, addDoc, serverTimestamp, onSnapshot,
    query, where, orderBy,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import toast from 'react-hot-toast';

const CATEGORIES = ['Infrastructure', 'Faculty', 'Academic', 'Hostel', 'Transport'];
const STATUS_BADGE = {
    pending: 'badge-pending',
    'in-progress': 'badge-inprogress',
    resolved: 'badge-resolved',
};

export default function StudentComplaints() {
    const { currentUser, userProfile } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', category: 'Infrastructure' });

    useEffect(() => {
        if (!currentUser) return;
        const q = query(
            collection(db, 'complaints'),
            where('studentId', '==', currentUser.uid),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, snap => setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    }, [currentUser]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) return toast.error('Fill all fields');
        setLoading(true);
        try {
            await addDoc(collection(db, 'complaints'), {
                ...form,
                status: 'pending',
                studentId: currentUser.uid,
                studentName: userProfile?.name || 'Student',
                createdAt: serverTimestamp(),
            });
            toast.success('Complaint submitted successfully!');
            setForm({ title: '', description: '', category: 'Infrastructure' });
            setShowForm(false);
        } catch {
            toast.error('Failed to submit complaint');
        } finally {
            setLoading(false);
        }
    }

    const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

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
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card mb-6 border-2 border-primary-200 dark:border-primary-800"
                    >
                        <h3 className="section-title mb-4">Submit New Complaint</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                    placeholder="Brief title of your complaint"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="select-field"
                                >
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Describe your complaint in detail..."
                                    rows={4}
                                    className="input-field resize-none"
                                    required
                                />
                            </div>
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
                    {['all', 'pending', 'in-progress', 'resolved'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${filter === s
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {s === 'all' ? `All (${complaints.length})` : s}
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
                            <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="card hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{c.title}</h4>
                                            <span className={`badge ${STATUS_BADGE[c.status] || 'badge-pending'}`}>{c.status}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">{c.category}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{c.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
